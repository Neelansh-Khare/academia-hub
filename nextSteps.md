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

### 🟡 Partially Implemented (Needs Enhancement)
- **Smart Matchmaking**: Database schema exists, but AI matching algorithm needs enhancement
- **ScholarGPT (Paper Chat)**: UI exists, but RAG system not fully implemented
- **Auto Research Assistant**: UI exists, but needs actual API integrations
- **Profiles**: Manual entry works, but auto-scraping from ORCID/Semantic Scholar missing

### ❌ Not Yet Implemented
- Auto-scraping publications from ORCID/Semantic Scholar
- Full RAG implementation for paper processing
- API integrations (Semantic Scholar, arXiv, HuggingFace Datasets)
- Real-time professor-student chat
- Calendar sync and timeline planning
- Collaborative document editor
- Community Q&A board
- Integration with Notion/Obsidian

---

## Implementation Roadmap

### Phase 1: Core MVP Completion (Weeks 1-3)

#### Week 1: Profile Enhancements & Publication Auto-Scraping

**Task 1.1: Auto-scrape Publications from ORCID** ✅
- **Priority**: High
- **Status**: ✅ Completed
- **Files Created/Modified**:
  - ✅ `supabase/functions/scrape-publications/index.ts` (new Edge Function - combined with Semantic Scholar)
  - ✅ `src/hooks/usePublications.tsx` (new hook)
  - ✅ `src/pages/ProfilePage.tsx` (publications tab added)

