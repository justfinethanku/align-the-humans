-- Fix partner_id nullable constraint (final fix)
-- Previous migration 20251110185248 failed due to circular dependencies
-- This is a clean, standalone fix

ALTER TABLE public.alignments ALTER COLUMN partner_id DROP NOT NULL;
