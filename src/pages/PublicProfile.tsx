import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { usePublicProfile } from '@/hooks/useProfile';
import { usePublications } from '@/hooks/usePublications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExternalLink, FileText, Loader2, Mail, MapPin, Building, GraduationCap, ChevronLeft, TrendingUp, BarChart3, Quote } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/hooks/useAuth';

const PublicProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = usePublicProfile(id);
  const { publications, isLoading: publicationsLoading } = usePublications(id);
  const [linkedProfiles, setLinkedProfiles] = useState<
    Array<{ platform: string; url: string; username?: string }>
  >([]);
  const [matchScore, setMatchScore] = useState<{ score: number; explanation: string } | null>(null);

  // Parse state from location (if coming from collaboration board)
  const sourcePostId = (location.state as any)?.postId;

  useEffect(() => {
    const loadLinkedProfiles = async () => {
      if (!id) return;
      try {
        const { data } = await supabase
          .from('linked_profiles')
          .select('*')
          .eq('user_id', id);
        if (data) {
          setLinkedProfiles(data.map((lp) => ({ platform: lp.platform, url: lp.url, username: lp.username || '' })));
        }
      } catch (error) {
        console.error('Failed to load linked profiles:', error);
      }
    };

    const loadMatchScore = async () => {
      if (!id || !user || !sourcePostId) return;
      try {
        const { data, error } = await supabase
          .from('match_scores')
          .select('overall_score, explanation')
          .eq('student_id', user.id)
          .eq('post_id', sourcePostId)
          .maybeSingle();
        
        if (data) {
          setMatchScore({ score: data.overall_score, explanation: data.explanation || '' });
        }
      } catch (error) {
        console.error('Failed to load match score:', error);
      }
    };

    loadLinkedProfiles();
    loadMatchScore();
  }, [id, user, sourcePostId]);

  const stats = useMemo(() => {
    if (!publications.length) return { totalCitations: 0, hIndex: 0, i10Index: 0, chartData: [] };

    const totalCitations = publications.reduce((acc, pub) => acc + (pub.citation_count || 0), 0);
    
    // H-index
    const sortedCitations = [...publications]
      .map(p => p.citation_count || 0)
      .sort((a, b) => b - a);
    
    let hIndex = 0;
    while (hIndex < sortedCitations.length && sortedCitations[hIndex] >= hIndex + 1) {
      hIndex++;
    }

    // i10-index
    const i10Index = publications.filter(p => (p.citation_count || 0) >= 10).length;

    // Chart data (pubs by year)
    const yearCounts: Record<number, number> = {};
    publications.forEach(pub => {
      if (pub.year) {
        yearCounts[pub.year] = (yearCounts[pub.year] || 0) + 1;
      }
    });

    const years = Object.keys(yearCounts).map(Number).sort((a, b) => a - b);
    const chartData = years.map(year => ({
      year: year.toString(),
      count: yearCounts[year]
    }));

    return { totalCitations, hIndex, i10Index, chartData };
  }, [publications]);

  if (profileLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold">Profile not found</h2>
        <Button variant="link" onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-6 gap-1" 
        onClick={() => navigate(-1)}
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <Avatar className="h-32 w-32 mx-auto mb-4">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="text-4xl">
                  {profile.full_name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-2xl font-bold">{profile.full_name}</h1>
              <p className="text-muted-foreground text-sm mt-1">{profile.headline || 'Researcher'}</p>
              
              <div className="mt-6 space-y-3 text-sm text-left">
                {profile.institution && (
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span>{profile.institution}</span>
                  </div>
                )}
                {profile.department && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    <span>{profile.department}</span>
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{profile.location}</span>
                  </div>
                )}
                <Badge variant="secondary" className="mt-2 capitalize">
                  {profile.account_type || 'User'}
                </Badge>
              </div>

              {matchScore && (
                <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Match Score
                    </span>
                    <Badge variant="default">{matchScore.score}%</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground italic leading-relaxed">
                    "{matchScore.explanation}"
                  </p>
                </div>
              )}

              <div className="mt-8">
                <Button className="w-full gap-2">
                  <Mail className="w-4 h-4" />
                  Contact
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Metrics Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stats.totalCitations}</p>
                <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                  <Quote className="w-2 h-2" /> Citations
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stats.hIndex}</p>
                <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                  <BarChart3 className="w-2 h-2" /> H-Index
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stats.i10Index}</p>
                <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                  <FileText className="w-2 h-2" /> i10-Index
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{publications.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                  <FileText className="w-2 h-2" /> Papers
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {linkedProfiles.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No linked profiles</p>
              ) : (
                linkedProfiles.map((lp, index) => (
                  <a
                    key={index}
                    href={lp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <span className="text-sm font-medium capitalize">{lp.platform.replace('_', ' ')}</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </a>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="publications">Publications ({publications.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="space-y-8 mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Biography</h3>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {profile.bio || 'No biography provided.'}
                </p>
              </div>

              {/* Research Activity Chart */}
              {stats.chartData.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Research Activity</h3>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                        <XAxis 
                          dataKey="year" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px' 
                          }}
                          itemStyle={{ color: 'hsl(var(--primary))' }}
                        />
                        <Bar 
                          dataKey="count" 
                          fill="hsl(var(--primary))" 
                          radius={[4, 4, 0, 0]} 
                          name="Publications"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="grid gap-6">
                {profile.research_fields && profile.research_fields.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Research Fields</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.research_fields.map((field, i) => (
                        <Badge key={i} variant="outline">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {profile.methods && profile.methods.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Methods</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.methods.map((method, i) => (
                        <Badge key={i} variant="outline">
                          {method}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {profile.tools && profile.tools.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Tools</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.tools.map((tool, i) => (
                        <Badge key={i} variant="outline">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="publications" className="mt-6">
              {publicationsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : publications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No publications found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {publications.map((pub) => (
                    <div key={pub.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <h4 className="font-semibold text-base">{pub.title}</h4>
                          {pub.authors && pub.authors.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                              {pub.authors.slice(0, 5).join(', ')}
                              {pub.authors.length > 5 && ` et al.`}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {pub.venue && <span>{pub.venue}</span>}
                            {pub.year && (
                              <>
                                {pub.venue && <span>•</span>}
                                <span>{pub.year}</span>
                              </>
                            )}
                            {pub.citation_count > 0 && (
                              <>
                                {(pub.venue || pub.year) && <span>•</span>}
                                <span>{pub.citation_count} citations</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-3 pt-2">
                            {pub.url && (
                              <a
                                href={pub.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View Paper
                              </a>
                            )}
                            {pub.doi && (
                              <a
                                href={`https://doi.org/${pub.doi}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                              >
                                DOI: {pub.doi}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
