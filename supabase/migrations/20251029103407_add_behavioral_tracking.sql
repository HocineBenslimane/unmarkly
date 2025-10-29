/*
  # Add Behavioral Tracking and Anomaly Detection

  1. New Tables
    - `fingerprint_history`
      - Tracks fingerprint changes over time to detect suspicious behavior
      - Stores component hashes for fuzzy matching
    - `behavioral_signals`
      - Tracks user behavior patterns (timing, sequences, etc.)
      - Detects automated/bot-like behavior
    - `blocked_fingerprints`
      - Permanent block list for abusive users

  2. Changes to Existing Tables
    - Add columns to `rate_limits` for enhanced tracking

  3. Security
    - Enable RLS on all new tables
    - Service role access only

  4. Notes
    - Detects when users try to bypass limits by:
      - Switching browsers
      - Using incognito mode
      - Clearing cookies
      - Using VPN/proxy
    - Uses fuzzy matching on hardware fingerprints to catch same device
*/

-- Add columns to rate_limits for enhanced tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rate_limits' AND column_name = 'hardware_fingerprint'
  ) THEN
    ALTER TABLE rate_limits ADD COLUMN hardware_fingerprint text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rate_limits' AND column_name = 'canvas_fingerprint'
  ) THEN
    ALTER TABLE rate_limits ADD COLUMN canvas_fingerprint text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rate_limits' AND column_name = 'webgl_fingerprint'
  ) THEN
    ALTER TABLE rate_limits ADD COLUMN webgl_fingerprint text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rate_limits' AND column_name = 'suspicious_score'
  ) THEN
    ALTER TABLE rate_limits ADD COLUMN suspicious_score integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rate_limits' AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE rate_limits ADD COLUMN user_agent text;
  END IF;
END $$;

-- Fingerprint history table
CREATE TABLE IF NOT EXISTS fingerprint_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint text NOT NULL,
  hardware_fingerprint text NOT NULL,
  canvas_fingerprint text,
  webgl_fingerprint text,
  ip_address text NOT NULL,
  user_agent text,
  first_seen_at timestamptz DEFAULT now() NOT NULL,
  last_seen_at timestamptz DEFAULT now() NOT NULL,
  visit_count integer DEFAULT 1 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE fingerprint_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage fingerprint history"
  ON fingerprint_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_fingerprint_history_fingerprint ON fingerprint_history(fingerprint);
CREATE INDEX IF NOT EXISTS idx_fingerprint_history_hardware ON fingerprint_history(hardware_fingerprint);
CREATE INDEX IF NOT EXISTS idx_fingerprint_history_ip ON fingerprint_history(ip_address);

-- Behavioral signals table
CREATE TABLE IF NOT EXISTS behavioral_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint text NOT NULL,
  ip_address text NOT NULL,
  action_type text NOT NULL,
  action_timestamp timestamptz DEFAULT now() NOT NULL,
  time_since_page_load integer,
  sequence_order integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE behavioral_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage behavioral signals"
  ON behavioral_signals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_behavioral_signals_fingerprint ON behavioral_signals(fingerprint);
CREATE INDEX IF NOT EXISTS idx_behavioral_signals_ip ON behavioral_signals(ip_address);
CREATE INDEX IF NOT EXISTS idx_behavioral_signals_timestamp ON behavioral_signals(action_timestamp);

-- Blocked fingerprints table
CREATE TABLE IF NOT EXISTS blocked_fingerprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint text NOT NULL,
  hardware_fingerprint text,
  ip_address text,
  reason text NOT NULL,
  blocked_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz,
  is_permanent boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE blocked_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage blocked fingerprints"
  ON blocked_fingerprints
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_blocked_fingerprints_fingerprint ON blocked_fingerprints(fingerprint);
CREATE INDEX IF NOT EXISTS idx_blocked_fingerprints_hardware ON blocked_fingerprints(hardware_fingerprint);
CREATE INDEX IF NOT EXISTS idx_blocked_fingerprints_ip ON blocked_fingerprints(ip_address);

-- Function to detect similar devices (fuzzy matching)
CREATE OR REPLACE FUNCTION find_similar_devices(
  p_hardware_fp text,
  p_canvas_fp text,
  p_webgl_fp text,
  p_ip_address text
)
RETURNS TABLE(
  fingerprint text,
  similarity_score integer,
  download_count integer,
  last_download_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rl.fingerprint,
    (
      CASE WHEN rl.hardware_fingerprint = p_hardware_fp THEN 40 ELSE 0 END +
      CASE WHEN rl.canvas_fingerprint = p_canvas_fp THEN 30 ELSE 0 END +
      CASE WHEN rl.webgl_fingerprint = p_webgl_fp THEN 20 ELSE 0 END +
      CASE WHEN rl.ip_address = p_ip_address THEN 10 ELSE 0 END
    ) as similarity_score,
    rl.download_count,
    rl.last_download_at
  FROM rate_limits rl
  WHERE
    rl.reset_at > now()
    AND (
      rl.hardware_fingerprint = p_hardware_fp
      OR rl.canvas_fingerprint = p_canvas_fp
      OR rl.webgl_fingerprint = p_webgl_fp
      OR rl.ip_address = p_ip_address
    )
  ORDER BY similarity_score DESC;
END;
$$;

-- Function to calculate suspicious score
CREATE OR REPLACE FUNCTION calculate_suspicious_score(
  p_fingerprint text,
  p_ip_address text,
  p_hardware_fp text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_score integer := 0;
  v_fingerprint_changes integer;
  v_rapid_requests integer;
  v_ip_changes integer;
BEGIN
  -- Check for multiple fingerprints from same hardware in short time
  SELECT COUNT(DISTINCT fingerprint)
  INTO v_fingerprint_changes
  FROM fingerprint_history
  WHERE hardware_fingerprint = p_hardware_fp
    AND first_seen_at > now() - interval '1 hour';

  IF v_fingerprint_changes > 3 THEN
    v_score := v_score + 30;
  ELSIF v_fingerprint_changes > 2 THEN
    v_score := v_score + 20;
  END IF;

  -- Check for rapid sequential requests (bot-like behavior)
  SELECT COUNT(*)
  INTO v_rapid_requests
  FROM behavioral_signals
  WHERE fingerprint = p_fingerprint
    AND action_timestamp > now() - interval '1 minute'
    AND time_since_page_load < 2000;

  IF v_rapid_requests > 5 THEN
    v_score := v_score + 40;
  ELSIF v_rapid_requests > 3 THEN
    v_score := v_score + 20;
  END IF;

  -- Check for multiple IP addresses for same hardware
  SELECT COUNT(DISTINCT ip_address)
  INTO v_ip_changes
  FROM fingerprint_history
  WHERE hardware_fingerprint = p_hardware_fp
    AND last_seen_at > now() - interval '1 hour';

  IF v_ip_changes > 3 THEN
    v_score := v_score + 30;
  ELSIF v_ip_changes > 2 THEN
    v_score := v_score + 15;
  END IF;

  RETURN v_score;
END;
$$;
