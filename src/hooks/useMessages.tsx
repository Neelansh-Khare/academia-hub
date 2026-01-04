import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type MessageInsert = Database['public']['Tables']['messages']['Insert'];
type MessageRow = Database['public']['Tables']['messages']['Row'];

export interface Message extends MessageRow {}

export const useMessages = (applicationId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', applicationId],
    queryFn: async () => {
      if (!applicationId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!applicationId && !!user,
  });

  const sendMessage = useMutation({
    mutationFn: async (newMessage: Omit<MessageInsert, 'sender_id'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('messages')
        .insert({ ...newMessage, sender_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data as Message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send message');
    },
  });

  return {
    messages,
    isLoading,
    sendMessage: sendMessage.mutate,
    isSending: sendMessage.isPending,
  };
};
