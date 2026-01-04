import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
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
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, Sparkles, Copy, Save, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ColdEmail {
  id: string;
  subject: string;
  body: string;
  recipient_name: string | null;
  recipient_email: string | null;
  tone: string;
  created_at: string;
}

const ColdEmailGenerator = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recipientType, setRecipientType] = useState<'professor' | 'lab' | 'student'>('professor');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [opportunityContext, setOpportunityContext] = useState('');
  const [tone, setTone] = useState<'formal' | 'friendly' | 'curious'>('formal');
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedEmails, setSavedEmails] = useState<ColdEmail[]>([]);

  useEffect(() => {
    if (user) {
      loadSavedEmails();
    }
  }, [user]);

  const loadSavedEmails = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('cold_emails')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSavedEmails(data || []);
    } catch (error: any) {
      console.error('Failed to load saved emails:', error);
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      toast.error('Please sign in to generate emails');
      navigate('/auth');
      return;
    }

    if (!recipientName.trim()) {
      toast.error('Please enter recipient name');
      return;
    }

    setLoading(true);
    try {
      // Get user profile for context
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Call AI function
      const { data, error } = await supabase.functions.invoke('ai-lab-assistant', {
        body: {
          type: 'cold_email',
          recipient_type: recipientType,
          recipient_name: recipientName,
          recipient_email: recipientEmail,
          opportunity_context: opportunityContext,
          tone,
          user_profile: profile,
        },
      });

      if (error) throw error;

      const email = {
        subject: data.subject || 'Research Opportunity Inquiry',
        body: data.body || 'Email generation failed. Please try again.',
      };

      setGeneratedEmail(email);

      // Auto-save
      await supabase.from('cold_emails').insert({
        user_id: user.id,
        recipient_id: recipientId,
        recipient_type: recipientType,
        recipient_name: recipientName,
        recipient_email: recipientEmail || null,
        subject: email.subject,
        body: email.body,
        tone,
        context: { opportunity_context: opportunityContext },
      });

      await loadSavedEmails();
      toast.success('Email generated and saved!');
    } catch (error: any) {
      console.error('Email generation error:', error);
      // Fallback mock email
      setGeneratedEmail({
        subject: `Research Opportunity Inquiry - ${recipientName}`,
        body: `Dear ${recipientName},\n\nI hope this message finds you well. I am writing to express my interest in...`,
      });
      toast.info('Using demo email (API not configured)');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleSave = async () => {
    if (!generatedEmail || !user) return;

    try {
      const { error } = await supabase.from('cold_emails').insert({
        user_id: user.id,
        recipient_id: recipientId,
        recipient_type: recipientType,
        recipient_name: recipientName,
        recipient_email: recipientEmail || null,
        subject: generatedEmail.subject,
        body: generatedEmail.body,
        tone,
        context: { opportunity_context: opportunityContext },
      });

      if (error) throw error;
      toast.success('Email saved!');
      await loadSavedEmails();
    } catch (error: any) {
      toast.error('Failed to save email');
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>Please sign in to use the Cold Email Generator</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">Cold Email Generator</h1>
        <p className="text-muted-foreground">
          Generate personalized academic outreach emails with AI assistance
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Details
              </CardTitle>
              <CardDescription>Enter recipient information and context</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Recipient Type</Label>
                  <Select value={recipientType} onValueChange={(v: any) => setRecipientType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professor">Professor</SelectItem>
                      <SelectItem value="lab">Lab</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={(v: any) => setTone(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formal Academic</SelectItem>
                      <SelectItem value="friendly">Friendly Interest</SelectItem>
                      <SelectItem value="curious">Curious Beginner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Recipient Name *</Label>
                <Input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Dr. Jane Smith"
                />
              </div>

              <div>
                <Label>Recipient Email (optional)</Label>
                <Input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="jane.smith@university.edu"
                />
              </div>

              <div>
                <Label>Opportunity/Context</Label>
                <Textarea
                  value={opportunityContext}
                  onChange={(e) => setOpportunityContext(e.target.value)}
                  placeholder="e.g., Research assistant position in your lab, collaboration opportunity, etc."
                  rows={4}
                />
              </div>

              <Button onClick={handleGenerate} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Email
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {generatedEmail && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Generated Email</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleSave}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Subject</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(generatedEmail.subject)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="p-3 border rounded-lg bg-muted/50">
                    <p className="text-sm font-medium">{generatedEmail.subject}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Body</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(generatedEmail.body)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <p className="text-sm whitespace-pre-wrap">{generatedEmail.body}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Saved Emails</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {savedEmails.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No saved emails yet
                  </p>
                ) : (
                  savedEmails.map((email) => (
                    <div
                      key={email.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => {
                        setGeneratedEmail({ subject: email.subject, body: email.body });
                        setRecipientName(email.recipient_name || '');
                        setRecipientEmail(email.recipient_email || '');
                        setTone(email.tone as any);
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{email.subject}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            To: {email.recipient_name || 'Unknown'}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {email.tone}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {email.recipient_type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Provide specific context about the opportunity</p>
              <p>• Include relevant details from your profile</p>
              <p>• Review and personalize before sending</p>
              <p>• Keep emails concise and focused</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ColdEmailGenerator;

