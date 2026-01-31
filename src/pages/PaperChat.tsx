import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Upload, Send, FileText, X, Loader2, MessageSquare, PlusCircle, FileSearch } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Paper {
  id: string;
  title: string;
  filename: string;
  uploaded_at: string;
  processed: boolean;
}

interface ChunkSource {
  id: string;
  page_number: number | null;
  chunk_text: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  chunks_used?: string[];
  chunks?: ChunkSource[];
}

const PaperChat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processingPaperId, setProcessingPaperId] = useState<string | null>(null);
  const [viewSourceMessageId, setViewSourceMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (user) {
      loadPapers();
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll papers when one is processing
  useEffect(() => {
    if (!processingPaperId || !user) return;
    const interval = setInterval(() => loadPapers(), 5000);
    pollIntervalRef.current = interval;
    return () => {
      clearInterval(interval);
      pollIntervalRef.current = null;
    };
  }, [processingPaperId, user]);

  // Clear processing state when paper becomes processed
  useEffect(() => {
    if (!processingPaperId) return;
    const paper = papers.find((p) => p.id === processingPaperId);
    if (paper?.processed) setProcessingPaperId(null);
  }, [papers, processingPaperId]);

  const loadPapers = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('papers')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setPapers(data || []);
    } catch (error: any) {
      console.error('Failed to load papers:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) {
      toast.error('Please sign in to upload papers');
      navigate('/auth');
      return;
    }

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `papers/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('papers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('papers').getPublicUrl(filePath);

      // Create paper record
      const { data, error } = await supabase
        .from('papers')
        .insert({
          user_id: user.id,
          title: file.name.replace(/\.[^/.]+$/, ''),
          filename: file.name,
          file_url: publicUrl,
          file_size: file.size,
          processed: false,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Paper uploaded. Processing for RAG...');
      await loadPapers();
      setSelectedPaper(data);
      setProcessingPaperId(data.id);

      // Trigger PDF processing and embedding pipeline
      supabase.functions.invoke('process-paper', { body: { paper_id: data.id } }).then(({ error: processError }) => {
        if (processError) {
          console.error('process-paper error:', processError);
          toast.error('Processing failed. You can try again later.');
        }
        setProcessingPaperId(null);
        loadPapers();
      }).catch(() => {
        setProcessingPaperId(null);
        loadPapers();
      });
    } catch (error: any) {
      toast.error('Failed to upload paper');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const loadConversation = async (paper: Paper) => {
    if (!user?.id) return;

    setSelectedPaper(paper);
    setMessages([]);
    setConversationId(null);
    setViewSourceMessageId(null);

    try {
      // Check for existing conversation
      const { data: existingConv } = await supabase
        .from('paper_conversations')
        .select('id')
        .eq('paper_id', paper.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingConv) {
        setConversationId(existingConv.id);
        // Load messages (chunks not stored in DB)
        const { data: msgs } = await supabase
          .from('paper_messages')
          .select('*')
          .eq('conversation_id', existingConv.id)
          .order('created_at', { ascending: true });

        if (msgs) {
          setMessages(msgs.map((m): Message => ({
            id: m.id,
            role: m.role === 'user' || m.role === 'assistant' ? m.role : 'user',
            content: m.content,
            created_at: m.created_at,
            chunks_used: m.chunks_used ?? undefined,
            chunks: undefined,
          })));
        }
      }
    } catch (error: any) {
      console.error('Failed to load conversation:', error);
    }
  };

  const startNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setViewSourceMessageId(null);
    toast.success('Started a new conversation');
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedPaper || !user) return;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      // Create conversation if needed
      let convId = conversationId;
      if (!convId) {
        const { data: newConv, error: convError } = await supabase
          .from('paper_conversations')
          .insert({
            paper_id: selectedPaper.id,
            user_id: user.id,
          })
          .select()
          .single();

        if (convError) throw convError;
        convId = newConv.id;
        setConversationId(convId);
      }

      // Save user message
      const { data: savedUserMsg, error: msgError } = await supabase
        .from('paper_messages')
        .insert({
          conversation_id: convId,
          role: 'user',
          content: inputMessage,
        })
        .select()
        .single();

      if (msgError) throw msgError;

      // Call AI function for response
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke(
        'ai-lab-assistant',
        {
          body: {
            type: 'paper_chat',
            paper_id: selectedPaper.id,
            conversation_id: convId,
            message: inputMessage,
          },
        }
      );

      if (aiError) throw aiError;

      const assistantMessage: Message = {
        id: `temp-assistant-${Date.now()}`,
        role: 'assistant',
        content: aiResponse.response || 'I apologize, but I could not process your question. Please try again.',
        created_at: new Date().toISOString(),
        chunks_used: aiResponse.chunks_used || [],
        chunks: aiResponse.chunks || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message
      await supabase.from('paper_messages').insert({
        conversation_id: convId,
        role: 'assistant',
        content: assistantMessage.content,
        chunks_used: aiResponse.chunks_used || [],
      });
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or check if the paper is processed.',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast.error('Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>Please sign in to use Paper Chat</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">Paper Chat (ScholarGPT)</h1>
        <p className="text-muted-foreground">
          Upload research papers and chat with them using AI-powered RAG
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Papers Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Your Papers</span>
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-4 h-4 text-primary" />
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </CardTitle>
              <CardDescription>
                {uploading ? 'Uploading...' : 'Upload PDF papers to chat with'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {papers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No papers uploaded yet
                    </p>
                  ) : (
                    papers.map((paper) => (
                      <div
                        key={paper.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedPaper?.id === paper.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => loadConversation(paper)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{paper.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(paper.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                          {processingPaperId === paper.id ? (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Processing...
                            </Badge>
                          ) : paper.processed ? (
                            <Badge variant="secondary" className="text-xs">
                              Ready
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col">
            {selectedPaper ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        {selectedPaper.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Ask questions about this paper
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" onClick={startNewConversation}>
                        <PlusCircle className="w-4 h-4 mr-1" />
                        New conversation
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPaper(null);
                          setMessages([]);
                          setConversationId(null);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Start a conversation about this paper</p>
                          <p className="text-sm mt-2">
                            Ask questions like "What is the main contribution?" or "Explain the methodology"
                          </p>
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex gap-3 ${
                              msg.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${
                                msg.role === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              {msg.role === 'assistant' && msg.chunks && msg.chunks.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-border/50">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Sources: pages{' '}
                                    {[...new Set((msg.chunks || []).map((c) => c.page_number).filter(Boolean))].join(', ')}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() =>
                                      setViewSourceMessageId(viewSourceMessageId === msg.id ? null : msg.id)
                                    }
                                  >
                                    <FileSearch className="w-3 h-3 mr-1" />
                                    {viewSourceMessageId === msg.id ? 'Hide sources' : 'View sources'}
                                  </Button>
                                  {viewSourceMessageId === msg.id && (
                                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto text-xs text-muted-foreground">
                                      {(msg.chunks || []).map((c, i) => (
                                        <div key={c.id} className="p-2 rounded bg-background/50">
                                          <span className="font-medium">Page {c.page_number ?? '?'}</span>
                                          <p className="mt-1 line-clamp-3">{c.chunk_text}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                      {loading && (
                        <div className="flex gap-2 items-center text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  <Separator />
                  <div className="p-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ask a question about the paper..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        disabled={loading || !selectedPaper.processed}
                      />
                      <Button onClick={handleSendMessage} disabled={loading || !selectedPaper.processed}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    {!selectedPaper.processed && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Paper is still being processed. Please wait...
                      </p>
                    )}
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No paper selected</p>
                  <p className="text-sm">Select a paper from the sidebar to start chatting</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaperChat;

