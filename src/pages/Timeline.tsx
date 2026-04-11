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
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Plus, Clock, CheckCircle2, Circle, ChevronRight, Trash2, Sparkles, Loader2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import type { Database } from '@/integrations/supabase/types';
import { downloadAsMarkdown } from '@/lib/utils';

type Timeline = Database['public']['Tables']['research_timelines']['Row'];
type Milestone = Database['public']['Tables']['research_milestones']['Row'];

interface TimelineWithMilestones extends Timeline {
  milestones: Milestone[];
}

const TimelinePage = () => {
  const { user } = useAuth();
  const [timelines, setTimelines] = useState<TimelineWithMilestones[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingTimeline, setIsAddingTimeline] = useState(false);
  const [newTimeline, setNewTimeline] = useState({ title: '', description: '' });
  const [selectedTimelineId, setSelectedTimelineId] = useState<string | null>(null);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '', due_date: '' });
  const [isSuggesting, setIsSuggesting] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchTimelines();
    }
  }, [user]);

  const fetchTimelines = async () => {
    try {
      setLoading(true);
      const { data: timelineData, error: timelineError } = await supabase
        .from('research_timelines')
        .select('*')
        .order('created_at', { ascending: false });

      if (timelineError) throw timelineError;

      const timelinesWithMilestones = await Promise.all(
        (timelineData || []).map(async (timeline) => {
          const { data: milestoneData, error: milestoneError } = await supabase
            .from('research_milestones')
            .select('*')
            .eq('timeline_id', timeline.id)
            .order('due_date', { ascending: true });

          if (milestoneError) throw milestoneError;
          return { ...timeline, milestones: milestoneData || [] };
        })
      );

      setTimelines(timelinesWithMilestones);
    } catch (error) {
      console.error('Error fetching timelines:', error);
      toast.error('Failed to load timelines');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTimeline = async () => {
    if (!user || !newTimeline.title) return;
    try {
      const { error } = await supabase.from('research_timelines').insert({
        user_id: user.id,
        title: newTimeline.title,
        description: newTimeline.description,
      });

      if (error) throw error;
      toast.success('Timeline created');
      setIsAddingTimeline(false);
      setNewTimeline({ title: '', description: '' });
      fetchTimelines();
    } catch (error) {
      toast.error('Failed to create timeline');
    }
  };

  const handleAddMilestone = async () => {
    if (!selectedTimelineId || !newMilestone.title) return;
    try {
      const { error } = await supabase.from('research_milestones').insert({
        timeline_id: selectedTimelineId,
        title: newMilestone.title,
        description: newMilestone.description,
        due_date: newMilestone.due_date || null,
      });

      if (error) throw error;
      toast.success('Milestone added');
      setIsAddingMilestone(false);
      setNewMilestone({ title: '', description: '', due_date: '' });
      fetchTimelines();
    } catch (error) {
      toast.error('Failed to add milestone');
    }
  };

  const handleSuggestMilestones = async (timeline: Timeline) => {
    try {
      setIsSuggesting(timeline.id);
      const { data, error } = await supabase.functions.invoke('ai-lab-assistant', {
        body: {
          type: 'generate_timeline',
          title: timeline.title,
          description: timeline.description,
        },
      });

      if (error) throw error;

      const { milestones } = data;
      if (milestones && Array.isArray(milestones)) {
        const milestonesToInsert = milestones.map((m: any) => ({
          timeline_id: timeline.id,
          title: m.title,
          description: m.description,
          status: 'pending'
        }));

        const { error: insertError } = await supabase
          .from('research_milestones')
          .insert(milestonesToInsert);

        if (insertError) throw insertError;
        toast.success(`Generated ${milestones.length} suggested milestones`);
        fetchTimelines();
      }
    } catch (error) {
      console.error('Error suggesting milestones:', error);
      toast.error('Failed to generate suggestions');
    } finally {
      setIsSuggesting(null);
    }
  };

  const handleExportMarkdown = (timeline: TimelineWithMilestones) => {
    let md = `# ${timeline.title}\n\n`;
    if (timeline.description) {
      md += `${timeline.description}\n\n`;
    }
    md += `## Milestones\n\n`;
    
    if (timeline.milestones.length === 0) {
      md += `*No milestones added yet.*\n`;
    } else {
      timeline.milestones.forEach(m => {
        const status = m.status === 'completed' ? '[x]' : '[ ]';
        const date = m.due_date ? ` (Due: ${format(new Date(m.due_date), 'MMM d, yyyy')})` : '';
        md += `- ${status} **${m.title}**${date}\n`;
        if (m.description) {
          md += `  ${m.description}\n`;
        }
      });
    }

    const filename = `${timeline.title.toLowerCase().replace(/\s+/g, '-')}-timeline.md`;
    downloadAsMarkdown(md, filename);
    toast.success('Timeline exported as Markdown');
  };

  const toggleMilestoneStatus = async (milestone: Milestone) => {
    const newStatus = milestone.status === 'completed' ? 'pending' : 'completed';
    try {
      const { error } = await supabase
        .from('research_milestones')
        .update({ status: newStatus })
        .eq('id', milestone.id);

      if (error) throw error;
      fetchTimelines();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const deleteTimeline = async (id: string) => {
    try {
      const { error } = await supabase.from('research_timelines').delete().eq('id', id);
      if (error) throw error;
      toast.success('Timeline deleted');
      fetchTimelines();
    } catch (error) {
      toast.error('Failed to delete timeline');
    }
  };

  const deleteMilestone = async (id: string) => {
    try {
      const { error } = await supabase.from('research_milestones').delete().eq('id', id);
      if (error) throw error;
      fetchTimelines();
    } catch (error) {
      toast.error('Failed to delete milestone');
    }
  };

  if (loading) {
    return <div className="container mx-auto p-8">Loading timelines...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Research Timelines</h1>
          <p className="text-muted-foreground mt-1">Plan and track your research projects and milestones</p>
        </div>
        <Dialog open={isAddingTimeline} onOpenChange={setIsAddingTimeline}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Timeline
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Research Timeline</DialogTitle>
              <DialogDescription>Set a goal or project to track.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., PhD Literature Review, Summer Internship Project"
                  value={newTimeline.title}
                  onChange={(e) => setNewTimeline({ ...newTimeline, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What is this timeline about?"
                  value={newTimeline.description}
                  onChange={(e) => setNewTimeline({ ...newTimeline, description: e.target.value })}
                />
              </div>
              <Button className="w-full" onClick={handleAddTimeline}>Create Timeline</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-8">
        {timelines.length === 0 ? (
          <Card className="p-12 text-center">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No timelines yet</h3>
            <p className="text-muted-foreground mb-6">Start planning your research journey today.</p>
            <Button onClick={() => setIsAddingTimeline(true)}>Create Your First Timeline</Button>
          </Card>
        ) : (
          timelines.map((timeline) => (
            <Card key={timeline.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{timeline.title}</CardTitle>
                    <CardDescription className="mt-1">{timeline.description}</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportMarkdown(timeline)}
                      title="Export to Markdown"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestMilestones(timeline)}
                      disabled={isSuggesting === timeline.id}
                      className="text-primary border-primary/20 hover:bg-primary/5"
                    >
                      {isSuggesting === timeline.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      AI Suggest
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTimelineId(timeline.id);
                        setIsAddingMilestone(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Milestone
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteTimeline(timeline.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {timeline.milestones.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground italic mb-4">
                      No milestones added yet.
                    </p>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => handleSuggestMilestones(timeline)}
                      disabled={isSuggesting === timeline.id}
                    >
                      {isSuggesting === timeline.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      Let AI suggest some milestones
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border ml-[2px]" />
                    
                    <div className="space-y-6">
                      {timeline.milestones.map((milestone) => (
                        <div key={milestone.id} className="relative pl-10 group">
                          <div 
                            className={`absolute left-0 p-1 rounded-full border bg-background z-10 cursor-pointer transition-colors ${
                              milestone.status === 'completed' 
                                ? 'border-primary text-primary' 
                                : 'border-muted-foreground/30 text-muted-foreground/30'
                            }`}
                            onClick={() => toggleMilestoneStatus(milestone)}
                          >
                            {milestone.status === 'completed' ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </div>
                          
                          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <div className="flex-1">
                              <h4 className={`font-semibold ${milestone.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                {milestone.title}
                              </h4>
                              {milestone.description && (
                                <p className="text-sm text-muted-foreground mt-0.5">{milestone.description}</p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {milestone.due_date && (
                                <Badge variant="outline" className="gap-1 font-normal">
                                  <CalendarIcon className="w-3 h-3" />
                                  {format(new Date(milestone.due_date), 'MMM d, yyyy')}
                                </Badge>
                              )}
                              <Badge variant={milestone.status === 'completed' ? 'secondary' : 'default'} className="capitalize">
                                {milestone.status?.replace('_', ' ')}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 text-destructive h-8 w-8 p-0"
                                onClick={() => deleteMilestone(milestone.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Milestone Dialog */}
      <Dialog open={isAddingMilestone} onOpenChange={setIsAddingMilestone}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Milestone</DialogTitle>
            <DialogDescription>Break down your project into smaller tasks.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="m-title">Milestone Title</Label>
              <Input
                id="m-title"
                placeholder="e.g., Complete background research"
                value={newMilestone.title}
                onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-date">Due Date</Label>
              <Input
                id="m-date"
                type="date"
                value={newMilestone.due_date}
                onChange={(e) => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-desc">Description (optional)</Label>
              <Textarea
                id="m-desc"
                placeholder="Details about this milestone..."
                value={newMilestone.description}
                onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
              />
            </div>
            <Button className="w-full" onClick={handleAddMilestone}>Add Milestone</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimelinePage;
