# Next Steps: Implementing Remaining PRD Features

This document outlines how to incorporate the remaining features from the PRD into AcademiaHub. It provides a prioritized roadmap with implementation guidance.

## Current Status Overview

### ✅ Fully Implemented
- User authentication and profiles (basic structure)
- Dashboard navigation
- Collaboration board (lab posts)
- Cold email generator UI
- Paper chat UI (upload and chat interface)
- Research assistant UI
- Profile management with research fields, methods, tools
- Linked profiles (full support with add/remove and **deletion management** ✅)
- **Publication auto-scraping** (ORCID & Semantic Scholar) ✅
- **BibTeX Export** (for publications on private and public profiles) ✅
- **Research Assistant API integrations** ✅:
  - Semantic Scholar API for paper discovery
  - arXiv API for preprints
  - HuggingFace Datasets API for dataset discovery
  - LLM-powered project ideas and outline generation
- **All page routes configured** ✅
- **TypeScript types for all 16 database tables** ✅
- **Real-time Messaging** ✅

### ✅ Recently Completed (Tasks 3.1–3.4, 4.1–4.3, 5.1, 6.1, 6.2, 7.1, 7.2, 8.1 (initial), 9.2-partial)
- **ScholarGPT (Paper Chat)**: ✅ Full RAG pipeline
- **Smart Matchmaking**: ✅ Enhanced scoring algorithm
- **Cold Email Generator**: ✅ Backend and UI
- **Advanced Search Filters**: ✅ Collaboration board filters
- **Enhanced Profile Display**: ✅ Metrics and charts
- **Real-time Chat**: ✅ Messaging interface
- **Research Timelines (Task 8.1 initial)**: ✅ Schema and UI for tracking projects and milestones
- **Profile Management**: ✅ Added **Linked Profile Deletion** and unique ID tracking for all external links.
- **Academic Export**: ✅ **BibTeX Export** utility implemented and integrated into all profile views.
- **TypeScript types**: ✅ `cold_emails`, `papers`, and `lab_posts` (`degree_level`) in `types.ts` aligned with migration.
- **RPC**: ✅ `match_paper_chunks(paper_id, query_embedding, match_count)` for vector similarity search

### 🟡 Partially Implemented (Needs Enhancement)
- *No high-priority MVP items remaining in this category.*

### ❌ Not Yet Implemented
- Calendar sync (Google/Outlook)
- Collaborative document editor
- Community Q&A board
- Integration with Notion/Obsidian (Full sync)

---

## Technical Infrastructure

### AI Provider: OpenAI
The project uses OpenAI directly for LLM features:
- **Model**: `gpt-4o-mini` (fast, cost-effective)
- **Embeddings**: `text-embedding-3-small` (1536 dimensions) for RAG (process-paper, paper_chat)
- **Used in**: `ai-lab-assistant`, `ai-match-score`, `process-paper` edge functions
- **Requires**: `OPENAI_API_KEY` environment variable
- **Endpoints**: `https://api.openai.com/v1/chat/completions`, `https://api.openai.com/v1/embeddings`

### External APIs Integrated
| API | Status | Purpose | Rate Limits |
|-----|--------|---------|-------------|
| OpenAI | ✅ Working | LLM generation (gpt-4o-mini) | Per account |
| Semantic Scholar | ✅ Working | Paper search, author publications | 100 req/min (free) |
| arXiv | ✅ Working | Preprint search | 1 req/3 sec |
| HuggingFace Datasets | ✅ Working | Dataset discovery | No limit (public) |
| ORCID | ✅ Working | Publication scraping | Reasonable use |

### Database Tables (14 total)
All tables have TypeScript types defined in `src/integrations/supabase/types.ts`:
- **Core**: `profiles`, `user_roles`, `lab_posts`, `applications`, `messages`
- **Publications**: `publications`, `linked_profiles`
- **Papers**: `papers`, `paper_chunks`, `paper_conversations`, `paper_messages`
- **AI Features**: `research_assistant_outputs`, `cold_emails`, `match_scores`

