import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useMatchScores = () => {
  const { user } = useAuth();
  const [isCalculating, setIsCalculating] = useState(false);

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
        llm_score: data.llm_score,
        overall_score: data.overall_score,
        explanation: data.reason,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'student_id,post_id'
      });

      if (dbError) throw dbError;

      return data;
    } catch (error: any) {
      console.error('Error calculating match score:', error);
      toast.error('Failed to calculate AI match score');
      return null;
    } finally {
      setIsCalculating(false);
    }
  };

  return {
    calculateMatchScore,
    isCalculating
  };
};
