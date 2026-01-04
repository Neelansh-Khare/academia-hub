import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type LabPostInsert = Database['public']['Tables']['lab_posts']['Insert'];
type LabPostRow = Database['public']['Tables']['lab_posts']['Row'];

export interface LabPost extends LabPostRow {}

export const useLabPosts = (filters?: { type?: string; search?: string }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['lab_posts', filters],
    queryFn: async () => {
      let query = supabase
        .from('lab_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LabPost[];
    },
  });

  const createPost = useMutation({
    mutationFn: async (newPost: Omit<LabPostInsert, 'owner_id'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('lab_posts')
        .insert({ ...newPost, owner_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data as LabPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab_posts'] });
      toast.success('Post created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create post');
    },
  });

  const updatePost = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<LabPost> }) => {
      const { data, error } = await supabase
        .from('lab_posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as LabPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab_posts'] });
      toast.success('Post updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update post');
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lab_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab_posts'] });
      toast.success('Post deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete post');
    },
  });

  return {
    posts,
    isLoading,
    createPost: createPost.mutate,
    updatePost: updatePost.mutate,
    deletePost: deletePost.mutate,
    isCreating: createPost.isPending,
    isUpdating: updatePost.isPending,
    isDeleting: deletePost.isPending,
  };
};
