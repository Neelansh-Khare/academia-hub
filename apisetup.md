# API Setup Guide

This document explains how to configure all the external APIs used by AcademiaHub.

---

## Required APIs

### 1. OpenAI API (Required)

OpenAI powers all LLM features including the Research Assistant, Match Scoring, and Cold Email Generator.

**Setup Steps:**

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to **API Keys** → **Create new secret key**
4. Copy the key (you won't be able to see it again)
5. Add to Supabase:
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Navigate to **Edge Functions** → **Secrets**
   - Click **Add new secret**
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key

**Model Used:** `gpt-4o-mini`

**Pricing (as of 2026):**
| Model | Input | Output |
|-------|-------|--------|
| gpt-4o-mini | $0.15/1M tokens | $0.60/1M tokens |
| gpt-4o | $2.50/1M tokens | $10.00/1M tokens |

**Features Using This API:**
- Research Assistant (project ideas, paper outlines, library recommendations)
- AI Match Scoring (profile-to-post matching)
- Cold Email Generator (coming soon)
- Paper Chat RAG (coming soon)

---

### 2. Supabase (Required)

Supabase provides the database, authentication, storage, and edge functions.

**Setup Steps:**

1. Go to [Supabase](https://supabase.com/)
2. Create a new project
3. Get your credentials from **Settings** → **API**:
   - Project URL
   - Anon/Public Key
4. Create `.env` file in project root:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```
5. Run database migrations:
   ```bash
   supabase link --project-ref your-project-ref
   supabase db push
   ```
6. Deploy Edge Functions:
   ```bash
   supabase functions deploy ai-lab-assistant
   supabase functions deploy ai-match-score
   supabase functions deploy scrape-publications
   ```

---

## External APIs (No Setup Required)

These APIs are public and don't require API keys for basic usage.

### 3. Semantic Scholar API

Used for paper discovery and author publication scraping.

**Endpoint:** `https://api.semanticscholar.org/graph/v1/`

**Rate Limits:**
- Without API key: 100 requests/minute
- With API key: Higher limits available

**Optional Setup (for higher rate limits):**
1. Go to [Semantic Scholar API](https://www.semanticscholar.org/product/api)
2. Request an API key
3. Add to Supabase secrets: `SEMANTIC_SCHOLAR_API_KEY`

**Features Using This API:**
- Research Assistant (paper search)
- Publication sync (author papers)

---

### 4. arXiv API

Used for searching preprints and recent research papers.

**Endpoint:** `https://export.arxiv.org/api/query`

**Rate Limits:** 1 request per 3 seconds (be polite)

**No API key required.**

**Features Using This API:**
- Research Assistant (preprint search)

---

### 5. HuggingFace Datasets API

Used for discovering relevant datasets for research topics.

**Endpoint:** `https://huggingface.co/api/datasets`

**Rate Limits:** No strict limits for public datasets

**No API key required.**

**Features Using This API:**
- Research Assistant (dataset discovery)

---

### 6. ORCID API

Used for scraping user publications from ORCID profiles.

**Endpoint:** `https://pub.orcid.org/v3.0/`

**Rate Limits:** Reasonable use (no official limit)

**No API key required for public data.**

**Features Using This API:**
- Publication sync (ORCID publications)

---

## Optional APIs

### 7. Mapbox API (Not Yet Implemented)

For location-based features like proximity matching and map visualization.

**Setup Steps:**
1. Go to [Mapbox](https://www.mapbox.com/)
2. Create an account
3. Get your access token
4. Add to `.env`:
   ```env
   VITE_MAPBOX_TOKEN=your-mapbox-token
   ```

**Free Tier:** 50,000 map loads/month

---

## Environment Variables Summary

### Frontend (`.env` file)

```env
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Optional
VITE_MAPBOX_TOKEN=your-mapbox-token
```

### Supabase Edge Functions (Secrets)

| Secret Name | Required | Description |
|-------------|----------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | OpenAI API key for LLM features |
| `SEMANTIC_SCHOLAR_API_KEY` | ❌ No | For higher rate limits |

---

## Verifying Setup

### Test OpenAI Connection

After setting up the `OPENAI_API_KEY` secret, test by:

1. Start the dev server: `npm run dev`
2. Navigate to `/assistant`
3. Enter a research topic and click "Generate"
4. If working, you'll see papers, project ideas, and datasets

### Check Edge Function Logs

If something isn't working:

1. Go to Supabase Dashboard
2. Navigate to **Edge Functions** → Select function
3. Click **Logs** to see any errors

Common issues:
- `OPENAI_API_KEY is not configured` → Add the secret in Supabase
- `401 Unauthorized` → Check if your API key is valid
- `429 Rate Limited` → Wait and try again, or upgrade your plan

---

## Cost Optimization Tips

1. **Use `gpt-4o-mini`** - It's 20x cheaper than `gpt-4o` and sufficient for most tasks
2. **Cache API responses** - Semantic Scholar and arXiv results can be cached
3. **Batch requests** - When syncing publications, batch multiple authors
4. **Set usage limits** - Configure spending limits in OpenAI dashboard

---

## API Documentation Links

- [OpenAI API Docs](https://platform.openai.com/docs)
- [Semantic Scholar API Docs](https://api.semanticscholar.org/api-docs/)
- [arXiv API User Manual](https://arxiv.org/help/api/user-manual)
- [HuggingFace Datasets Docs](https://huggingface.co/docs/datasets/)
- [ORCID API Documentation](https://pub.orcid.org/v3.0/)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Mapbox Documentation](https://docs.mapbox.com/)
