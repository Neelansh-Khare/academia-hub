-- Migration to add research timelines and milestones for Task 8.1

CREATE TABLE IF NOT EXISTS public.research_timelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid, -- Optional, if we want to link it to a specific project later
  title text NOT NULL,
  description text,
  status text DEFAULT 'active', -- 'active', 'completed', 'archived'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.research_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_id uuid NOT NULL REFERENCES public.research_timelines(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date timestamptz,
  status text DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.research_timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own timelines"
ON public.research_timelines
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage milestones for their timelines"
ON public.research_milestones
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.research_timelines
    WHERE research_timelines.id = research_milestones.timeline_id
    AND research_timelines.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.research_timelines
    WHERE research_timelines.id = research_milestones.timeline_id
    AND research_timelines.user_id = auth.uid()
  )
);

-- Triggers for updated_at
CREATE TRIGGER set_research_timelines_updated_at
BEFORE UPDATE ON public.research_timelines
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_research_milestones_updated_at
BEFORE UPDATE ON public.research_milestones
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
