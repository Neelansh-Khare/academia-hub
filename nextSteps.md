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
- Linked profiles (manual linking)
- **Publication auto-scraping** (ORCID & Semantic Scholar) ✅
- **Research Assistant API integrations** ✅:
  - Semantic Scholar API for paper discovery
  - arXiv API for preprints
  - HuggingFace Datasets API for dataset discovery
  - LLM-powered project ideas and outline generation
- **All page routes configured** ✅
- **TypeScript types for all 14 database tables** ✅

### 🟡 Partially Implemented (Needs Enhancement)
- **Smart Matchmaking**: Edge function exists, UI ready, but not fully connected to frontend
- **ScholarGPT (Paper Chat)**: UI exists, but RAG system not fully implemented
- **Cold Email Generator**: UI exists, needs AI integration
- **Profile Page**: UI complete, publications tab works, linked profiles partial

### ❌ Not Yet Implemented
- Full RAG implementation for paper processing
- Real-time professor-student chat
- Calendar sync and timeline planning
- Collaborative document editor
- Community Q&A board
- Integration with Notion/Obsidian

---

## Technical Infrastructure

### AI Provider: OpenAI
The project uses OpenAI directly for LLM features:
- **Model**: `gpt-4o-mini` (fast, cost-effective)
- **Used in**: `ai-lab-assistant`, `ai-match-score` edge functions
- **Requires**: `OPENAI_API_KEY` environment variable
- **Endpoint**: `https://api.openai.com/v1/chat/completions`

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

**Task 3.1: Implement PDF Processing Pipeline**
- **Priority**: High
- **Status**: ❌ Not Started
- **Files to Create/Modify**:
  - `supabase/functions/process-paper/index.ts` (new Edge Function)
  - Database trigger for auto-processing

- **Implementation Steps**:
  1. Create Edge Function that:
     - Accepts paper_id
     - Downloads PDF from Supabase Storage
     - Extracts text using PDF parsing library (pdf-parse or pdfjs-dist)
     - Chunks text into smaller pieces (500-1000 tokens each)
     - Generates embeddings using OpenAI Embeddings API
     - Stores chunks in `paper_chunks` table with embeddings

  2. Set up database trigger or webhook to auto-process on upload:
     ```sql
     -- Create function to trigger processing
     CREATE OR REPLACE FUNCTION trigger_paper_processing()
     RETURNS TRIGGER AS $$
     BEGIN
       -- Call Edge Function via HTTP (or use Supabase Webhooks)
       PERFORM net.http_post(...);
       RETURN NEW;
     END;
     $$ LANGUAGE plpgsql;
     ```

- **Required Libraries** (for Edge Function):
  - `pdf-parse` or use a PDF processing service
  - OpenAI API for embeddings (or Lovable gateway)

**Task 3.2: Implement RAG Query System**
- **Priority**: High
- **Status**: ❌ Not Started
- **Files to Modify**:
  - `supabase/functions/ai-lab-assistant/index.ts` (add paper_chat type handler)

- **Implementation Steps**:
  1. When user sends message in Paper Chat:
     - Generate embedding for user query
     - Perform vector similarity search in `paper_chunks` table:
       ```sql
       SELECT chunk_text, chunk_index, page_number
       FROM paper_chunks
       WHERE paper_id = $1
       ORDER BY embedding <=> $2::vector
       LIMIT 5
       ```
     - Retrieve top 5 most relevant chunks
     - Pass chunks as context to LLM
     - Generate response with citations to page numbers

  2. Add handler in Edge Function:
     ```typescript
     if (body.type === 'paper_chat') {
       const queryEmbedding = await generateEmbedding(body.message);
       const relevantChunks = await findRelevantChunks(
         body.paper_id,
         queryEmbedding
       );
       const context = relevantChunks.map(c => c.chunk_text).join('\n\n');
       const response = await callLLM(context, body.message);
       return { response, chunks_used: relevantChunks.map(c => c.id) };
     }
     ```

**Task 3.3: Enhance Paper Chat UI**
- **Priority**: Medium
- **Status**: Basic UI exists
- **Implementation Steps**:
  1. Show processing status with progress indicator
  2. Display page number citations in responses
  3. Add "View Source" button to see which chunks were used
  4. Add ability to start new conversation thread per paper

**Task 3.4: Add Paper Metadata Extraction**
- **Priority**: Low
- **Status**: ❌ Not Started
- **Implementation Steps**:
  1. Extract title, authors, abstract from PDF
  2. Store in `papers.metadata` JSONB field
  3. Auto-populate paper title if missing

---

### Phase 2: Enhanced Features (Weeks 4-6)

#### Week 4: Smart Matchmaking Enhancement

**Task 4.1: Improve Match Scoring Algorithm**
- **Priority**: High
- **Status**: Basic structure exists, needs enhancement
- **Files to Modify**:
  - `supabase/functions/ai-match-score/index.ts`

