import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Publication {
  id: string;
  user_id: string;
  title: string;
  authors: string[] | null;
  venue: string | null;
  year: number | null;
  url: string | null;
  doi: string | null;
  abstract: string | null;
  citation_count: number;
  source: string;
  source_id: string | null;
  created_at: string;
  updated_at: string;
}

export const usePublications = (userId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetUserId = userId || user?.id;

  const { data: publications = [], isLoading, refetch } = useQuery({
    queryKey: ['publications', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      
      const { data, error } = await supabase
        .from('publications')
        .select('*')
        .eq('user_id', targetUserId)
        .order('year', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Publication[];
    },
    enabled: !!targetUserId,
  });

  const syncPublications = useMutation({
    mutationFn: async ({ source, orcidId, authorName }: { 
      source: 'orcid' | 'semantic_scholar';
      orcidId?: string;
      authorName?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const payload: any = {
        source,
        user_id: user.id,
      };

      if (source === 'orcid' && orcidId) {
        payload.orcid_id = orcidId;
      } else if (source === 'semantic_scholar' && authorName) {
        payload.author_name = authorName;
      } else {
        throw new Error('Missing required parameters for source');
      }

      const { data, error } = await supabase.functions.invoke('scrape-publications', {
        body: payload,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['publications', user?.id] });
      toast.success(`Synced ${data.new_added} new publications from ${data.total_found} found`);
    },
    onError: (error: any) => {
      console.error('Sync publications error:', error);
      toast.error(error.message || 'Failed to sync publications');
    },
  });

  const deletePublication = useMutation({
    mutationFn: async (publicationId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('publications')
        .delete()
        .eq('id', publicationId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publications', user?.id] });
      toast.success('Publication removed');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove publication');
    },
  });

  return {
    publications,
    isLoading,
    syncPublications: syncPublications.mutate,
    isSyncing: syncPublications.isPending,
    deletePublication: deletePublication.mutate,
    isDeleting: deletePublication.isPending,
    refetch,
  };
};
