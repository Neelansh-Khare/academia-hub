-- RPC for vector similarity search on paper_chunks (for RAG in Paper Chat)
-- Requires pgvector extension (already enabled in 20250101000001_storage_setup.sql)

CREATE OR REPLACE FUNCTION public.match_paper_chunks(
  p_paper_id uuid,
  p_query_embedding vector(1536),
  p_match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  chunk_text text,
  chunk_index integer,
  page_number integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.id,
    pc.chunk_text,
    pc.chunk_index,
    pc.page_number
  FROM public.paper_chunks pc
  WHERE pc.paper_id = p_paper_id
    AND pc.embedding IS NOT NULL
  ORDER BY pc.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;

-- Allow authenticated users to call (service role used from edge function)
GRANT EXECUTE ON FUNCTION public.match_paper_chunks(uuid, vector(1536), int) TO service_role;
GRANT EXECUTE ON FUNCTION public.match_paper_chunks(uuid, vector(1536), int) TO authenticated;
