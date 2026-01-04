import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type ApplicationInsert = Database['public']['Tables']['applications']['Insert'];
type ApplicationRow = Database['public']['Tables']['applications']['Row'];

export interface Application extends ApplicationRow {}

export const useApplications = (postId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useQuery({
    queryKey: ['applications', postId],
    queryFn: async () => {
      let query = supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (postId) {
        query = query.eq('post_id', postId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Application[];
    },
    enabled: !!user,
  });

  const createApplication = useMutation({
    mutationFn: async (newApp: Omit<ApplicationInsert, 'applicant_id'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('applications')
        .insert({ ...newApp, applicant_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data as Application;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application submitted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit application');
    },
  });

  const uploadCV = async (file: File): Promise<string> => {
    if (!user?.id) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('cvs')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('cvs')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  return {
    applications,
    isLoading,
    createApplication: createApplication.mutate,
    isCreating: createApplication.isPending,
    uploadCV,
  };
};
