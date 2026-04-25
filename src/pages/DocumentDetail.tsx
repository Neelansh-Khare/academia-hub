import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ChevronLeft, 
  Save, 
  Users, 
  Settings, 
  Share2, 
  Download, 
  Globe, 
  Lock,
  Loader2,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import Editor from '@/components/Editor';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { debounce } from 'lodash-es';
import { downloadAsMarkdown } from '@/lib/utils';

const DocumentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<any>(null);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchDocument();
      fetchCollaborators();
      subscribeToChanges();
    }
  }, [id, user]);

  const handleExportMarkdown = () => {
    if (!document || !content) return;
    
    let md = `# ${document.title}\n\n`;
    
    // Very naive JSON to Markdown conversion for demonstration
    if (content.content) {
      content.content.forEach((block: any) => {
        if (block.type === 'paragraph') {
          md += block.content?.map((c: any) => c.text).join('') + '\n\n';
        } else if (block.type === 'heading') {
          md += '#'.repeat(block.attrs.level) + ' ' + block.content?.map((c: any) => c.text).join('') + '\n\n';
        }
      });
    }

    const filename = `${document.title.toLowerCase().replace(/\s+/g, '-')}.md`;
    downloadAsMarkdown(md, filename);
    toast.success('Document exported as Markdown');
  };

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('collaborative_documents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setDocument(data);
      setContent(data.content);
      setIsPublic(data.is_public);
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error('Failed to load document');
      navigate('/documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchCollaborators = async () => {
    try {
      const { data, error } = await supabase
        .from('document_collaborators')
        .select(`
          *,
          user:profiles(full_name, avatar_url)
        `)
        .eq('document_id', id);

      if (error) throw error;
      setCollaborators(data || []);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
    }
  };

  const subscribeToChanges = () => {
    const channel = supabase
      .channel(`document-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'collaborative_documents',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          // Only update if someone else edited
          if (payload.new.last_edited_by !== user?.id) {
            setDocument(payload.new);
            // We don't want to force update the editor content while typing
            // This is a simplified sync - a real one would use Y.js
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const saveDocument = async (newContent: any) => {
    if (!id || !user) return;
    
    try {
      setSaving(true);
      const { error } = await supabase
        .from('collaborative_documents')
        .update({
          content: newContent,
          last_edited_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Debounce saving
  const debouncedSave = useCallback(
    debounce((newContent: any) => saveDocument(newContent), 2000),
    [id, user]
  );

  const handleContentChange = (newContent: any) => {
    setContent(newContent);
    debouncedSave(newContent);
  };

  const handleTogglePrivacy = async () => {
    try {
      const newPrivacy = !isPublic;
      const { error } = await supabase
        .from('collaborative_documents')
        .update({ is_public: newPrivacy })
        .eq('id', id);

      if (error) throw error;
      setIsPublic(newPrivacy);
      toast.success(newPrivacy ? 'Document is now public' : 'Document is now private');
    } catch (error) {
      toast.error('Failed to update privacy');
    }
  };

  const handleAddCollaborator = async () => {
    if (!newCollaboratorEmail.trim()) return;
    
    try {
      // 1. Find user by email (this would normally be done via an edge function or by searching profiles if emails are public)
      // Since emails are in auth.users, and we can't search them directly from client easily, 
      // we'll assume researchers search by name or we have a specialized search.
      // For this demo, we'll try to find a profile with a matching "institution" or name as a fallback
      
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .ilike('full_name', `%${newCollaboratorEmail}%`)
        .limit(1);

      if (profileError || !profiles || profiles.length === 0) {
        toast.error('User not found');
        return;
      }

      const targetUserId = profiles[0].id;

      const { error } = await supabase
        .from('document_collaborators')
        .insert({
          document_id: id,
          user_id: targetUserId,
          permission_level: 'editor'
        });

      if (error) throw error;
      
      toast.success(`Added ${profiles[0].full_name} as collaborator`);
      setNewCollaboratorEmail('');
      fetchCollaborators();
    } catch (error) {
      console.error('Error adding collaborator:', error);
      toast.error('Failed to add collaborator');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your document...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Toolbar Header */}
      <header className="border-b px-4 py-2 flex items-center justify-between bg-card sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/documents')} className="p-0 h-8 w-8">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-sm md:text-base line-clamp-1">{document.title}</h1>
              <Badge variant="outline" className="text-[10px] px-1.5 h-5 gap-1 font-normal">
                {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                {isPublic ? 'Public' : 'Private'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              {saving ? (
                <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving...</span>
              ) : (
                <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Saved to cloud</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex -space-x-2 mr-4">
            {collaborators.slice(0, 3).map((collab) => (
              <Avatar key={collab.id} className="w-7 h-7 border-2 border-background">
                <AvatarImage src={collab.user?.avatar_url || ''} />
                <AvatarFallback className="text-[10px]">{collab.user?.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            ))}
            {collaborators.length > 3 && (
              <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold">
                +{collaborators.length - 3}
              </div>
            )}
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Collaborate</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Collaboration</SheetTitle>
                <SheetDescription>
                  Manage who can access and edit this document.
                </SheetDescription>
              </SheetHeader>
              <div className="py-6 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Privacy Settings</h3>
                  <Button variant="outline" className="w-full justify-between" onClick={handleTogglePrivacy}>
                    <div className="flex items-center gap-2">
                      {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      <span>{isPublic ? 'Public on Profile' : 'Private to you'}</span>
                    </div>
                    <Badge variant={isPublic ? 'default' : 'secondary'}>{isPublic ? 'On' : 'Off'}</Badge>
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Add Collaborators</h3>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Search by name..." 
                      value={newCollaboratorEmail}
                      onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                    />
                    <Button size="sm" onClick={handleAddCollaborator}>Add</Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Active Collaborators</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>Y</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">You</p>
                          <p className="text-[10px] text-muted-foreground">Owner</p>
                        </div>
                      </div>
                    </div>
                    {collaborators.map((collab) => (
                      <div key={collab.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={collab.user?.avatar_url || ''} />
                            <AvatarFallback>{collab.user?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{collab.user?.full_name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{collab.permission_level}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Button variant="primary" size="sm" className="gap-2" onClick={handleExportMarkdown}>
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </header>

      {/* Editor Area */}
      <main className="flex-1 overflow-auto p-4 md:p-8 bg-muted/10">
        <div className="max-w-4xl mx-auto bg-background shadow-sm rounded-lg min-h-full">
          <Editor 
            content={content} 
            onChange={handleContentChange} 
            editable={document.owner_id === user?.id || collaborators.some(c => c.user_id === user?.id && c.permission_level !== 'viewer')}
          />
        </div>
      </main>
    </div>
  );
};

export default DocumentDetail;
