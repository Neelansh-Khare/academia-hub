-- Migration to support threaded discussions in Community Q&A (Task 10.2)

ALTER TABLE public.answers ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.answers(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_answers_parent ON public.answers(parent_id);

-- Update RLS (already covered by existing policies, but good to double check)
-- Existing policies for answers allow viewing all and creating by authenticated.
