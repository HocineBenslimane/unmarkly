/*
  # Rate Limiting System

  1. New Tables
    - `rate_limits`
      - `id` (uuid, primary key)
      - `fingerprint` (text, indexed) - Device fingerprint hash
      - `ip_address` (text, indexed) - User's IP address
      - `download_count` (integer) - Number of downloads used
      - `last_download_at` (timestamptz) - Timestamp of last download
      - `reset_at` (timestamptz) - When the limit resets
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `rate_limits` table
    - Add policy for service role to manage rate limits
    - Add indexes for fast lookups by fingerprint and IP
  
  3. Notes
    - Rate limits reset after 24 hours
    - Combines fingerprint + IP for better tracking
    - Default limit is 3 downloads per fingerprint per day
*/

CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint text NOT NULL,
  ip_address text NOT NULL,
  download_count integer DEFAULT 0 NOT NULL,
  last_download_at timestamptz,
  reset_at timestamptz DEFAULT (now() + interval '24 hours') NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage rate limits"
  ON rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_rate_limits_fingerprint ON rate_limits(fingerprint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_address ON rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON rate_limits(reset_at);

-- Function to clean up expired rate limits
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rate_limits WHERE reset_at < now();
END;
$$;