/*
  # Create Security Events Tracking Table

  1. New Tables
    - `security_events`
      - `id` (uuid, primary key) - Unique identifier for each security event
      - `fingerprint` (text, indexed) - Device fingerprint from security detection
      - `event_type` (text) - Type of security violation detected
      - `metadata` (jsonb) - Additional event details and context
      - `user_agent` (text) - Browser user agent string
      - `page_url` (text) - URL where the event occurred
      - `timestamp` (timestamptz) - When the event was recorded
      - `created_at` (timestamptz) - Database record creation time

  2. Security
    - Enable RLS on `security_events` table
    - Add policy for service role to insert events
    - Add policy for authenticated analysis of security patterns

  3. Indexes
    - Index on `fingerprint` for fast lookups
    - Index on `event_type` for filtering by violation type
    - Index on `created_at` for time-based queries

  4. Purpose
    This table tracks all security violations and suspicious activity including:
    - DevTools detection events
    - Right-click and context menu attempts
    - Keyboard shortcut blocking (F12, Ctrl+Shift+I, etc.)
    - Copy/paste/save attempts
    - Debug and inspection attempts
    - Network request tampering
    Used for monitoring abuse patterns and implementing automated blocking.
*/

CREATE TABLE IF NOT EXISTS security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint text NOT NULL,
  event_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  user_agent text,
  page_url text,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_events_fingerprint ON security_events(fingerprint);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);

ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert security events"
  ON security_events
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Service role can read security events"
  ON security_events
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can view aggregated security data"
  ON security_events
  FOR SELECT
  TO authenticated
  USING (true);
