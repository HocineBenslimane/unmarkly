/*
  # Fix Database Security Issues

  1. Remove Unused Indexes
    - Drop idx_security_events_fingerprint (unused)
    - Drop idx_security_events_event_type (unused)
    - Drop idx_security_events_created_at (unused)

  2. Fix Function Search Path Mutable Issue
    - Update get_feature_flag function to use SECURITY DEFINER with immutable search_path
    - Set search_path to restrict to specific schemas

  3. Security Impact
    - Removes unused indexes that consume storage and slow down writes
    - Prevents potential search_path attacks by locking function execution context
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'security_events' 
    AND indexname = 'idx_security_events_fingerprint'
  ) THEN
    DROP INDEX IF EXISTS public.idx_security_events_fingerprint;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'security_events' 
    AND indexname = 'idx_security_events_event_type'
  ) THEN
    DROP INDEX IF EXISTS public.idx_security_events_event_type;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'security_events' 
    AND indexname = 'idx_security_events_created_at'
  ) THEN
    DROP INDEX IF EXISTS public.idx_security_events_created_at;
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.get_feature_flag(text);

CREATE OR REPLACE FUNCTION public.get_feature_flag(p_flag_name text)
RETURNS RECORD AS $$
DECLARE
  v_flag RECORD;
BEGIN
  SELECT enabled, metadata INTO v_flag FROM feature_flags WHERE flag_name = p_flag_name;
  RETURN v_flag;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public;
