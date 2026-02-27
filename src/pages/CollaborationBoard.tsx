import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Search, MapPin, Clock, DollarSign, Briefcase, Plus, Filter, TrendingUp, User } from 'lucide-react';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import { useMatchScores } from '@/hooks/useMatchScores';
import type { Database } from '@/integrations/supabase/types';

type LabPost = Database['public']['Tables']['lab_posts']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface PostWithMatch extends LabPost {
  match_score?: number;
  match_explanation?: string;
  owner?: Profile;
}

const CollaborationBoard = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { calculateMatchScore, isCalculating } = useMatchScores();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostWithMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [remoteFilter, setRemoteFilter] = useState<boolean | null>(null);
  const [paidFilter, setPaidFilter] = useState<boolean | null>(null);
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [showMatchScores, setShowMatchScores] = useState(false);
  const [selectedPost, setSelectedPost] = useState<LabPost | null>(null);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [cvUrl, setCvUrl] = useState('');

  useEffect(() => {
    fetchPosts();
  }, [typeFilter, remoteFilter, paidFilter, institutionFilter, locationFilter, showMatchScores, profile]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('lab_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }
      if (remoteFilter !== null) {
        query = query.eq('remote_allowed', remoteFilter);
      }
      if (paidFilter !== null) {
        query = query.eq('paid', paidFilter);
      }
      if (institutionFilter) {
        query = query.ilike('institution', `%${institutionFilter}%`);
      }
      if (locationFilter) {
        query = query.ilike('location', `%${locationFilter}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      let postsWithMatches: PostWithMatch[] = data || [];

      // Fetch owner profiles
      const ownerIds = [...new Set(postsWithMatches.map(p => p.owner_id))];
      if (ownerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', ownerIds);
        
        if (profiles) {
          const profileMap = new Map(profiles.map(p => [p.id, p]));
          postsWithMatches = postsWithMatches.map(post => ({
            ...post,
            owner: profileMap.get(post.owner_id)
          }));
        }
      }

      // Load match scores if user is logged in and match scores are enabled
      if (user && showMatchScores && profile) {
        const postIds = postsWithMatches.map((p) => p.id);
        if (postIds.length > 0) {
          const { data: matchScores } = await supabase
            .from('match_scores')
            .select('*')
            .eq('student_id', user.id)
            .in('post_id', postIds);

          if (matchScores) {
            const scoreMap = new Map(matchScores.map((ms) => [ms.post_id, { score: ms.overall_score, reason: ms.explanation }]));
            postsWithMatches = postsWithMatches.map((post) => {
              const matchData = scoreMap.get(post.id);
              return {
                ...post,
                match_score: matchData?.score,
                match_explanation: matchData?.reason || undefined,
              };
            });

            // Sort by match score if available
            if (showMatchScores) {
              postsWithMatches.sort((a, b) => {
                const aScore = a.match_score ?? -1;
                const bScore = b.match_score ?? -1;
                return bScore - aScore;
              });
            }
          }
        }
      }

      setPosts(postsWithMatches);
    } catch (error: any) {
      toast.error('Failed to load opportunities');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateMatch = async (e: React.MouseEvent, post: PostWithMatch) => {
    e.stopPropagation();
    if (!profile) return;
    
    const result = await calculateMatchScore(post.id, profile, post);
    if (result) {
      // Update local state
      setPosts(posts.map(p => p.id === post.id ? { 
        ...p, 
        match_score: result.overall_score,
        match_explanation: result.reason
      } : p));
      toast.success('Match score calculated!');
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      post.methods?.some((method) => method.toLowerCase().includes(searchQuery.toLowerCase())) ||
      post.tools?.some((tool) => tool.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSearch;
  });

  const handleApply = async () => {
    if (!user || !selectedPost) {
      toast.error('Please sign in to apply');
      return;
    }

    try {
      const { error } = await supabase.from('applications').insert({
        post_id: selectedPost.id,
        applicant_id: user.id,
        message: applicationMessage || null,
        cv_url: cvUrl || null,
        status: 'pending',
      });

      if (error) throw error;

      toast.success('Application submitted successfully!');
      setApplyDialogOpen(false);
      setApplicationMessage('');
      setCvUrl('');
      setSelectedPost(null);
    } catch (error: any) {
      toast.error('Failed to submit application');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Research Opportunities</h1>
            <p className="text-muted-foreground mt-1">
              Discover RA positions, collaborations, and research projects
            </p>
          </div>
          {user && (
            <Button onClick={() => navigate('/board/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Post Opportunity
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by title, tags, methods, tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <div className="w-[180px]">
                <Input
                  placeholder="Institution..."
                  value={institutionFilter}
                  onChange={(e) => setInstitutionFilter(e.target.value)}
                />
              </div>
              <div className="w-[180px]">
                <Input
                  placeholder="Location..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="ra">Research Assistant</SelectItem>
                  <SelectItem value="collab">Collaboration</SelectItem>
                  <SelectItem value="job">Job</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 px-3 border rounded-md">
                <Checkbox
                  id="remote"
                  checked={remoteFilter === true}
                  onCheckedChange={(checked) =>
                    setRemoteFilter(checked === true ? true : remoteFilter === true ? null : false)
                  }
                />
                <Label htmlFor="remote" className="text-sm cursor-pointer">
                  Remote
                </Label>
              </div>

              <div className="flex items-center gap-2 px-3 border rounded-md">
                <Checkbox
                  id="paid"
                  checked={paidFilter === true}
                  onCheckedChange={(checked) =>
                    setPaidFilter(checked === true ? true : paidFilter === true ? null : false)
                  }
                />
                <Label htmlFor="paid" className="text-sm cursor-pointer">
                  Paid
                </Label>
              </div>

              {user && profile && (
                <div className="flex items-center gap-2 px-3 border rounded-md">
                  <Checkbox
                    id="match-scores"
                    checked={showMatchScores}
                    onCheckedChange={(checked) => setShowMatchScores(checked === true)}
                  />
                  <Label htmlFor="match-scores" className="text-sm cursor-pointer flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    AI Match
                  </Label>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <Card className="p-12 text-center">
          <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No opportunities found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Try adjusting your search filters' : 'Be the first to post an opportunity!'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <Card
              key={post.id}
              className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedPost(post)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      {showMatchScores && (
                        <div className="flex flex-col items-end gap-1">
                          {post.match_score !== undefined ? (
                            <Badge variant="default" className="gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {Math.round(post.match_score)}% match
                            </Badge>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 text-xs gap-1"
                              onClick={(e) => handleCalculateMatch(e, post)}
                              disabled={isCalculating}
                            >
                              <TrendingUp className="w-3 h-3" />
                              Calculate Match
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    <Badge variant="secondary">{post.type}</Badge>
                  </div>
                </div>
                {post.owner && (
                  <Link 
                    to={`/profile/${post.owner_id}`}
                    className="flex items-center gap-2 mt-3 group"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <User className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">
                      {post.owner.full_name || 'Anonymous Researcher'}
                    </span>
                  </Link>
                )}
                {post.institution && (
                  <CardDescription className="flex items-center gap-1 mt-2">
                    <MapPin className="w-3 h-3" />
                    {post.institution}
                    {post.location && ` • ${post.location}`}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                {showMatchScores && post.match_explanation && (
                  <div className="mb-4 p-2 bg-primary/5 rounded-md border border-primary/10 text-xs italic">
                    <p className="text-primary font-semibold mb-1">AI Insights:</p>
                    {post.match_explanation}
                  </div>
                )}
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {post.description || 'No description provided.'}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags?.slice(0, 3).map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {post.commitment_hours_per_week && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.commitment_hours_per_week}h/week
                    </div>
                  )}
                  {post.paid !== null && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {post.paid ? 'Paid' : 'Unpaid'}
                    </div>
                  )}
                  {post.remote_allowed && (
                    <Badge variant="outline" className="text-xs">
                      Remote OK
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!user) {
                      navigate('/auth');
                    } else {
                      setSelectedPost(post);
                      setApplyDialogOpen(true);
                    }
                  }}
                >
                  Apply Now
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Apply Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to {selectedPost?.title}</DialogTitle>
            <DialogDescription>
              Submit your application with a message and optional CV/resume link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="message">Cover Letter / Message</Label>
              <Textarea
                id="message"
                placeholder="Why are you interested in this opportunity?"
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                rows={6}
              />
            </div>
            <div>
              <Label htmlFor="cv">CV/Resume URL (optional)</Label>
              <Input
                id="cv"
                type="url"
                placeholder="https://..."
                value={cvUrl}
                onChange={(e) => setCvUrl(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleApply}>Submit Application</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollaborationBoard;