### Page Routes (all configured in App.tsx)
| Route | Page | Status |
|-------|------|--------|
| `/` | Index (Landing) | ✅ Ready |
| `/auth` | Auth | ✅ Ready |
| `/dashboard` | Dashboard | ✅ Ready |
| `/profile` | ProfilePage | ✅ Routed |
| `/board` | CollaborationBoard | ✅ Routed |
| `/assistant` | ResearchAssistant | ✅ Routed |
| `/paper-chat` | PaperChat | ✅ Routed |
| `/cold-email` | ColdEmailGenerator | ✅ Routed |
| `/messages` | Messages | ✅ Ready |

---

## Implementation Roadmap

### Phase 1: Core MVP Completion (Weeks 1-3)

#### Week 1: Profile Enhancements & Publication Auto-Scraping

**Task 1.1: Auto-scrape Publications from ORCID** ✅ COMPLETED
- **Priority**: High
- **Status**: ✅ Completed
- **Files Created/Modified**:
  - ✅ `supabase/functions/scrape-publications/index.ts` (combined ORCID + Semantic Scholar)
  - ✅ `src/hooks/usePublications.tsx` (new hook)
  - ✅ `src/pages/ProfilePage.tsx` (publications tab added)

- **Implementation Details**:
  - Uses ORCID Public API (https://pub.orcid.org/v3.0/)
  - Fetches works by ORCID ID
  - Transforms to publications format
  - Prevents duplicates based on title, source, source_id

**Task 1.2: Auto-scrape Publications from Semantic Scholar** ✅ COMPLETED
- **Priority**: High
- **Status**: ✅ Completed
- **Implementation**:
  - Edge Function calls Semantic Scholar API by author name
  - Returns publications with citation counts
  - Stores in `publications` table with `source: 'semantic_scholar'`

**Task 1.3: Auto-scrape Publications from Google Scholar**
- **Priority**: Medium
- **Status**: ✅ Documented (No implementation needed)
- **Note**: Google Scholar doesn't have an official API. Manual profile linking is implemented; users are encouraged to use Semantic Scholar as primary source for auto-scraping.

**Task 1.4: Display Publications on Profile** ✅ COMPLETED
- **Priority**: High
- **Status**: ✅ Completed
- **Implementation**:
  - Publications tab in ProfilePage.tsx
  - Fetches via `usePublications` hook
  - Displays with year, venue, citation counts
  - Links to full papers

---

#### Week 2: Research Assistant API Integration

**Task 2.1: Integrate Semantic Scholar API for Paper Discovery** ✅ COMPLETED
- **Priority**: High
- **Status**: ✅ Completed
- **Files Modified**:
  - ✅ `supabase/functions/ai-lab-assistant/index.ts`
  - ✅ `src/pages/ResearchAssistant.tsx`

- **Implementation Details**:
  ```typescript
  // searchSemanticScholar() function
  // GET https://api.semanticscholar.org/graph/v1/paper/search?query={query}&limit=10&fields=title,authors,abstract,year,citationCount,venue,url,externalIds
  ```

- **Output Structure**:
  ```typescript
  {
    papers: [
      {
        title: string,
        authors: string[],
        abstract: string,
        year: number,
        url: string,
        citationCount: number,
        venue: string,
        source: 'semantic_scholar'
      }
    ]
  }
  ```

**Task 2.2: Integrate arXiv API for Additional Papers** ✅ COMPLETED
- **Priority**: Medium
- **Status**: ✅ Completed
- **Implementation Details**:
  ```typescript
  // searchArxiv() function
  // GET https://export.arxiv.org/api/query?search_query=all:{query}&max_results=10&sortBy=relevance
  // Parses XML response to extract papers
  ```
  - Combines results with Semantic Scholar
  - Deduplicates based on normalized title
  - Returns papers sorted by citation count

**Task 2.3: Integrate HuggingFace Datasets API** ✅ COMPLETED
- **Priority**: Medium
- **Status**: ✅ Completed
- **Implementation Details**:
  ```typescript
  // searchHuggingFaceDatasets() function
  // GET https://huggingface.co/api/datasets?search={query}&limit=10&sort=downloads&direction=-1
  ```

- **Output Structure**:
  ```typescript
  {
    datasets: [
      {
        name: string,
        description: string,
        url: string,  // https://huggingface.co/datasets/{id}
        downloads: number,
        likes: number
      }
    ]
  }
  ```

**Task 2.4: Enhance Project Ideas Generation** ✅ COMPLETED
- **Priority**: Medium
- **Status**: ✅ Completed
- **Implementation Details**:
  - `generateProjectIdeasAndOutline()` function
  - Uses LLM to synthesize papers into project ideas
  - Each idea includes:
    - Title (concise)
    - Description (2-3 sentences)
    - Methodology suggestion
  - Generates paper outline with 6-8 sections
  - Recommends relevant libraries/tools

**Task 2.5: Improve Paper Outline Generation** ✅ COMPLETED
- **Priority**: Low
- **Status**: ✅ Completed (included in Task 2.4)
- **Implementation**:
  - LLM generates detailed outlines
  - Each section has title and description
  - Structured for academic papers

---

#### Week 3: ScholarGPT RAG Implementation

**Task 3.1: Implement PDF Processing Pipeline** ✅ COMPLETED
- **Priority**: High
- **Status**: ✅ Completed
- **Files Created/Modified**:
  - ✅ `supabase/functions/process-paper/index.ts` (new Edge Function)
  - Processing is triggered by the frontend after upload (no DB trigger; optional later via Supabase Webhooks or pg_net)

- **Implementation**:
  - Edge Function accepts `paper_id`, fetches paper `file_url`, downloads PDF
  - Extracts text via pdfjs-dist (esm.sh), chunks (~2400 chars with overlap), generates embeddings (OpenAI `text-embedding-3-small`)
  - Inserts into `paper_chunks`, updates `papers.processed`, `page_count`, `metadata`
  - Frontend calls `supabase.functions.invoke('process-paper', { body: { paper_id } })` after upload and shows "Processing..." until done

**Task 3.2: Implement RAG Query System** ✅ COMPLETED
- **Priority**: High
- **Status**: ✅ Completed
- **Files Modified**:
  - ✅ `supabase/functions/ai-lab-assistant/index.ts` (added `paper_chat` handler, `generateEmbedding`, `handlePaperChat`)
  - ✅ `supabase/migrations/20250130000000_match_paper_chunks_rpc.sql` (RPC for vector search)

- **Implementation**:
  - `body.type === 'paper_chat'`: generate query embedding, call `match_paper_chunks(paper_id, query_embedding, 5)`, build context with page numbers, call LLM, return `{ response, chunks_used, chunks }` (chunks include `page_number`, `chunk_text` for UI)

**Task 3.3: Enhance Paper Chat UI** ✅ COMPLETED
- **Priority**: Medium
- **Status**: ✅ Completed
- **Implementation**:
  - Processing status: "Processing..." badge and polling until `paper.processed`
  - Page citations in assistant messages (Sources: pages X, Y)
  - "View sources" / "Hide sources" button to expand chunk excerpts
  - "New conversation" button to start a new thread per paper

**Task 3.4: Add Paper Metadata Extraction** ✅ COMPLETED
- **Priority**: Low
- **Status**: ✅ Completed
- **Implementation**:
  - In `process-paper`: `extractMetadataFromText(fullText)` derives title/abstract from first pages; stored in `papers.metadata`; paper title updated if extracted

---

### Phase 2: Enhanced Features (Weeks 4-6)

#### Week 4: Smart Matchmaking Enhancement

**Task 4.1: Improve Match Scoring Algorithm** ✅ COMPLETED
- **Priority**: High
- **Status**: ✅ Completed
- **Files Modified**:
  - `supabase/functions/ai-match-score/index.ts` (updated algorithm)
  - `src/hooks/useMatchScores.tsx` (updated to save new scores)

**Task 4.2: Batch Match Scoring** ✅ COMPLETED
- **Priority**: Medium
- **Status**: ✅ Completed
- **Implementation**:
  - `supabase/functions/batch-match-score/index.ts` (new Edge Function)
  - Uses two-tier approach: SQL-based keyword overlap for all students + LLM for top 5
  - Triggered via Database Webhook on `lab_posts` insert

**Task 4.3: Match Score Dashboard** ✅ COMPLETED
- **Priority**: Medium
- **Status**: ✅ Completed
- **Implementation**:
  - "Recommended Matches" section on dashboard
  - Displays match score breakdown and AI-generated explanation

---

#### Week 5: Cold Email Generator Backend

**Task 5.1: Implement Cold Email Generation**
- **Priority**: High
- **Status**: ✅ Completed
- **Files to Modify**:
  - `supabase/functions/ai-lab-assistant/index.ts` (add cold_email type)
  - `src/pages/ColdEmailGenerator.tsx` (connect to API)

- **Implementation Steps**:
  1. Add `type: 'cold_email'` handler in Edge Function:
     ```typescript
     if (body.type === 'cold_email') {
       // Optionally fetch recipient's research from Semantic Scholar
       const recipientInfo = body.recipient_name
         ? await searchSemanticScholar(body.recipient_name, 3)
         : null;

       const emailPrompt = buildEmailPrompt({
         senderProfile: body.sender_profile,
         recipientInfo,
         tone: body.tone, // formal, friendly, etc.
         context: body.context
       });

       const email = await generateWithLLM(emailPrompt);
       return { subject: email.subject, body: email.body };
     }
     ```
  2. Save generated emails to `cold_emails` table
  3. Add email history view in UI

**Task 5.2: Mapbox Integration for Location Services**
- **Priority**: Low
- **Status**: ❌ Not Started
- **Use Cases**:
  - Location-based search in collaboration board
  - Proximity scoring in matchmaking
  - Visualization of opportunities on map

- **Implementation Steps**:
  1. Sign up for Mapbox API key
  2. Add Mapbox React components
  3. Geocode location strings to coordinates
  4. Calculate distances between locations

---

#### Week 6: Profile & Search Enhancements

**Task 6.1: Advanced Search Filters** ✅ COMPLETED
- **Priority**: Medium
- **Status**: ✅ Completed
- **Implementation**:
  - Added `degree_level` column to `lab_posts`
  - Added filters for Research Fields, Degree Level, and Publication Count Range
  - Integrated filters into `CollaborationBoard.tsx`

**Task 6.2: Enhanced Profile Display** ✅ COMPLETED
- **Priority**: Medium
- **Status**: ✅ Completed
- **Implementation**:
  - Citation metrics (total citations, h-index, i10-index) on `PublicProfile.tsx`
  - Research Activity chart (publications by year) using `recharts`
  - Context-aware Match Score display on public profiles when accessed from collaboration board

---

### Phase 3: Stretch Goals (Weeks 7+)

#### Real-time Chat System

**Task 7.1: Implement Real-time Messaging**
- **Priority**: Low (Stretch Goal)
- **Status**: ✅ Completed
- **Tech Stack Options**:
  - Supabase Realtime (recommended - already using Supabase)
  - Socket.io with separate WebSocket server
  - Pusher or similar service

- **Implementation Steps**:
  1. Use existing `messages` table with:
     - sender_id, recipient_id
     - application_id (optional)
     - body, timestamp
  2. Set up Supabase Realtime subscriptions:
     ```typescript
     const channel = supabase
       .channel('messages')
       .on('postgres_changes', {
         event: 'INSERT',
         schema: 'public',
         table: 'messages',
         filter: `recipient_id=eq.${userId}`
       }, (payload) => {
         // Handle new message
       })
       .subscribe();
     ```
  3. Create chat UI component
  4. Add notification system for new messages

**Task 7.2: Professor-Student Chat Interface**
- **Priority**: Low
- **Status**: ✅ Completed
- **Implementation Steps**:
  1. Add "Messages" page to dashboard
  2. Show conversations list
  3. Create chat view with message thread
  4. Add typing indicators
  5. Support file attachments (CVs, portfolios)

---

#### Calendar Sync & Timeline Planning

**Task 8.1: Calendar Integration**
- **Priority**: Low (Stretch Goal)
- **Status**: 🟡 Partially Implemented (Initial DB Schema and Timeline Page ready)
- **Implementation Steps**:
  1. Integrate Google Calendar API or CalDAV
  2. Create `research_timelines` table: ✅ Done
     - user_id, project_id (optional)
     - milestone_name, due_date
     - description
  3. Sync deadlines for applications, projects, papers
  4. Create timeline visualization component: ✅ Done
  5. Add reminders and notifications

**Task 8.2: Research Timeline Planner** ✅ COMPLETED
- **Priority**: Low
- **Status**: ✅ Completed
- **Implementation Steps**:
  1. Create timeline UI component: ✅ Done
  2. Allow users to create research projects: ✅ Done
  3. Break down into phases (literature review, data collection, writing, etc.): ✅ Done
  4. Suggest timeline based on similar projects: ✅ Done (AI-powered via `ai-lab-assistant`)
  5. Integrate with calendar: 🟡 Partial (Timeline UI ready)

---

#### Collaborative Features

**Task 9.1: Collaborative Document Editor**
- **Priority**: Low (Stretch Goal)
- **Status**: ❌ Not Started
- **Tech Stack Options**:
  - TipTap or Slate.js (React-based editors)
  - Integration with Google Docs API
  - Monaco Editor (VS Code editor)

- **Implementation Steps**:
  1. Create `collaborative_documents` table:
     - document_id, title
     - content (JSON or text)
     - owner_id, collaborators[]
     - version_history
  2. Implement real-time collaboration using:
     - Operational Transform (OT) or CRDTs
     - Supabase Realtime for sync
  3. Create document editor UI
  4. Add comments and suggestions system
  5. Export to LaTeX, Word, PDF

**Task 9.2: Integration with Notion/Obsidian**
- **Priority**: Low
- **Status**: ❌ Not Started
- **Implementation Steps**:
  1. Create export functionality:
     - Export research roadmap to Notion page
     - Export paper summaries to Obsidian notes
     - Export bibliography to BibTeX: ✅ Done
  2. Add import functionality (if APIs available)
  3. Two-way sync (if feasible)

---

#### Community Features

**Task 10.1: Q&A Board / Mentor AMA**
- **Priority**: Low (Stretch Goal)
- **Status**: ❌ Not Started
- **Implementation Steps**:
  1. Create `questions` and `answers` tables:
     - questions: title, body, author_id, tags[], upvotes
     - answers: question_id, body, author_id, upvotes, accepted
  2. Create Q&A UI:
     - Question list with filters
     - Question detail page
     - Answer composition
     - Upvoting system
  3. Add "Mentor AMA" feature:
     - Professors can schedule AMA sessions
     - Students can submit questions in advance
     - Live or async Q&A

**Task 10.2: Community Forums**
- **Priority**: Low
- **Status**: ❌ Not Started
- **Implementation Steps**:
  1. Create forum structure:
     - Categories (by research field)
     - Threads and posts
     - Moderation system
  2. Add discussion UI
  3. Integration with main platform (SSO)

---

## Technical Implementation Details

### Required API Keys & Services

1. **ORCID API** (Public - No key needed for public data)
   - Register at: https://orcid.org/developer-tools
   - Rate limits: Reasonable use (no official limit)

2. **Semantic Scholar API**
   - Sign up at: https://www.semanticscholar.org/product/api
   - Free tier: 100 requests/min
   - Add to Supabase secrets: `SEMANTIC_SCHOLAR_API_KEY` (optional, for higher limits)

3. **arXiv API** (Public - No key needed)
   - Documentation: https://arxiv.org/help/api/user-manual
   - Rate limits: 1 request per 3 seconds (be polite)

4. **HuggingFace Datasets API** (Public)
   - Documentation: https://huggingface.co/docs/datasets/
   - No authentication required for public datasets

5. **OpenAI API** (For LLM features) ✅
   - Sign up at: https://platform.openai.com/
   - Add to Supabase secrets: `OPENAI_API_KEY`
   - Model: `gpt-4o-mini` (used for all LLM features)
   - Also needed for embeddings in RAG implementation

7. **Mapbox API** (Optional - for location features)
   - Sign up at: https://www.mapbox.com/
   - Free tier: 50,000 map loads/month
   - Add to env: `VITE_MAPBOX_TOKEN`

### Database Schema

All tables defined in migrations and TypeScript types:

```sql
-- Core tables (already exist)
profiles, user_roles, lab_posts, applications, messages

-- Publication tables
linked_profiles (platform, url, username, verified)
publications (title, authors, venue, year, doi, citation_count, source)

-- Paper/RAG tables
papers (title, filename, file_url, processed, metadata)
paper_chunks (paper_id, chunk_text, embedding, page_number)
paper_conversations (paper_id, user_id, title)
paper_messages (conversation_id, role, content, chunks_used)

-- AI feature tables
research_assistant_outputs (prompt, topic, papers, project_ideas, outline, datasets, libraries)
cold_emails (recipient_id, recipient_type, recipient_name, subject, body, tone, context)
match_scores (student_id, post_id, overall_score, explanation)

-- Modified tables
lab_posts (added degree_level)

-- RPC for RAG (migration 20250130000000_match_paper_chunks_rpc.sql)
match_paper_chunks(p_paper_id, p_query_embedding vector(1536), p_match_count) → chunks
```

### Database Indexes Recommended

```sql
-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_publications_user_year
ON public.publications(user_id, year DESC);

CREATE INDEX IF NOT EXISTS idx_papers_user
ON public.papers(user_id);

CREATE INDEX IF NOT EXISTS idx_paper_chunks_paper
ON public.paper_chunks(paper_id);

CREATE INDEX IF NOT EXISTS idx_match_scores_student
ON public.match_scores(student_id, overall_score DESC);

CREATE INDEX IF NOT EXISTS idx_match_scores_post
ON public.match_scores(post_id, overall_score DESC);
```

### Environment Variables

Add to `.env`:
```env
# Existing
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...

# New (optional, for direct API access)
SEMANTIC_SCHOLAR_API_KEY=...
VITE_MAPBOX_TOKEN=...
```

Add to Supabase Edge Function secrets (via dashboard):
- `OPENAI_API_KEY` (required for AI features)
- `SEMANTIC_SCHOLAR_API_KEY` (optional, for higher rate limits)

---

## File Structure

```
src/
├── pages/
│   ├── Index.tsx              # Landing page
│   ├── Auth.tsx               # Authentication
│   ├── Dashboard.tsx          # Main hub
│   ├── ProfilePage.tsx        # Profile + publications ✅
│   ├── CollaborationBoard.tsx # Browse opportunities
│   ├── ResearchAssistant.tsx  # AI research helper ✅
│   ├── PaperChat.tsx          # Chat with papers (RAG) ✅
│   ├── ColdEmailGenerator.tsx # Email drafting (backend) ✅
│   └── NotFound.tsx           # 404 page
├── hooks/
│   ├── useAuth.tsx            # Authentication hook
│   ├── useProfile.tsx         # Profile management
│   └── usePublications.tsx    # Publications sync ✅
└── integrations/
    └── supabase/
        ├── client.ts          # Supabase client
        └── types.ts           # Database types (all 14 tables) ✅

supabase/
├── functions/
│   ├── ai-lab-assistant/      # Main AI function ✅
│   │   └── index.ts           # Handles research_assistant, cold_email, paper_chat, chat
│   ├── ai-match-score/        # Match scoring
│   │   └── index.ts           # Basic LLM scoring
│   ├── process-paper/         # PDF → chunks + embeddings ✅
│   │   └── index.ts           # PDF extract, chunk, embed, metadata
│   └── scrape-publications/   # Publication sync ✅
│       └── index.ts           # ORCID + Semantic Scholar
└── migrations/
    └── *.sql                  # Database schema (+ match_paper_chunks RPC)
```

---

## Testing Strategy

### Unit Tests
- Test Edge Functions with mock API responses
- Test matching algorithm with sample data
- Test PDF parsing with various PDF formats

### Integration Tests
- Test full paper processing pipeline
- Test RAG query system end-to-end
- Test publication scraping from various sources

### E2E Tests
- Test research assistant flow: prompt → papers → project ideas
- Test paper chat: upload → process → query → response
- Test profile: link ORCID → scrape → display

---

## Performance Considerations

1. **PDF Processing**:
   - Process papers asynchronously (background jobs)
   - Use queue system for processing multiple papers
   - Cache embeddings to avoid re-processing

2. **RAG Queries**:
   - Use vector index (pgvector) for fast similarity search
   - Limit chunk retrieval to top 5-10 most relevant
   - Cache common queries

3. **API Rate Limiting**:
   - Implement rate limiting for external API calls
   - Use caching for frequently accessed data (e.g., publications)
   - Batch API requests when possible

4. **Database Optimization**:
   - Add appropriate indexes (see above)
   - Use pagination for large result sets
   - Consider materialized views for expensive queries

---

## Deployment Checklist

Before deploying new features:

- [ ] All Edge Functions tested locally
- [ ] Database migrations tested on staging
- [ ] API keys configured in Supabase secrets
- [ ] Environment variables set in production
- [ ] Error handling and logging in place
- [ ] Rate limiting configured
- [ ] Performance tested with realistic data volumes
- [ ] User documentation updated

---

## Priority Ranking

**Must Have (P0)** - Core MVP:
1. ~~Publication auto-scraping (ORCID, Semantic Scholar)~~ ✅
2. ~~Research Assistant API integration~~ ✅
3. ~~RAG implementation for Paper Chat~~ ✅
4. ~~Cold Email Generator backend~~ ✅

**Should Have (P1)** - Important for full functionality:
5. Enhanced matchmaking algorithm
6. Advanced search filters
7. Public profile views

**Nice to Have (P2)** - Stretch goals:
8. ~~Real-time chat~~ ✅
9. Calendar sync
10. Collaborative editor
11. Community Q&A

---

## Recent Changes (March 2026)

- ✅ **Messages & Real-time Chat (Tasks 7.1-7.2)**: Built a `/messages` route serving a unified dual-pane message interface connecting researchers seamlessly via Supabase Realtime subscriptions.
- ✅ **ScholarGPT RAG (Tasks 3.1–3.4)**: process-paper Edge Function, match_paper_chunks RPC, paper_chat handler, Paper Chat UI
- ✅ **Cold Email backend**: `cold_email` handler in ai-lab-assistant
- ✅ **Smart Matchmaking (Tasks 4.1–4.3)**: Enhanced algorithm, batch-match-score Edge Function, and dashboard recommended matches.
- ✅ **Advanced Search Filters (Task 6.1)**: Added degree_level and min_publications filters to Collaboration Board.
- ✅ **Enhanced Profile Display (Task 6.2)**: Added metrics, research activity chart, and match scores to Public Profile page.
- ✅ **Research Timelines (Task 8.1 initial)**: Built schema and UI for tracking projects and milestones.
- ✅ **Profile Management**: Added BibTeX export and linked profile deletion.
- ✅ **Repo fixes**: All TypeScript types aligned with current database schema, any type linting errors fixed, and build errors resolved.

---

## Additional Resources

- [Semantic Scholar API Docs](https://api.semanticscholar.org/api-docs/)
- [arXiv API User Manual](https://arxiv.org/help/api/user-manual)
- [ORCID API Documentation](https://pub.orcid.org/v3.0/)
- [HuggingFace Datasets Docs](https://huggingface.co/docs/datasets/)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [pgvector Documentation](https://github.com/pgvector/pgvector)

---

## Notes

- Focus on completing P0 items first to have a functional MVP
- Use existing Supabase infrastructure (Realtime, Storage, Edge Functions) where possible
- Consider using LangChain or LlamaIndex if RAG complexity grows
- For production, consider adding monitoring (Sentry, LogRocket) and analytics
- Using OpenAI `gpt-4o-mini` for cost-effective LLM features
