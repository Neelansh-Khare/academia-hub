import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { GraduationCap, Sparkles } from 'lucide-react';

const Auth = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!fullName.trim()) {
          toast.error('Please enter your full name');
          return;
        }
        await signUp(email, password, fullName);
      } else {
        await signIn(email, password);
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="absolute inset-0 hero-gradient opacity-30 pointer-events-none" />
      
      <Card className="w-full max-w-md relative z-10 shadow-elevated border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="font-display text-2xl">
            {mode === 'signin' ? 'Welcome back' : 'Join AcademiaLink'}
          </CardTitle>
          <CardDescription>
            {mode === 'signin'
              ? 'Sign in to continue your research journey'
              : 'Create an account to connect with researchers'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Dr. Jane Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={mode === 'signup'}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            
            <Button
              type="submit"
              variant="hero"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                mode === 'signin' ? 'Sign in' : 'Create account'
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setEmail('');
                setPassword('');
                setFullName('');
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {mode === 'signin' ? (
                <>
                  Don't have an account? <span className="text-primary font-medium">Sign up</span>
                </>
              ) : (
                <>
                  Already have an account? <span className="text-primary font-medium">Sign in</span>
                </>
              )}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
