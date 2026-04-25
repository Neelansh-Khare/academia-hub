import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileText, Plus, Search, Clock, Users, Trash2, ChevronRight, Globe, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const Documents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('collaborative_documents')
        .select(`
          *,
          collaborators:document_collaborators(count)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async () => {
    if (!user || !newDocTitle.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('collaborative_documents')
        .insert({
          owner_id: user.id,
          title: newDocTitle.trim(),
          content: { type: 'doc', content: [] }
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Document created');
      setIsAddingDoc(false);
      setNewDocTitle('');
      navigate(`/documents/${data.id}`);
    } catch (error) {
      console.error('Error creating document:', error);
      toast.error('Failed to create document');
    }
  };

  const handleDeleteDocument = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const { error } = await supabase
        .from('collaborative_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Document deleted');
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Collaborative Documents</h1>
          <p className="text-muted-foreground mt-1">Write and collaborate on research papers and notes</p>
        </div>
        <Dialog open={isAddingDoc} onOpenChange={setIsAddingDoc}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Document</DialogTitle>
              <DialogDescription>Give your document a title to get started.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Input
                  placeholder="e.g., Literature Review - Neural Networks"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateDocument()}
                />
              </div>
              <Button className="w-full" onClick={handleCreateDocument} disabled={!newDocTitle.trim()}>
                Create and Open
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search documents..." 
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-semibold">No documents found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery ? "No documents match your search." : "Create your first collaborative document to get started."}
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsAddingDoc(true)}>Create Document</Button>
          )}
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => (
            <Card 
              key={doc.id} 
              className="group hover:border-primary/50 transition-all cursor-pointer overflow-hidden flex flex-col"
              onClick={() => navigate(`/documents/${doc.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex gap-1">
                    {doc.is_public ? (
                      <Badge variant="outline" className="text-[10px] h-5 gap-1">
                        <Globe className="w-3 h-3" /> Public
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] h-5 gap-1">
                        <Lock className="w-3 h-3" /> Private
                      </Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg line-clamp-1">{doc.title}</CardTitle>
                <CardDescription className="flex items-center gap-1.5 text-xs">
                  <Clock className="w-3 h-3" />
                  Updated {format(new Date(doc.updated_at), 'MMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-3">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{doc.collaborators?.[0]?.count || 0} collaborators</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex justify-between border-t mt-auto py-3 bg-muted/20">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  {doc.owner_id === user?.id ? 'Owner' : 'Collaborator'}
                </span>
                <div className="flex items-center gap-2">
                  {doc.owner_id === user?.id && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDeleteDocument(e, doc.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Documents;
