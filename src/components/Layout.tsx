import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GraduationCap, LogOut, User, Search, FileText, Bot, Sparkles, BookOpen, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error: any) {
      toast.error('Failed to sign out');
    }
  };

  const navItems = user
    ? [
        { href: '/dashboard', label: 'Dashboard', icon: GraduationCap },
        { href: '/board', label: 'Opportunities', icon: Search },
        { href: '/assistant', label: 'Research Assistant', icon: Bot },
        { href: '/papers', label: 'Paper Chat', icon: BookOpen },
        { href: '/emails', label: 'Cold Emails', icon: Mail },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="border-b border-border/40 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-hero-gradient text-primary-foreground shadow-ring group-hover:shadow-lg transition-shadow">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="flex flex-col">
                <span className="font-display text-lg font-semibold tracking-tight">AcademicHub</span>
                <span className="text-xs text-muted-foreground">Research Collaboration Platform</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Button
                    key={item.href}
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => navigate(item.href)}
                    className="gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.user_metadata?.avatar_url} />
                          <AvatarFallback>
                            {user.email?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden sm:inline-block text-sm">{user.email}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => navigate('/profile')}>
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                    Sign in
                  </Button>
                  <Button variant="default" size="sm" onClick={() => navigate('/auth')}>
                    Sign up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
};

