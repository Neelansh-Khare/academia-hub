# AcademiaHub Architecture

## Overview
AcademiaHub is a comprehensive platform designed to streamline the academic research process. It connects students with research opportunities, facilitates collaboration, and provides AI-powered tools for literature review and project planning.

## Tech Stack

### Frontend
- **Framework**: React (via Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI (Radix Primitives)
- **State Management**: React Hooks (Context, local state), TanStack Query (React Query)
- **Routing**: React Router

### Backend & Infrastructure
- **Platform**: Supabase
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for PDFs, avatars)
- **Compute**: Supabase Edge Functions (Deno/TypeScript)

### AI & Machine Learning
- **Provider**: OpenAI (via Supabase Edge Functions)
- **Models**:
  - `gpt-4o-mini`: For general logic, chat, and synthesis.
  - `text-embedding-3-small`: For generating embeddings for RAG.
- **Vector Database**: pgvector (PostgreSQL extension)

### External Integrations
- **Semantic Scholar API**: For paper discovery and publication tracking.
- **arXiv API**: For preprint discovery.
- **HuggingFace Datasets API**: For dataset discovery.
- **ORCID API**: For importing user publications.

## Key Modules

### 1. User Management & Profiles
- **Tables**: `profiles`, `user_roles`, `linked_profiles`
- **Features**:
  - Detailed profiles with research interests, skills, and tools.
  - Automatic publication scraping from ORCID and Semantic Scholar.
  - Role-based access (student, professor, researcher).

### 2. Collaboration Board
- **Tables**: `lab_posts`, `applications`, `match_scores`
- **Features**:
  - Professors post research opportunities.
  - Students apply for positions.
  - **Smart Matchmaking**: AI-driven scoring to evaluate fit between students and posts.

### 3. ScholarGPT (Paper Chat)
- **Tables**: `papers`, `paper_chunks`, `paper_conversations`, `paper_messages`
- **Architecture**:
  1. **Ingestion**: PDF upload -> `process-paper` Edge Function -> Text Extraction -> Chunking -> Embedding -> Storage in `paper_chunks`.
  2. **Retrieval**: User Query -> Embedding -> Vector Similarity Search (RPC `match_paper_chunks`) -> Context Window Construction.
  3. **Generation**: Context + Query -> LLM -> Response.

### 4. Research Assistant
- **Tables**: `research_assistant_outputs`
- **Features**:
  - Aggregated search across Semantic Scholar, arXiv, and HuggingFace.
  - AI-generated project ideas and outlines based on search results.

### 5. Cold Email Generator
- **Tables**: `cold_emails`
- **Features**:
  - Generates personalized emails to professors.
  - Context-aware drafting using recipient's research background.

## Database Schema Highlights

### Core Relations
- `profiles` links 1:1 with `auth.users`.
- `publications` linked to `profiles`.
- `lab_posts` linked to `profiles` (author).

### RAG/Vector Search
- `paper_chunks` table stores text chunks and their `vector(1536)` embeddings.
- Custom RPC `match_paper_chunks` performs cosine similarity search.

## Edge Functions
- `ai-lab-assistant`: Main hub for AI tasks (chat, cold email, research ideas).
- `process-paper`: Handles CPU-intensive PDF parsing and embedding generation.
- `ai-match-score`: Calculates compatibility scores between users and lab posts.
- `scrape-publications`: Fetches and normalizes data from external scholarly APIs.

## Security & RLS
- Row Level Security (RLS) enabled on all tables.
- Policies ensure users can only edit their own data while allowing appropriate read access for public profiles and collaboration features.
