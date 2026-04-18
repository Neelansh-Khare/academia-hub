import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { 
  MessageSquare, 
  ThumbsUp, 
  Eye, 
  Clock, 
  ArrowUpCircle,
  ArrowDownCircle,
  User as UserIcon,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  MoreVertical,
  Flag,
  Share2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Database } from '@/integrations/supabase/types';

type Question = Database['public']['Tables']['questions']['Row'] & {
  author?: {
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    institution: string | null;
  };
};

type Answer = Database['public']['Tables']['answers']['Row'] & {
  author?: {
    full_name: string | null;
    avatar_url: string | null;
  };
};

const QuestionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAnswer, setNewAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ answer: string; sources: any[] } | null>(null);

  useEffect(() => {
    if (id) {
      fetchQuestionAndAnswers();
      incrementViewCount();
    }
  }, [id]);

  const fetchQuestionAndAnswers = async () => {
    try {
      setLoading(true);
      
      // Fetch question
      const { data: qData, error: qError } = await supabase
        .from('questions')
        .select(`
          *,
          author:profiles!questions_author_id_fkey(full_name, avatar_url, bio, institution)
        `)
        .eq('id', id)
        .single();

      if (qError) throw qError;
      setQuestion(qData as any);

      // Fetch answers
      const { data: aData, error: aError } = await supabase
        .from('answers')
        .select(`
          *,
          author:profiles!answers_author_id_fkey(full_name, avatar_url)
        `)
        .eq('question_id', id)
        .order('upvotes', { ascending: false })
        .order('created_at', { ascending: true });

      if (aError) throw aError;
      setAnswers(aData as any);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load question details');
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    if (!id) return;
    try {
      await supabase.rpc('increment_question_views', { question_id: id });
    } catch (error) {
      // Ignore view count errors
    }
  };

  const handleVote = async (itemId: string, itemType: 'question' | 'answer', voteType: 1 | -1) => {
    if (!user) {
      toast.error('Please log in to vote');
      return;
    }

    try {
      const { error } = await supabase.from('votes').upsert({
        user_id: user.id,
        item_id: itemId,
        item_type: itemType,
        vote_type: voteType,
      });

      if (error) throw error;
      
      // Refresh to get updated counts
      if (itemType === 'question') {
        setQuestion(prev => prev ? { ...prev, upvotes: prev.upvotes + voteType } : null);
      } else {
        setAnswers(prev => prev.map(a => a.id === itemId ? { ...a, upvotes: a.upvotes + voteType } : a));
      }
      
      toast.success('Vote recorded');
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to record vote');
    }
  };

  const handleSubmitAnswer = async () => {
    if (!user || !id || !newAnswer.trim()) {
      toast.error('Please write an answer');
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await supabase.from('answers').insert({
        question_id: id,
        author_id: user.id,
        content: newAnswer,
      });

      if (error) throw error;

      toast.success('Answer posted successfully!');
      setNewAnswer('');
      setAiSuggestion(null);
      fetchQuestionAndAnswers();
    } catch (error) {
      console.error('Error posting answer:', error);
      toast.error('Failed to post answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetAiSuggestion = async () => {
    if (!question) return;
    try {
      setIsSuggesting(true);
      const { data, error } = await supabase.functions.invoke('ai-lab-assistant', {
        body: {
          type: 'community_answer',
          title: question.title,
          content: question.content,
          tags: question.tags,
        },
      });

      if (error) throw error;
      setAiSuggestion(data);
      toast.success('AI suggestion generated!');
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      toast.error('Failed to generate AI suggestion');
    } finally {
      setIsSuggesting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-32 w-full mb-8" />
        <Skeleton className="h-8 w-1/4 mb-4" />
        <Skeleton className="h-24 w-full mb-4" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold">Question not found</h2>
        <Button variant="link" onClick={() => navigate('/community')}>Back to Community</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-6 -ml-2 text-muted-foreground"
        onClick={() => navigate('/community')}
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Community
      </Button>

      <div className="flex flex-col md:flex-row gap-6 mb-12">
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-col items-center bg-muted/30 p-2 rounded-lg border">
            <button 
              className="text-muted-foreground hover:text-primary transition-colors"
              onClick={() => handleVote(question.id, 'question', 1)}
            >
              <ArrowUpCircle className="w-8 h-8" />
            </button>
            <span className="font-bold text-xl my-1">{question.upvotes}</span>
            <button 
              className="text-muted-foreground hover:text-destructive transition-colors"
              onClick={() => handleVote(question.id, 'question', -1)}
            >
              <ArrowDownCircle className="w-8 h-8" />
            </button>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            {question.is_ama && (
              <Badge className="bg-primary text-primary-foreground gap-1">
                <Sparkles className="w-3 h-3" />
                AMA
              </Badge>
            )}
            <div className="flex flex-wrap gap-1">
              {question.tags?.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs uppercase font-bold px-2 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <h1 className="text-3xl font-display font-bold mb-4">{question.title}</h1>
          
          <div className="flex items-center gap-4 mb-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={question.author?.avatar_url || ''} />
                <AvatarFallback>{question.author?.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">{question.author?.full_name || 'Anonymous'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Asked {format(new Date(question.created_at), 'MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              <span>{question.views} views</span>
            </div>
          </div>

          <div className="prose prose-slate max-w-none mb-8 text-foreground/90 whitespace-pre-wrap">
            {question.content}
          </div>

          <div className="flex items-center justify-between border-t pt-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Flag className="w-4 h-4" />
                Report
              </Button>
            </div>
            
            {user?.id === question.author_id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toast.info('Edit coming soon')}>Edit Question</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Delete Question</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
          </h2>
        </div>

        {answers.map((answer) => (
          <div key={answer.id} className="flex flex-col md:flex-row gap-6 py-6 border-b last:border-0">
            <div className="flex flex-col items-center gap-2">
              <button 
                className="text-muted-foreground hover:text-primary transition-colors"
                onClick={() => handleVote(answer.id, 'answer', 1)}
              >
                <ArrowUpCircle className="w-7 h-7" />
              </button>
              <span className="font-bold text-lg">{answer.upvotes}</span>
              <button 
                className="text-muted-foreground hover:text-destructive transition-colors"
                onClick={() => handleVote(answer.id, 'answer', -1)}
              >
                <ArrowDownCircle className="w-7 h-7" />
              </button>
              {answer.is_accepted && (
                <CheckCircle2 className="w-6 h-6 text-green-500 mt-2" title="Accepted Answer" />
              )}
            </div>

            <div className="flex-1">
              <div className="prose prose-slate max-w-none mb-6 text-foreground/90 whitespace-pre-wrap text-sm">
                {answer.content}
              </div>

              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" className="h-8 text-xs gap-2">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Helpful
                  </Button>
                </div>
                
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={answer.author?.avatar_url || ''} />
                    <AvatarFallback>{answer.author?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{answer.author?.full_name || 'Anonymous'}</span>
                    <span className="text-[10px] text-muted-foreground">answered {format(new Date(answer.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Your Answer</h3>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-primary border-primary/20 hover:bg-primary/5 gap-2"
              onClick={handleGetAiSuggestion}
              disabled={isSuggesting}
            >
              {isSuggesting ? <Clock className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Get AI Suggestion
            </Button>
          </div>

          {aiSuggestion && (
            <Card className="mb-6 bg-primary/5 border-primary/20 animate-fade-in">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  AI Generated Draft
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm whitespace-pre-wrap text-foreground/80 italic">
                  {aiSuggestion.answer}
                </div>
                {aiSuggestion.sources && aiSuggestion.sources.length > 0 && (
                  <div className="pt-2 border-t border-primary/10">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Sources Found:</p>
                    <div className="space-y-1">
                      {aiSuggestion.sources.map((source, i) => (
                        <a 
                          key={i} 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] text-primary hover:underline block truncate"
                        >
                          • {source.title} ({source.year})
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs ml-auto"
                  onClick={() => {
                    setNewAnswer(aiSuggestion.answer);
                    setAiSuggestion(null);
                  }}
                >
                  Use this draft
                </Button>
              </CardFooter>
            </Card>
          )}

          <Textarea 
            placeholder="Share your knowledge or experience..."
            className="min-h-[150px] mb-4"
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmitAnswer} 
              disabled={isSubmitting || !newAnswer.trim()}
            >
              {isSubmitting ? 'Posting...' : 'Post Your Answer'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionDetail;