- **Current Implementation**: Basic LLM-based scoring
- **Enhanced Implementation**:
  1. **Keyword Overlap Score** (0-40 points):
     - Compare research_fields, methods, tools between profile and post
     - Use TF-IDF or simple keyword matching
     - Weight exact matches higher than partial matches

  2. **Skills Match Score** (0-30 points):
     - Compare prior project experience
     - Check publications for relevant topics
     - Match degree level requirements

  3. **Proximity Score** (0-20 points):
     - Institutional affiliation (same university = high score)
     - Geographic location (if location preferences set)
     - Advisor-advisee connections (if applicable)

  4. **LLM Synthesis Score** (0-10 points):
     - Use LLM to assess overall fit
     - Consider nuanced factors not captured by metrics
     - Generate explanation text

  5. **Overall Score Calculation**:
     ```typescript
     overall_score = (
       keyword_overlap * 0.4 +
       skills_match * 0.3 +
       proximity_score * 0.2 +
       llm_synthesis * 0.1
     )
     ```

**Task 4.2: Batch Match Scoring**
- **Priority**: Medium
- **Status**: ❌ Not Started
- **Implementation Steps**:
  1. Create background job to calculate matches for all students when new post is created
  2. Store results in `match_scores` table
  3. Allow filtering/sorting by match score in collaboration board

**Task 4.3: Match Score Dashboard**
- **Priority**: Medium
- **Status**: ❌ Not Started
- **Implementation Steps**:
  1. Add "Recommended Matches" section to dashboard
  2. Show top 5 matches for user's profile
  3. Display match score breakdown (keyword, skills, proximity)
  4. Show AI-generated explanation

---

#### Week 5: Cold Email Generator Backend

**Task 5.1: Implement Cold Email Generation**
- **Priority**: High
- **Status**: UI exists, needs backend
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

**Task 6.1: Advanced Search Filters**
- **Priority**: Medium
- **Status**: Basic search exists
- **Implementation Steps**:
  1. Add filters for:
     - Research fields (multi-select)
     - Methods and tools
     - Degree level
     - Location (with radius)
     - Publication count range
     - Institution
  2. Add sorting options:
     - Match score
     - Recent activity
     - Publication count
     - Alphabetical

**Task 6.2: Enhanced Profile Display**
- **Priority**: Medium
- **Status**: Basic profile exists
- **Implementation Steps**:
  1. Add "View Public Profile" page (read-only for other users)
  2. Show publications in chronological order
  3. Add citation metrics (h-index, total citations)
  4. Display research timeline/activity graph
  5. Show match score if viewing from collaboration board

---

### Phase 3: Stretch Goals (Weeks 7+)

#### Real-time Chat System

**Task 7.1: Implement Real-time Messaging**
- **Priority**: Low (Stretch Goal)
- **Status**: ❌ Not Started
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
- **Status**: ❌ Not Started
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
- **Status**: ❌ Not Started
- **Implementation Steps**:
  1. Integrate Google Calendar API or CalDAV
  2. Create `research_timelines` table:
     - user_id, project_id (optional)
     - milestone_name, due_date
     - description
  3. Sync deadlines for applications, projects, papers
  4. Create timeline visualization component
  5. Add reminders and notifications

**Task 8.2: Research Timeline Planner**
- **Priority**: Low
- **Status**: ❌ Not Started
- **Implementation Steps**:
  1. Create timeline UI component
  2. Allow users to create research projects
  3. Break down into phases (literature review, data collection, writing, etc.)
  4. Suggest timeline based on similar projects
  5. Integrate with calendar

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
     - Export bibliography to BibTeX
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
cold_emails (recipient_name, subject, body, tone, context)
match_scores (student_id, post_id, overall_score, explanation)
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
│   ├── PaperChat.tsx          # Chat with papers (needs RAG)
│   ├── ColdEmailGenerator.tsx # Email drafting (needs backend)
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
│   │   └── index.ts           # Handles research_assistant, chat, (todo: paper_chat, cold_email)
│   ├── ai-match-score/        # Match scoring
│   │   └── index.ts           # Basic LLM scoring
│   └── scrape-publications/   # Publication sync ✅
│       └── index.ts           # ORCID + Semantic Scholar
└── migrations/
    └── *.sql                  # Database schema
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
3. RAG implementation for Paper Chat
4. Cold Email Generator backend

**Should Have (P1)** - Important for full functionality:
5. Enhanced matchmaking algorithm
6. Advanced search filters
7. Public profile views

**Nice to Have (P2)** - Stretch goals:
8. Real-time chat
9. Calendar sync
10. Collaborative editor
11. Community Q&A

---

## Recent Changes (January 2026)

- ✅ **Migrated from Lovable AI Gateway to OpenAI** (gpt-4o-mini)
- ✅ Implemented Semantic Scholar API integration (paper search)
- ✅ Implemented arXiv API integration (preprint search)
- ✅ Implemented HuggingFace Datasets API integration
- ✅ Enhanced project ideas generation with LLM (includes methodology)
- ✅ Added all missing page routes to App.tsx
- ✅ Added TypeScript types for all 14 database tables
- ✅ Updated profiles table types (degree_status, orcid_id, google_scholar_id)
- ✅ Papers deduplicated and sorted by citation count
- ✅ Research Assistant UI updated to show citations, venue, methodology

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
