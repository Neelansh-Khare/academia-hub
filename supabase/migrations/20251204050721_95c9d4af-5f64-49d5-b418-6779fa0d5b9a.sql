-- 1. Create enum for application roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'app_role'
  ) THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END $$;

-- 2. User roles table (roles must NOT live on profiles/users tables)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can see their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- By default, no one can modify roles from the client; roles are managed via backend/admin only
CREATE POLICY "No direct client writes to user_roles"
ON public.user_roles
FOR ALL
USING (false)
WITH CHECK (false);

-- 3. Security definer function to check roles (prevents recursive RLS issues)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- 4. Profiles table (one-to-one with auth user)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  account_type text, -- e.g. 'student', 'professor', 'lab'
  institution text,
  department text,
  headline text,
  bio text,
  research_fields text[],
  methods text[],
  tools text[],
  location text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Link profile id to auth.users.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_user_fk'
      AND table_schema = 'public'
      AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_user_fk
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can view profiles (for discovery/search)
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);

-- Users can create their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Helper trigger function for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles.updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_profiles_updated_at'
  ) THEN
    CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- 5. Lab posts (RAships, collaborations, jobs)
CREATE TABLE IF NOT EXISTS public.lab_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text,
  type text NOT NULL DEFAULT 'ra', -- 'ra', 'collab', 'job'
  description text,
  institution text,
  department text,
  location text,
  remote_allowed boolean DEFAULT false,
  paid boolean,
  commitment_hours_per_week int,
  tags text[],
  methods text[],
  tools text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_posts ENABLE ROW LEVEL SECURITY;

-- Anyone (even unauthenticated visitors) can read posts for discovery
CREATE POLICY "Anyone can view lab posts"
ON public.lab_posts
FOR SELECT
USING (true);

-- Owners can create their own posts
CREATE POLICY "Owners can create lab posts"
ON public.lab_posts
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Owners can update their own posts
CREATE POLICY "Owners can update their lab posts"
ON public.lab_posts
FOR UPDATE
USING (auth.uid() = owner_id);

-- Owners can delete their own posts
CREATE POLICY "Owners can delete their lab posts"
ON public.lab_posts
FOR DELETE
USING (auth.uid() = owner_id);

-- Admins can manage all posts
CREATE POLICY "Admins can manage all lab posts"
ON public.lab_posts
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for lab_posts.updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_lab_posts_updated_at'
  ) THEN
    CREATE TRIGGER set_lab_posts_updated_at
    BEFORE UPDATE ON public.lab_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- 6. Applications to posts
CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.lab_posts(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cv_url text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Applicants can fully manage their own applications
CREATE POLICY "Applicants can manage their applications"
ON public.applications
FOR ALL
USING (auth.uid() = applicant_id)
WITH CHECK (auth.uid() = applicant_id);

-- Post owners can see applications to their posts
CREATE POLICY "Post owners can view applications to their posts"
ON public.applications
FOR SELECT
USING (
  auth.uid() IN (
    SELECT owner_id FROM public.lab_posts WHERE id = post_id
  )
);

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
ON public.applications
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Messages between applicants and lab owners (per-application threads)
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Participants (sender or recipient) can read their messages
CREATE POLICY "Participants can view messages"
ON public.messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Participants can send messages: sender must be the current user, and they must be part of the related application thread
CREATE POLICY "Participants can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND (
    -- Applicant in the application
    auth.uid() IN (
      SELECT applicant_id FROM public.applications WHERE id = application_id
    )
    OR
    -- Lab owner for the related post
    auth.uid() IN (
      SELECT lp.owner_id
      FROM public.lab_posts lp
      JOIN public.applications a ON a.post_id = lp.id
      WHERE a.id = application_id
    )
  )
);

-- 8. Private storage bucket for CVs
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for CV files in storage.objects
CREATE POLICY "Users can upload their own CVs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'cvs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own CVs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'cvs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own CVs"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'cvs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own CVs"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'cvs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);