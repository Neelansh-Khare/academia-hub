import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Search, FileText, Bot, LogOut, User } from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error: any) {
      toast.error('Failed to sign out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            <span className="font-display text-xl">AcademiaLink</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="subtle" size="sm" onClick={() => navigate('/profile')}>
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button variant="subtle" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="font-display text-4xl text-foreground">
              Welcome back
            </h1>
            <p className="text-muted-foreground text-lg">
              Discover research opportunities and collaborations
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border/50 hover:shadow-elevated transition-shadow cursor-pointer group" onClick={() => navigate('/search')}>
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                  <Search className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="font-display">Search opportunities</CardTitle>
                <CardDescription>
                  Find RAships, collaborations, and research positions
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:shadow-elevated transition-shadow cursor-pointer group" onClick={() => navigate('/posts')}>
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="font-display">My posts</CardTitle>
                <CardDescription>
                  Manage your job postings and applications
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:shadow-elevated transition-shadow cursor-pointer group" onClick={() => navigate('/assistant')}>
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-2 group-hover:bg-accent/20 transition-colors">
                  <Bot className="w-5 h-5 text-accent" />
                </div>
                <CardTitle className="font-display">AI Lab Assistant</CardTitle>
                <CardDescription>
                  Get help with matching, outreach, and grant discovery
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:shadow-elevated transition-shadow cursor-pointer group" onClick={() => navigate('/profile')}>
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="font-display">Profile settings</CardTitle>
                <CardDescription>
                  Update your research profile and preferences
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
