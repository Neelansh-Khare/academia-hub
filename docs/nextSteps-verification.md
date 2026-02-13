# nextSteps.md vs Actual Codebase — Verification Report

**Checked:** Routes, types, hooks, edge functions, Cold Email / Paper Chat / Matchmaking flows.

---

## ✅ Matches (Correct in nextSteps.md)

| Claim | Verification |
|-------|---------------|
| **All page routes** | `App.tsx` has `/`, `/auth`, `/dashboard`, `/profile`, `/board`, `/assistant`, `/paper-chat`, `/cold-email`, `*` → NotFound. ✓ |
| **14 database tables with TypeScript types** | `src/integrations/supabase/types.ts` defines: applications, lab_posts, messages, profiles, user_roles, linked_profiles, publications, papers, paper_chunks, paper_conversations, paper_messages, research_assistant_outputs, cold_emails, match_scores. ✓ |
| **Publication auto-scraping** | `usePublications.tsx` calls `supabase.functions.invoke('scrape-publications', { body })`; `supabase/functions/scrape-publications/index.ts` supports ORCID + Semantic Scholar. ✓ |
| **Research Assistant APIs** | `ai-lab-assistant/index.ts` has `searchSemanticScholar`, `searchArxiv`, `searchHuggingFaceDatasets`, `generateProjectIdeasAndOutline`. ✓ |
| **Only `research_assistant` and chat** | Edge function handles `body.type === 'research_assistant'` then falls through to chat (expects `messages`). No `cold_email` or `paper_chat` handlers. ✓ |
| **Smart Matchmaking “not fully connected”** | `CollaborationBoard` only *reads* from `match_scores`; no code calls `supabase.functions.invoke('ai-match-score', ...)`. Scores are never computed by the app. ✓ |
| **Cold Email “needs AI integration”** | Frontend calls `ai-lab-assistant` with `type: 'cold_email'`, but there is no `cold_email` branch; request falls through and fails with “Messages array is required”. ✓ |
| **ScholarGPT / Paper Chat “RAG not fully implemented”** | Frontend calls `ai-lab-assistant` with `type: 'paper_chat'`; no `paper_chat` handler; same failure. ✓ |
| **Edge functions present** | `supabase/functions/`: `ai-lab-assistant`, `ai-match-score`, `scrape-publications`. No `process-paper` (doc correctly says “to create”). ✓ |
| **Profiles types** | `profiles` in types.ts has `degree_status`, `orcid_id`, `google_scholar_id`. ✓ |
| **File structure** | Pages, hooks, and integrations paths match. ✓ |

---

## ⚠️ Discrepancies (Code vs doc or schema)

### 1. **Cold Email backend status (doc is right; behavior is wrong)**

- **Doc:** “Cold Email Generator: UI exists, needs AI integration” and “(todo: paper_chat, cold_email)”.
- **Reality:** The UI *does* call the backend with `type: 'cold_email'`, but `ai-lab-assistant` has no handler, so every cold-email request fails. The doc is correct that the **backend** is missing; the only inaccuracy would be saying “needs integration” without clarifying “backend handler missing.” Optional doc tweak: state explicitly that the **edge function has no `cold_email` (or `paper_chat`) handler**.

### 2. **`cold_emails` table: TypeScript types vs migration**

- **Migration** (`20250101000000_enhanced_schema.sql`): `cold_emails` has `recipient_id`, `recipient_type`, `recipient_name`, `recipient_email`, `subject`, `body`, `tone`, `context` (jsonb), `sent`, `sent_at`, `created_at`, `updated_at`.
- **types.ts**: Has `recipient_institution` and `context: string | null`; **no** `recipient_id` or `recipient_type`.
- **Frontend** (`ColdEmailGenerator.tsx`): Inserts `recipient_id`, `recipient_type`, `context: { opportunity_context: ... }` — i.e. matches the **migration**, not types.ts.
- **Conclusion:** Types are out of sync with the migration and with the frontend. Either regenerate types from the current DB or manually align types.ts with the migration (and treat `context` as jsonb/object).

### 3. **Optional: “Partially Implemented” wording**

- For **Cold Email**, nextSteps could say: “UI exists and calls backend; **backend handler for `cold_email` not implemented**” so it’s clear the missing piece is in the edge function, not the UI.

---

## Summary

- **nextSteps.md is accurate** for: implemented vs partial vs not implemented, routes, tables, APIs, and where the gaps are (cold_email/paper_chat handlers, match-score never invoked, RAG/process-paper not built).
- **Fixes to make in the repo (not in the doc):**
  1. **Backend:** Add `cold_email` and `paper_chat` handlers in `supabase/functions/ai-lab-assistant/index.ts` (or document that requests will fail until then).
  2. **Types:** Align `src/integrations/supabase/types.ts` `cold_emails` with the migration (recipient_id, recipient_type, context as jsonb; remove or rename recipient_institution to match DB).

No mandatory doc changes; optional clarification for Cold Email/Paper Chat is to state explicitly that the **edge function** is missing those handlers.
