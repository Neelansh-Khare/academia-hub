-- Migration for Community Q&A Board (Task 10.1)

-- Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  tags text[] DEFAULT '{}',
  upvotes integer DEFAULT 0,
  views integer DEFAULT 0,
  is_ama boolean DEFAULT false,
  scheduled_for timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Answers Table
CREATE TABLE IF NOT EXISTS public.answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  upvotes integer DEFAULT 0,
  is_accepted boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Votes Table (for both questions and answers)
CREATE TABLE IF NOT EXISTS public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL, -- Can be question_id or answer_id
  item_type text NOT NULL CHECK (item_type IN ('question', 'answer')),
  vote_type integer NOT NULL CHECK (vote_type IN (1, -1)), -- 1 for upvote, -1 for downvote
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

-- RLS Policies
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Questions Policies
CREATE POLICY "Anyone can view questions"
ON public.questions FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create questions"
ON public.questions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own questions"
ON public.questions FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own questions"
ON public.questions FOR DELETE
TO authenticated
USING (auth.uid() = author_id);

-- Answers Policies
CREATE POLICY "Anyone can view answers"
ON public.answers FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create answers"
ON public.answers FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own answers"
ON public.answers FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own answers"
ON public.answers FOR DELETE
TO authenticated
USING (auth.uid() = author_id);

-- Votes Policies
CREATE POLICY "Anyone can view votes"
ON public.votes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can vote"
ON public.votes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
ON public.votes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
ON public.votes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Function to handle vote count updates
CREATE OR REPLACE FUNCTION public.handle_vote()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF (NEW.item_type = 'question') THEN
      UPDATE public.questions SET upvotes = upvotes + NEW.vote_type WHERE id = NEW.item_id;
    ELSIF (NEW.item_type = 'answer') THEN
      UPDATE public.answers SET upvotes = upvotes + NEW.vote_type WHERE id = NEW.item_id;
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (NEW.item_type = 'question') THEN
      UPDATE public.questions SET upvotes = upvotes - OLD.vote_type + NEW.vote_type WHERE id = NEW.item_id;
    ELSIF (NEW.item_type = 'answer') THEN
      UPDATE public.answers SET upvotes = upvotes - OLD.vote_type + NEW.vote_type WHERE id = NEW.item_id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF (OLD.item_type = 'question') THEN
      UPDATE public.questions SET upvotes = upvotes - OLD.vote_type WHERE id = OLD.item_id;
    ELSIF (OLD.item_type = 'answer') THEN
      UPDATE public.answers SET upvotes = upvotes - OLD.vote_type WHERE id = OLD.item_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for votes
CREATE TRIGGER on_vote_change
AFTER INSERT OR UPDATE OR DELETE ON public.votes
FOR EACH ROW EXECUTE FUNCTION public.handle_vote();

-- Triggers for updated_at
CREATE TRIGGER set_questions_updated_at
BEFORE UPDATE ON public.questions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_answers_updated_at
BEFORE UPDATE ON public.answers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_author ON public.questions(author_id);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON public.questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_answers_question ON public.answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_author ON public.answers(author_id);
CREATE INDEX IF NOT EXISTS idx_votes_item ON public.votes(item_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON public.votes(user_id);
