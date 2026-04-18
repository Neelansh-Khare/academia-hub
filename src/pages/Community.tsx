import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Search, 
  MessageSquare, 
  ThumbsUp, 
  Eye, 
  Plus, 
  Tag as TagIcon, 
  Clock, 
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  User as UserIcon,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useNavigate } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';

type Question = Database['public']['Tables']['questions']['Row'] & {
  author?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  answer_count?: number;
};

const Community = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ title: '', content: '', tags: '' });
  const [filter, setFilter] = useState<'newest' | 'popular' | 'ama'>('newest');

  useEffect(() => {
    fetchQuestions();
  }, [filter]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('questions')
        .select(`
          *,
          author:profiles!questions_author_id_fkey(full_name, avatar_url),
          answers(id)
        `);

      if (filter === 'popular') {
        query = query.order('upvotes', { ascending: false });
      } else if (filter === 'ama') {
        query = query.eq('is_ama', true).order('created_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedQuestions = (data || []).map(q => ({
        ...q,
        author: q.author as any,
        answer_count: q.answers?.length || 0
      }));

      setQuestions(formattedQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!user || !newQuestion.title || !newQuestion.content) {
      toast.error('Please fill in title and content');
      return;
    }

    try {
      const tags = newQuestion.tags.split(',').map(t => t.trim()).filter(t => t !== '');
      
      const { data, error } = await supabase.from('questions').insert({
        author_id: user.id,
        title: newQuestion.title,
        content: newQuestion.content,
        tags: tags,
      }).select().single();

      if (error) throw error;

      toast.success('Question posted successfully!');
      setIsAddingQuestion(false);
      setNewQuestion({ title: '', content: '', tags: '' });
      fetchQuestions();
      
      // Navigate to the new question detail page
      if (data) navigate(`/community/question/${data.id}`);
    } catch (error) {
      console.error('Error adding question:', error);
      toast.error('Failed to post question');
    }
  };

  const handleVote = async (questionId: string, voteType: 1 | -1, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to vote');
      return;
    }

    try {
      const { error } = await supabase.from('votes').upsert({
        user_id: user.id,
        item_id: questionId,
        item_type: 'question',
        vote_type: voteType,
      });

      if (error) throw error;
      
      // Optimistic update
      setQuestions(prev => prev.map(q => {
        if (q.id === questionId) {
          return { ...q, upvotes: q.upvotes + voteType };
        }
        return q;
      }));
      
      toast.success('Vote recorded');
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to record vote');
    }
  };

  const filteredQuestions = questions.filter(q => 
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            Community Q&A
            <Badge variant="secondary" className="font-normal text-xs">Beta</Badge>
          </h1>
          <p className="text-muted-foreground mt-1">Ask questions, share knowledge, and connect with other researchers.</p>
        </div>
        <Dialog open={isAddingQuestion} onOpenChange={setIsAddingQuestion}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Ask Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ask a Research Question</DialogTitle>
              <DialogDescription>
                Be specific and provide enough context for others to help you.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., How to handle missing data in longitudinal studies?"
                  value={newQuestion.title}
                  onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  placeholder="e.g., statistics, data-analysis, psychology"
                  value={newQuestion.tags}
                  onChange={(e) => setNewQuestion({ ...newQuestion, tags: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Explain your question in detail..."
                  className="min-h-[200px]"
                  value={newQuestion.content}
                  onChange={(e) => setNewQuestion({ ...newQuestion, content: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsAddingQuestion(false)}>Cancel</Button>
                <Button onClick={handleAddQuestion}>Post Question</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search questions, tags, or topics..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border">
          <Button 
            variant={filter === 'newest' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="h-8"
            onClick={() => setFilter('newest')}
          >
            Newest
          </Button>
          <Button 
            variant={filter === 'popular' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="h-8"
            onClick={() => setFilter('popular')}
          >
            Popular
          </Button>
          <Button 
            variant={filter === 'ama' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="h-8"
            onClick={() => setFilter('ama')}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 text-primary" />
            Mentor AMA
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          ))
        ) : filteredQuestions.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-semibold">No questions found</h3>
            <p className="text-muted-foreground mb-6">Be the first to ask a question in this community!</p>
            <Button onClick={() => setIsAddingQuestion(true)}>Ask a Question</Button>
          </Card>
        ) : (
          filteredQuestions.map((question) => (
            <Card key={question.id} className="group hover:border-primary/30 transition-all cursor-pointer overflow-hidden" onClick={() => navigate(`/community/question/${question.id}`)}>
              <div className="flex">
                <div className="hidden md:flex flex-col items-center justify-center px-6 bg-muted/20 gap-3">
                  <div className="flex flex-col items-center">
                    <button 
                      className="text-muted-foreground hover:text-primary transition-colors"
                      onClick={(e) => handleVote(question.id, 1, e)}
                    >
                      <ArrowUpCircle className="w-6 h-6" />
                    </button>
                    <span className="font-bold text-lg my-1">{question.upvotes}</span>
                    <button 
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      onClick={(e) => handleVote(question.id, -1, e)}
                    >
                      <ArrowDownCircle className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="flex flex-col items-center text-muted-foreground">
                    <MessageSquare className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">{question.answer_count}</span>
                  </div>
                </div>
                
                <div className="flex-1 p-6">
                  <div className="flex items-center gap-2 mb-2">
                    {question.is_ama && (
                      <Badge className="bg-primary text-primary-foreground gap-1">
                        <Sparkles className="w-3 h-3" />
                        AMA
                      </Badge>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {question.tags?.map(tag => (
                        <Badge key={tag} variant="outline" className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors mb-2">
                    {question.title}
                  </h3>
                  
                  <p className="text-muted-foreground line-clamp-2 mb-4 text-sm">
                    {question.content}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5" />
                        <span>{question.author?.full_name || 'Anonymous'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{format(new Date(question.created_at), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{question.views} views</span>
                      </div>
                    </div>
                    
                    <div className="flex md:hidden items-center gap-3">
                       <div className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold">{question.upvotes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-bold">{question.answer_count}</span>
                      </div>
                    </div>

                    <div className="hidden md:block">
                      <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Community;
