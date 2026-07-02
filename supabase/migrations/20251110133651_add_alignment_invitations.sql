-- =========================================
-- Add Alignment Invitations System
-- =========================================
-- Enables secure share links for inviting partners to alignments
-- Tokens are hashed for security, supports expiration and usage limits

-- Create alignment_invitations table
CREATE TABLE IF NOT EXISTS public.alignment_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alignment_id UUID NOT NULL REFERENCES public.alignments(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  invalidated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_alignment_invitations_token_hash
  ON public.alignment_invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_alignment_invitations_alignment_id
  ON public.alignment_invitations(alignment_id);
CREATE INDEX IF NOT EXISTS idx_alignment_invitations_created_by
  ON public.alignment_invitations(created_by);

-- Add columns to alignments table
ALTER TABLE public.alignments
  ADD COLUMN IF NOT EXISTS current_invite_id UUID REFERENCES public.alignment_invitations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS allow_solo_start BOOLEAN DEFAULT true;

-- Enable RLS on alignment_invitations table
ALTER TABLE public.alignment_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view and manage invites they created
CREATE POLICY "Users can manage their alignment invites"
  ON public.alignment_invitations
  FOR ALL
  USING (created_by = auth.uid());

-- RLS Policy: Users can view invites for alignments they participate in
CREATE POLICY "Participants can view alignment invites"
  ON public.alignment_invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.alignment_participants
      WHERE alignment_participants.alignment_id = alignment_invitations.alignment_id
        AND alignment_participants.user_id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON TABLE public.alignment_invitations IS 'Stores secure invite tokens for sharing alignments via link. Tokens are hashed for security.';
COMMENT ON COLUMN public.alignment_invitations.token_hash IS 'SHA-256 hash of the raw invite token';
COMMENT ON COLUMN public.alignment_invitations.max_uses IS 'Maximum number of times this invite can be used (default: 1 for single-use links)';
COMMENT ON COLUMN public.alignment_invitations.current_uses IS 'Number of times this invite has been used';
COMMENT ON COLUMN public.alignment_invitations.invalidated_at IS 'Timestamp when invite was manually invalidated';
COMMENT ON COLUMN public.alignments.current_invite_id IS 'Currently active invite for this alignment (if any)';
COMMENT ON COLUMN public.alignments.allow_solo_start IS 'Whether creator can start alignment before partner joins';
