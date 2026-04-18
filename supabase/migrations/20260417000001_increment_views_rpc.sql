-- RPC to increment question views safely
CREATE OR REPLACE FUNCTION public.increment_question_views(question_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.questions
  SET views = views + 1
  WHERE id = question_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
