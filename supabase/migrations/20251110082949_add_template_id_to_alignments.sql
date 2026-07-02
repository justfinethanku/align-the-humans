-- Add template_id column to alignments table
-- This allows alignments to reference the template they were created from

ALTER TABLE public.alignments
ADD COLUMN template_id uuid REFERENCES public.templates(id) ON DELETE SET NULL;

-- Add index for performance when querying by template
CREATE INDEX idx_alignments_template_id ON public.alignments(template_id);

-- Add comment for documentation
COMMENT ON COLUMN public.alignments.template_id IS 'References the template used to create this alignment';
