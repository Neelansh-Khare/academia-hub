-- Migration for Task 9.1: Collaborative Document Editor

CREATE TABLE IF NOT EXISTS public.collaborative_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content jsonb DEFAULT '{}'::jsonb,
  last_edited_by uuid REFERENCES auth.users(id),
  is_public boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.collaborative_documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level text DEFAULT 'editor', -- 'viewer', 'editor', 'admin'
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(document_id, user_id)
);

-- RLS Policies
ALTER TABLE public.collaborative_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents they own or collaborate on"
ON public.collaborative_documents
FOR SELECT
USING (
  auth.uid() = owner_id OR 
  is_public = true OR
  EXISTS (
    SELECT 1 FROM public.document_collaborators
    WHERE document_id = collaborative_documents.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Owners and editors can update documents"
ON public.collaborative_documents
FOR UPDATE
USING (
  auth.uid() = owner_id OR
  EXISTS (
    SELECT 1 FROM public.document_collaborators
    WHERE document_id = collaborative_documents.id 
    AND user_id = auth.uid() 
    AND permission_level IN ('editor', 'admin')
  )
)
WITH CHECK (
  auth.uid() = owner_id OR
  EXISTS (
    SELECT 1 FROM public.document_collaborators
    WHERE document_id = collaborative_documents.id 
    AND user_id = auth.uid() 
    AND permission_level IN ('editor', 'admin')
  )
);

CREATE POLICY "Owners can delete documents"
ON public.collaborative_documents
FOR DELETE
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert documents"
ON public.collaborative_documents
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Collaborators policies
CREATE POLICY "Users can view collaborators for documents they can view"
ON public.document_collaborators
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.collaborative_documents
    WHERE collaborative_documents.id = document_collaborators.document_id
    AND (collaborative_documents.owner_id = auth.uid() OR collaborative_documents.is_public = true)
  ) OR
  user_id = auth.uid()
);

-- Trigger for updated_at
CREATE TRIGGER set_collaborative_documents_updated_at
BEFORE UPDATE ON public.collaborative_documents
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
