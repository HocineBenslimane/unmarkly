/*
  # Add replay attack protection

  1. New Tables
    - `request_nonces` - Tracks used nonces to prevent replay attacks
      - `id` (uuid, primary key)
      - `nonce` (text, unique) - The nonce from encrypted requests
      - `fingerprint` (text) - User fingerprint for tracking
      - `created_at` (timestamp) - When the nonce was used
      - `expires_at` (timestamp) - When the nonce entry can be deleted
  
  2. Security
    - Enable RLS on `request_nonces` table
    - Add policy to allow insertion of new nonces
    - Add policy to prevent modification of existing nonces
    - Add indexes for efficient lookups and cleanup

  3. Important Notes
    - Nonces expire after 1 hour to limit database growth
    - Automatic cleanup of expired entries via scheduled function
    - Prevents replay attacks by rejecting duplicate nonces
*/

CREATE TABLE IF NOT EXISTS request_nonces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce text UNIQUE NOT NULL,
  fingerprint text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '1 hour')
);

ALTER TABLE request_nonces ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_request_nonces_nonce ON request_nonces(nonce);
CREATE INDEX IF NOT EXISTS idx_request_nonces_expires_at ON request_nonces(expires_at);
CREATE INDEX IF NOT EXISTS idx_request_nonces_fingerprint ON request_nonces(fingerprint);

CREATE POLICY "Allow insertion of new nonces"
  ON request_nonces
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Prevent modification of nonces"
  ON request_nonces
  FOR UPDATE
  TO service_role
  USING (false);

CREATE POLICY "Prevent deletion of nonces"
  ON request_nonces
  FOR DELETE
  TO service_role
  USING (false);
