/*
  # Fix Security Issues: Remove Unused Indexes and Fix RLS Policies

  1. Unused Indexes
    - Drop `idx_request_nonces_nonce` (unused)
    - Drop `idx_request_nonces_expires_at` (unused)
    - Drop `idx_request_nonces_fingerprint` (unused)
  
  2. RLS Security
    - Fix `security_events` table INSERT policy to be restrictive
    - Change policy from always true to deny all access for anon/authenticated unless authorized
  
  3. Auth Connection Strategy
    - Note: Auth connection strategy must be configured in Supabase dashboard settings
    - Change from fixed 10 connections to percentage-based allocation
*/

-- Drop unused indexes on request_nonces table
DROP INDEX IF EXISTS idx_request_nonces_nonce;
DROP INDEX IF EXISTS idx_request_nonces_expires_at;
DROP INDEX IF EXISTS idx_request_nonces_fingerprint;

-- Fix RLS policy on security_events table - remove the overly permissive policy
DROP POLICY IF EXISTS "Service role can insert security events" ON public.security_events;

-- Add a more restrictive policy that only allows edge functions (service role) to insert
CREATE POLICY "Only service role can insert security events"
  ON public.security_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Prevent any other role from inserting
CREATE POLICY "Prevent unauthorized insertions"
  ON public.security_events
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);
