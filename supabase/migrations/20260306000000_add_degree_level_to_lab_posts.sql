-- Add degree_level to lab_posts
ALTER TABLE public.lab_posts
ADD COLUMN IF NOT EXISTS degree_level text DEFAULT 'any'; -- 'undergraduate', 'masters', 'phd', 'postdoc', 'any'

-- Add index for filtering
CREATE INDEX IF NOT EXISTS idx_lab_posts_degree_level ON public.lab_posts(degree_level);