- **Implementation Steps**:
  1. Create Supabase Edge Function that calls ORCID API
  2. Use ORCID API (https://pub.orcid.org/v3.0/) to fetch publications
  3. Parse publication data and insert into `publications` table
  4. Add "Sync Publications" button to profile page
  5. Display publications in a dedicated tab on profile

- **Required API Keys**:
  - ORCID API: Register at https://orcid.org/developer-tools (public API, no key needed for public data)

- **Code Structure**:
  ```typescript
  // supabase/functions/scrape-orcid-publications/index.ts
  // - Accept ORCID ID from user
  // - Fetch works from ORCID API
  // - Transform to publications format
  // - Save to database
  ```

**Task 1.2: Auto-scrape Publications from Semantic Scholar** ✅
- **Priority**: High
- **Status**: ✅ Completed
- **Implementation Steps**:
  1. Create Edge Function for Semantic Scholar API
  2. Use Semantic Scholar API (https://api.semanticscholar.org/api-docs/) to find publications by author name
  3. Match publications to user profile
  4. Store in `publications` table with `source: 'semantic_scholar'`

- **Required API Keys**:
  - Semantic Scholar API: Free tier available (https://www.semanticscholar.org/product/api)

**Task 1.3: Auto-scrape Publications from Google Scholar** ✅
- **Priority**: Medium
- **Status**: ✅ Documented (No implementation - API not available)
- **Note**: ✅ Google Scholar doesn't have an official API. Manual profile linking is implemented; users are encouraged to use Semantic Scholar as primary source for auto-scraping.

**Task 1.4: Display Publications on Profile** ✅
- **Priority**: High
- **Status**: ✅ Completed
- **Implementation Steps**:
  1. Add "Publications" tab to ProfilePage.tsx
  2. Fetch publications using `usePublications` hook
  3. Display in a card grid with filters (year, venue, type)
  4. Show citation counts and links to full papers

---

#### Week 2: Research Assistant API Integration

**Task 2.1: Integrate Semantic Scholar API for Paper Discovery**
- **Priority**: High
- **Status**: Not Started
- **Files to Modify**:
  - `supabase/functions/ai-lab-assistant/index.ts` (enhance research_assistant type)
  - `src/pages/ResearchAssistant.tsx` (may need minor updates)

- **Implementation Steps**:
  1. Modify Edge Function to accept `type: 'research_assistant'` with prompt
  2. Call Semantic Scholar API to search papers by topic:
     ```typescript
     // Example: GET https://api.semanticscholar.org/graph/v1/paper/search?query=few-shot+learning
     ```
  3. Return top 10 most relevant papers with:
     - Title, authors, abstract, year
     - URL (Semantic Scholar link)
     - Citation count
     - Venue information

- **Expected Output Structure**:
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
        venue: string
      }
    ]
  }
  ```

**Task 2.2: Integrate arXiv API for Additional Papers**
- **Priority**: Medium
- **Status**: Not Started
- **Implementation Steps**:
  1. Call arXiv API (https://arxiv.org/help/api/user-manual) to search papers
  2. Combine results with Semantic Scholar results
  3. Deduplicate based on title similarity
  4. Return top 10 combined results

**Task 2.3: Integrate HuggingFace Datasets API**
- **Priority**: Medium
- **Status**: Not Started
- **Files to Modify**:
  - `supabase/functions/ai-lab-assistant/index.ts`

- **Implementation Steps**:
  1. Use HuggingFace Datasets API (https://huggingface.co/docs/datasets/) to search datasets
  2. Search by keywords from research prompt
  3. Return top 5-10 relevant datasets with:
     - Name, description
     - Dataset size and format
     - Direct download link
     - License information

- **API Endpoint**:
  ```typescript
  // https://huggingface.co/api/datasets?search={query}
  ```

**Task 2.4: Enhance Project Ideas Generation**
- **Priority**: Medium
- **Status**: Partially Done (LLM generation exists, needs improvement)
- **Implementation Steps**:
  1. Use GPT-4/Claude to synthesize papers into project ideas
  2. Ensure ideas are:
     - Specific and actionable
     - Based on gaps identified in literature review
     - Include methodology suggestions

**Task 2.5: Improve Paper Outline Generation**
- **Priority**: Low
- **Status**: Partially Done
- **Implementation Steps**:
  1. Enhance LLM prompt to generate more detailed outlines
  2. Include subsection breakdowns
  3. Suggest specific papers to cite in each section

---

#### Week 3: ScholarGPT RAG Implementation

**Task 3.1: Implement PDF Processing Pipeline**
- **Priority**: High
- **Status**: Partially Done (upload works, processing missing)
- **Files to Create/Modify**:
  - `supabase/functions/process-paper/index.ts` (new Edge Function)
  - Background job trigger for processing

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
  - OpenAI API for embeddings

**Task 3.2: Implement RAG Query System**
- **Priority**: High
- **Status**: Not Started
- **Files to Modify**:
  - `supabase/functions/ai-lab-assistant/index.ts` (enhance paper_chat type)

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
     - Pass chunks as context to LLM (GPT-4 or Claude)
     - Generate response with citations to page numbers

  2. Update Edge Function to handle `type: 'paper_chat'`:
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
- **Status**: Not Started
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
- **Status**: Not Started
- **Implementation Steps**:
  1. Create background job to calculate matches for all students when new post is created
  2. Store results in `match_scores` table
  3. Allow filtering/sorting by match score in collaboration board

**Task 4.3: Match Score Dashboard**
- **Priority**: Medium
- **Status**: Not Started
- **Implementation Steps**:
  1. Add "Recommended Matches" section to dashboard
  2. Show top 5 matches for user's profile
  3. Display match score breakdown (keyword, skills, proximity)
  4. Show AI-generated explanation

---

#### Week 5: External API Integrations

**Task 5.1: Mapbox Integration for Location Services**
- **Priority**: Low
- **Status**: Not Started
- **Use Cases**:
  - Location-based search in collaboration board
  - Proximity scoring in matchmaking
  - Visualization of opportunities on map

- **Implementation Steps**:
  1. Sign up for Mapbox API key
  2. Add Mapbox React components
  3. Geocode location strings to coordinates
  4. Calculate distances between locations

**Task 5.2: Google Scholar Profile Integration (Optional)**
- **Priority**: Low
- **Status**: Not Started
- **Note**: Google Scholar doesn't have an official API. Consider:
  - Manual profile linking (already implemented)
  - Web scraping with user consent (legally complex)
  - Focus on Semantic Scholar and ORCID instead

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
- **Status**: Not Started
- **Tech Stack Options**:
  - Supabase Realtime (recommended - already using Supabase)
  - Socket.io with separate WebSocket server
  - Pusher or similar service

- **Implementation Steps**:
  1. Create `messages` table (if not exists) with:
     - sender_id, recipient_id
     - conversation_id
     - content, timestamp
     - read status
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
- **Status**: Not Started
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
- **Status**: Not Started
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
- **Status**: Not Started
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
- **Status**: Not Started
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
- **Status**: Not Started
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
- **Status**: Not Started
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
- **Status**: Not Started
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
   - Add to Supabase secrets: `SEMANTIC_SCHOLAR_API_KEY`

3. **arXiv API** (Public - No key needed)
   - Documentation: https://arxiv.org/help/api/user-manual
   - Rate limits: 1 request per 3 seconds (be polite)

4. **HuggingFace Datasets API** (Public)
   - Documentation: https://huggingface.co/docs/datasets/
   - No authentication required for public datasets

5. **OpenAI API** (For embeddings and LLM)
   - Already configured via Lovable API Gateway
   - For direct use: Add `OPENAI_API_KEY` to Supabase secrets

6. **Mapbox API** (Optional - for location features)
   - Sign up at: https://www.mapbox.com/
   - Free tier: 50,000 map loads/month
   - Add to env: `VITE_MAPBOX_TOKEN`

### Database Migrations Needed

Create new migration file: `supabase/migrations/YYYYMMDDHHMMSS_additional_features.sql`

```sql
-- Add any missing columns or indexes
-- Ensure pgvector extension is enabled for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_publications_user_year 
ON public.publications(user_id, year DESC);

CREATE INDEX IF NOT EXISTS idx_papers_metadata 
ON public.papers USING gin(metadata);
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
- `SEMANTIC_SCHOLAR_API_KEY`
- `OPENAI_API_KEY` (if using directly)
- `LOVABLE_API_KEY` (already configured)

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
   - Add appropriate indexes (already partially done)
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

**Must Have (P0)** - Blocking MVP completion:
1. Publication auto-scraping (ORCID, Semantic Scholar)
2. Research Assistant API integration
3. RAG implementation for Paper Chat

**Should Have (P1)** - Important for full functionality:
4. Enhanced matchmaking algorithm
5. Dataset integration (HuggingFace)
6. Advanced search filters

**Nice to Have (P2)** - Stretch goals:
7. Real-time chat
8. Calendar sync
9. Collaborative editor
10. Community Q&A

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

