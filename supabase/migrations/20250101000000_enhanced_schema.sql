-- Enhanced schema for AcademicHub features

-- 1. Linked profiles (Google Scholar, ORCID, GitHub, LinkedIn, etc.)
CREATE TABLE IF NOT EXISTS public.linked_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL, -- 'google_scholar', 'orcid', 'github', 'linkedin', 'semantic_scholar'
  url text NOT NULL,
  username text,
  verified boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

ALTER TABLE public.linked_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Linked profiles are viewable by everyone"
ON public.linked_profiles
FOR SELECT
USING (true);

CREATE POLICY "Users can manage their own linked profiles"
ON public.linked_profiles
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_linked_profiles_updated_at
BEFORE UPDATE ON public.linked_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 2. Publications table
CREATE TABLE IF NOT EXISTS public.publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  authors text[],
  venue text, -- conference/journal name
  year integer,
  url text,
  doi text,
  abstract text,
  citation_count integer DEFAULT 0,
  source text, -- 'google_scholar', 'orcid', 'semantic_scholar', 'manual'
  source_id text, -- ID from the source system
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_publications_user_id ON public.publications(user_id);
CREATE INDEX IF NOT EXISTS idx_publications_source ON public.publications(source, source_id);

ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publications are viewable by everyone"
ON public.publications
FOR SELECT
USING (true);

CREATE POLICY "Users can manage their own publications"
ON public.publications
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_publications_updated_at
BEFORE UPDATE ON public.publications
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 3. Research papers (uploaded PDFs for ScholarGPT)
CREATE TABLE IF NOT EXISTS public.papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  filename text NOT NULL,
  file_url text NOT NULL, -- URL to the PDF file in Supabase storage
  file_size bigint,
  page_count integer,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  processed boolean DEFAULT false, -- Whether embeddings have been generated
  metadata jsonb, -- Additional metadata (authors, abstract, etc.)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_papers_user_id ON public.papers(user_id);
CREATE INDEX IF NOT EXISTS idx_papers_processed ON public.papers(processed);

ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own papers"
ON public.papers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own papers"
ON public.papers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own papers"
ON public.papers
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own papers"
ON public.papers
FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER set_papers_updated_at
BEFORE UPDATE ON public.papers
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 4. Paper embeddings for RAG (using pgvector if available, otherwise store as text)
CREATE TABLE IF NOT EXISTS public.paper_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id uuid NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
  chunk_text text NOT NULL,
  chunk_index integer NOT NULL,
  page_number integer,
  embedding vector(1536), -- OpenAI embeddings dimension
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_paper_chunks_paper_id ON public.paper_chunks(paper_id);
CREATE INDEX IF NOT EXISTS idx_paper_chunks_embedding ON public.paper_chunks USING ivfflat (embedding vector_cosine_ops);

ALTER TABLE public.paper_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chunks for their papers"
ON public.paper_chunks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.papers
    WHERE papers.id = paper_chunks.paper_id
    AND papers.user_id = auth.uid()
  )
);

-- 5. Paper chat conversations
CREATE TABLE IF NOT EXISTS public.paper_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id uuid NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text, -- Optional title for the conversation
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_paper_conversations_paper_id ON public.paper_conversations(paper_id);
CREATE INDEX IF NOT EXISTS idx_paper_conversations_user_id ON public.paper_conversations(user_id);

ALTER TABLE public.paper_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
ON public.paper_conversations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
ON public.paper_conversations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_paper_conversations_updated_at
BEFORE UPDATE ON public.paper_conversations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 6. Paper chat messages
CREATE TABLE IF NOT EXISTS public.paper_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.paper_conversations(id) ON DELETE CASCADE,
  role text NOT NULL, -- 'user' or 'assistant'
  content text NOT NULL,
  chunks_used uuid[], -- Array of chunk IDs used for context
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_paper_messages_conversation_id ON public.paper_messages(conversation_id);

ALTER TABLE public.paper_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for their conversations"
ON public.paper_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.paper_conversations
    WHERE paper_conversations.id = paper_messages.conversation_id
    AND paper_conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages for their conversations"
ON public.paper_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.paper_conversations
    WHERE paper_conversations.id = paper_messages.conversation_id
    AND paper_conversations.user_id = auth.uid()
  )
);

-- 7. Research assistant outputs (for auto research assistant feature)
CREATE TABLE IF NOT EXISTS public.research_assistant_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  topic text,
  papers jsonb, -- Array of paper objects with title, url, abstract, etc.
  project_ideas jsonb, -- Array of project idea objects
  outline jsonb, -- Paper outline structure
  datasets jsonb, -- Array of dataset objects
  libraries jsonb, -- Array of library/tool objects
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_research_assistant_user_id ON public.research_assistant_outputs(user_id);

ALTER TABLE public.research_assistant_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own research outputs"
ON public.research_assistant_outputs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own research outputs"
ON public.research_assistant_outputs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_research_assistant_updated_at
BEFORE UPDATE ON public.research_assistant_outputs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 8. Cold emails generated
CREATE TABLE IF NOT EXISTS public.cold_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_type text, -- 'professor', 'lab', 'student'
  recipient_name text,
  recipient_email text,
  subject text NOT NULL,
  body text NOT NULL,
  tone text DEFAULT 'formal', -- 'formal', 'friendly', 'curious'
  context jsonb, -- Additional context used for generation
  sent boolean DEFAULT false,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cold_emails_user_id ON public.cold_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_cold_emails_recipient_id ON public.cold_emails(recipient_id);

ALTER TABLE public.cold_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cold emails"
ON public.cold_emails
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cold emails"
ON public.cold_emails
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cold emails"
ON public.cold_emails
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_cold_emails_updated_at
BEFORE UPDATE ON public.cold_emails
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 9. Match scores (for AI matchmaking)
CREATE TABLE IF NOT EXISTS public.match_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.lab_posts(id) ON DELETE CASCADE,
  overall_score numeric(5,2) NOT NULL, -- 0.00 to 100.00
  keyword_overlap numeric(5,2),
  skills_match numeric(5,2),
  proximity_score numeric(5,2),
  explanation text, -- AI-generated explanation
  calculated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_match_scores_student_id ON public.match_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_post_id ON public.match_scores(post_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_overall_score ON public.match_scores(overall_score DESC);

ALTER TABLE public.match_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view match scores for their posts"
ON public.match_scores
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.lab_posts
    WHERE lab_posts.id = match_scores.post_id
    AND lab_posts.owner_id = auth.uid()
  )
  OR student_id = auth.uid()
);

CREATE TRIGGER set_match_scores_updated_at
BEFORE UPDATE ON public.match_scores
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Add degree_status and other fields to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'degree_status'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN degree_status text; -- 'undergraduate', 'masters', 'phd', 'postdoc', 'professor'
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'orcid_id'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN orcid_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'google_scholar_id'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN google_scholar_id text;
  END IF;
END $$;

