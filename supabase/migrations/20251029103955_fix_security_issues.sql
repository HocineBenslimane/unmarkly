/*
  # Fix Security Issues

  1. Index Optimization
    - Remove unused indexes that are not being queried
    - Keep only indexes that are actively used in queries
    - IP indexes removed as IP-based queries are not primary lookup method
    - Timestamp indexes removed as time-based behavioral queries not implemented

  2. Function Security
    - Add explicit search_path to all functions
    - Sets search_path to 'public' to prevent search path injection attacks
    - Prevents malicious schemas from being used in function execution

  3. Notes
    - Keeping fingerprint-based indexes as they are actively used
    - Keeping hardware/canvas/webgl indexes for similar device detection
    - All functions now have immutable search paths
*/

-- Drop unused indexes
DROP INDEX IF EXISTS idx_rate_limits_ip_address;
DROP INDEX IF EXISTS idx_fingerprint_history_ip;
DROP INDEX IF EXISTS idx_behavioral_signals_ip;
DROP INDEX IF EXISTS idx_behavioral_signals_timestamp;
DROP INDEX IF EXISTS idx_blocked_fingerprints_ip;

-- Fix cleanup_expired_rate_limits function with explicit search_path
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM rate_limits WHERE reset_at < now();
END;
$$;

-- Fix find_similar_devices function with explicit search_path
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
SET search_path = public
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

-- Fix calculate_suspicious_score function with explicit search_path
CREATE OR REPLACE FUNCTION calculate_suspicious_score(
  p_fingerprint text,
  p_ip_address text,
  p_hardware_fp text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
