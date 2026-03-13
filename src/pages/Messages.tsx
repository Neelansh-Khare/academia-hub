import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { GraduationCap, ArrowLeft, Send, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type Conversation = {
  otherUser: Profile;
  lastMessage: Message;
  unreadCount?: number;
};

const Messages = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialUserId = searchParams.get('user_id');

  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(initialUserId || null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Load all messages and involved profiles
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch messages where user is sender or recipient
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        setMessages(messagesData || []);

        // Determine all unique other users involved in conversations
        const otherUserIds = new Set<string>();
        (messagesData || []).forEach(msg => {
          if (msg.sender_id !== user.id) otherUserIds.add(msg.sender_id);
          if (msg.recipient_id !== user.id) otherUserIds.add(msg.recipient_id);
        });

        // If we came from a profile page with a new user ID, ensure we load their profile too
        if (initialUserId && initialUserId !== user.id) {
          otherUserIds.add(initialUserId);
        }

        if (otherUserIds.size > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', Array.from(otherUserIds));

          if (profilesError) throw profilesError;

          const profilesMap: Record<string, Profile> = {};
          profilesData?.forEach(p => {
            profilesMap[p.id] = p;
          });
          setProfiles(profilesMap);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, initialUserId]);

  // Derive conversations list from messages
  useEffect(() => {
    if (!user || Object.keys(profiles).length === 0) return;

    const conversationsMap = new Map<string, Conversation>();

    // If there is an initialUser we haven't messaged yet, add them as an empty conversation
    if (initialUserId && initialUserId !== user.id && profiles[initialUserId]) {
      conversationsMap.set(initialUserId, {
        otherUser: profiles[initialUserId],
        lastMessage: {
          id: 'temp',
          sender_id: user.id,
          recipient_id: initialUserId,
          body: 'Start the conversation...',
          created_at: new Date().toISOString(),
        }
      });
    }

    // Process messages chronologically to keep the latest as `lastMessage`
    messages.forEach(msg => {
      const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
      if (profiles[otherId]) {
        conversationsMap.set(otherId, {
          otherUser: profiles[otherId],
          lastMessage: msg,
        });
      }
    });

    const sortedConversations = Array.from(conversationsMap.values()).sort(
      (a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    );

    setConversations(sortedConversations);

    // If no active user and we have conversations, pick the most recent one
    if (!activeUserId && sortedConversations.length > 0 && !initialUserId) {
      setActiveUserId(sortedConversations[0].otherUser.id);
    }
  }, [messages, profiles, user, activeUserId, initialUserId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
          
          // If message is from someone not in our profiles yet, we need to fetch their profile
          if (!profiles[newMsg.sender_id]) {
            supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .eq('id', newMsg.sender_id)
              .single()
              .then(({ data }) => {
                if (data) {
                  setProfiles(prev => ({ ...prev, [data.id]: data }));
                }
              });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profiles]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeUserId || !newMessage.trim()) return;

    setIsSending(true);
    const msgBody = newMessage.trim();
    setNewMessage('');

    try {
      // Optimistic UI update
      const optimisticMsg: Message = {
        id: `temp-${Date.now()}`,
        sender_id: user.id,
        recipient_id: activeUserId,
        body: msgBody,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, optimisticMsg]);

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: activeUserId,
          body: msgBody,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Update temp message with real ID (optional, but good practice)
      setMessages(prev => prev.map(msg => msg.id === optimisticMsg.id ? data : msg));

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      // Revert optimistic update on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
      setNewMessage(msgBody); // Put text back
    } finally {
      setIsSending(false);
    }
  };

  const activeMessages = messages.filter(
    msg => (msg.sender_id === user?.id && msg.recipient_id === activeUserId) || 
           (msg.sender_id === activeUserId && msg.recipient_id === user?.id)
  );

  const activeUserProfile = activeUserId ? profiles[activeUserId] : null;

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            <span className="font-display text-xl">Messages</span>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-6 pb-6 h-[calc(100vh-65px)] flex">
        <Card className="flex-1 flex overflow-hidden border-border/50 shadow-sm">
          {/* Sidebar - Conversation List */}
          <div className={`w-full md:w-80 border-r flex flex-col bg-muted/10 ${activeUserId && 'hidden md:flex'}`}>
            <div className="p-4 border-b bg-background/50">
              <h2 className="font-semibold px-2">Conversations</h2>
            </div>
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-3">
                  <MessageSquare className="w-8 h-8 opacity-20" />
                  <p className="text-sm">No conversations yet.</p>
                  <Button variant="outline" size="sm" onClick={() => navigate('/board')}>
                    Find Collaborators
                  </Button>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {conversations.map(conv => (
                    <button
                      key={conv.otherUser.id}
                      onClick={() => setActiveUserId(conv.otherUser.id)}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                        activeUserId === conv.otherUser.id 
                          ? 'bg-primary/10 hover:bg-primary/15' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Avatar className="w-10 h-10 border border-background">
                        <AvatarImage src={conv.otherUser.avatar_url || ''} />
                        <AvatarFallback>
                          {conv.otherUser.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="font-medium text-sm truncate pr-2">
                            {conv.otherUser.full_name || 'Unknown User'}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {new Date(conv.lastMessage.created_at).toLocaleDateString(undefined, {
                              month: 'short', day: 'numeric'
                            })}
                          </span>
                        </div>
                        <p className={`text-xs truncate ${activeUserId === conv.otherUser.id ? 'text-primary/80' : 'text-muted-foreground'}`}>
                          {conv.lastMessage.sender_id === user.id ? 'You: ' : ''}
                          {conv.lastMessage.body}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Main Chat Area */}
          <div className={`flex-1 flex flex-col bg-background ${!activeUserId && 'hidden md:flex'}`}>
            {activeUserId && activeUserProfile ? (
              <>
                {/* Chat Header */}
                <div className="h-16 px-4 border-b flex items-center justify-between bg-background z-10">
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="md:hidden -ml-2"
                      onClick={() => setActiveUserId(null)}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <Avatar 
                      className="w-8 h-8 cursor-pointer border border-border"
                      onClick={() => navigate(`/profile/${activeUserProfile.id}`)}
                    >
                      <AvatarImage src={activeUserProfile.avatar_url || ''} />
                      <AvatarFallback>{activeUserProfile.full_name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <button 
                      className="font-medium hover:underline text-left"
                      onClick={() => navigate(`/profile/${activeUserProfile.id}`)}
                    >
                      {activeUserProfile.full_name || 'Unknown User'}
                    </button>
                  </div>
                </div>

                {/* Messages List */}
                <div 
                  className="flex-1 p-4 overflow-y-auto"
                  ref={scrollRef}
                >
                  <div className="space-y-4 max-w-3xl mx-auto flex flex-col justify-end min-h-full">
                    {activeMessages.length === 0 ? (
                      <div className="text-center text-muted-foreground p-8 my-auto">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No messages yet. Send a message to start the conversation!</p>
                      </div>
                    ) : (
                      activeMessages.map((msg, index) => {
                        const isMe = msg.sender_id === user.id;
                        const showAvatar = !isMe && (index === activeMessages.length - 1 || activeMessages[index + 1].sender_id === user.id);
                        
                        return (
                          <div 
                            key={msg.id} 
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2 items-end group`}
                          >
                            {!isMe && (
                              <div className="w-6 shrink-0">
                                {showAvatar && (
                                  <Avatar className="w-6 h-6 border bg-background">
                                    <AvatarImage src={activeUserProfile.avatar_url || ''} />
                                    <AvatarFallback className="text-[10px]">{activeUserProfile.full_name?.charAt(0) || '?'}</AvatarFallback>
                                  </Avatar>
                                )}
                              </div>
                            )}
                            <div 
                              className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                                isMe 
                                  ? 'bg-primary text-primary-foreground rounded-br-sm' 
                                  : 'bg-muted/60 text-foreground border rounded-bl-sm'
                              }`}
                            >
                              <p className="break-words whitespace-pre-wrap">{msg.body}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Message Input */}
                <div className="p-4 border-t bg-background">
                  <form 
                    onSubmit={handleSendMessage}
                    className="flex gap-2 max-w-3xl mx-auto items-end"
                  >
                    <div className="flex-1">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="rounded-full bg-muted/40 border-muted placeholder:text-muted-foreground/60 transition-all focus-visible:ring-1"
                        autoComplete="off"
                        disabled={isSending}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      size="icon" 
                      disabled={!newMessage.trim() || isSending}
                      className="rounded-full shrink-0 shadow-sm"
                    >
                      <Send className="w-4 h-4 mr-[2px]" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 hidden md:flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 border border-border/50 shadow-sm">
                  <MessageSquare className="w-8 h-8 text-primary/40" />
                </div>
                <p className="text-lg font-medium text-foreground">Your Messages</p>
                <p className="text-sm mt-1">Select a conversation or start a new one</p>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Messages;
