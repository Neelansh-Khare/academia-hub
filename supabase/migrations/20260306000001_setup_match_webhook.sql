-- Migration to document the matchmaking webhook setup
-- Note: Supabase Database Webhooks are recommended to be set via Dashboard.

-- Table: public.lab_posts
-- Event: INSERT
-- Type: Edge Function
-- Function: batch-match-score

-- Alternatively, enable via SQL if pg_net is available:
/*
CREATE OR REPLACE FUNCTION public.handle_batch_match_score()
RETURNS trigger AS $$
BEGIN
  PERFORM
    net.http_post(
      url:='https://<project-ref>.supabase.co/functions/v1/batch-match-score',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb,
      body:=json_build_object('record', row_to_json(NEW))::jsonb
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_lab_post_inserted
  AFTER INSERT ON public.lab_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_batch_match_score();
*/
