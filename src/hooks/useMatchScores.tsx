import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';

type MatchScore = Tables<'match_scores'>;
type LabPost = Tables<'lab_posts'>;

interface MatchScoreWithPost extends MatchScore {
  lab_posts: LabPost;
}

export const useMatchScores = () => {
  const { user } = useAuth();
  const [isCalculating, setIsCalculating] = useState(false);
  const [matchScores, setMatchScores] = useState<MatchScoreWithPost[]>([]);
  const [isLoadingScores, setIsLoadingScores] = useState(false);

  const calculateMatchScore = async (postId: string, profileFields: any, postFields: any) => {
    if (!user) {
      toast.error('Please sign in to calculate match scores');
      return null;
    }

    try {
      setIsCalculating(true);
      
      const { data, error } = await supabase.functions.invoke('ai-match-score', {
        body: { profileFields, postFields }
      });

      if (error) throw error;

      // Save the score to the database
      const { error: dbError } = await supabase.from('match_scores').upsert({
        student_id: user.id,
        post_id: postId,
        keyword_score: data.keyword_score,
        skills_score: data.skills_score,
        proximity_score: data.proximity_score,
        llm_score: data.llm_score,
        overall_score: data.overall_score,
        explanation: data.reason,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'student_id,post_id'
      });

      if (dbError) throw dbError;

      // After calculating and saving, refresh the fetched scores
      await fetchMatchScores();

      return data;
    } catch (error: any) {
      console.error('Error calculating match score:', error);
      toast.error('Failed to calculate AI match score');
      return null;
    } finally {
      setIsCalculating(false);
    }
  };

  const fetchMatchScores = useCallback(async () => {
    if (!user) return;
    setIsLoadingScores(true);
    try {
      const { data, error } = await supabase
        .from('match_scores')
        .select(`*, lab_posts(*)`) // Select all from match_scores and join lab_posts
        .eq('student_id', user.id)
        .order('overall_score', { ascending: false })
        .limit(5); // Get top 5 matches

      if (error) throw error;
      setMatchScores(data as MatchScoreWithPost[]);
    } catch (error: any) {
      console.error('Error fetching match scores:', error);
      toast.error('Failed to load recommended matches');
    } finally {
      setIsLoadingScores(false);
    }
  }, [user]);

  // Fetch scores on component mount if user is available
  useEffect(() => {
    if (user) {
      fetchMatchScores();
    }
  }, [user, fetchMatchScores]);

  return {
    calculateMatchScore,
    isCalculating,
    fetchMatchScores,
    matchScores,
    isLoadingScores
  };
};
