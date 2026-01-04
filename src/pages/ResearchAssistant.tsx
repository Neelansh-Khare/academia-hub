import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Sparkles, FileText, Lightbulb, List, Database, Code2, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ResearchOutput {
  papers: Array<{
    title: string;
    authors?: string[];
    url?: string;
    abstract?: string;
    year?: number;
  }>;
  project_ideas: Array<{
    title: string;
    description: string;
  }>;
  outline: {
    sections: Array<{
      title: string;
      description: string;
    }>;
  };
  datasets: Array<{
    name: string;
    description: string;
    url?: string;
  }>;
  libraries: Array<{
    name: string;
    description: string;
    url?: string;
  }>;
}

const ResearchAssistant = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<ResearchOutput | null>(null);
  const [topic, setTopic] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a research topic or idea');
      return;
    }

    if (!user) {
      toast.error('Please sign in to use the research assistant');
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      // Call Supabase Edge Function for research assistant
      const { data, error } = await supabase.functions.invoke('ai-lab-assistant', {
        body: { prompt, type: 'research_assistant' },
      });

      if (error) throw error;

      const researchOutput: ResearchOutput = {
        papers: data.papers || [],
        project_ideas: data.project_ideas || [],
        outline: data.outline || { sections: [] },
        datasets: data.datasets || [],
        libraries: data.libraries || [],
      };

      setOutput(researchOutput);
      setTopic(data.topic || prompt);

      // Save to database
      await supabase.from('research_assistant_outputs').insert({
        user_id: user.id,
        prompt,
        topic: data.topic || prompt,
        papers: researchOutput.papers,
        project_ideas: researchOutput.project_ideas,
        outline: researchOutput.outline,
        datasets: researchOutput.datasets,
        libraries: researchOutput.libraries,
      });

      toast.success('Research roadmap generated successfully!');
    } catch (error: any) {
      console.error('Research assistant error:', error);
      // Fallback mock data for development
      const mockOutput: ResearchOutput = {
        papers: [
          {
            title: 'Foundational Paper in the Field',
            authors: ['Author 1', 'Author 2'],
            url: 'https://arxiv.org/abs/example',
            abstract: 'This paper provides a comprehensive overview...',
            year: 2023,
          },
        ],
        project_ideas: [
          {
            title: 'Project Idea 1',
            description: 'A novel approach to solving this problem...',
          },
        ],
        outline: {
          sections: [
            { title: 'Introduction', description: 'Background and motivation' },
            { title: 'Related Work', description: 'Review of existing literature' },
          ],
        },
        datasets: [
          { name: 'Example Dataset', description: 'A dataset for this domain', url: 'https://example.com' },
        ],
        libraries: [
          { name: 'Example Library', description: 'A useful library', url: 'https://github.com' },
        ],
      };
      setOutput(mockOutput);
      setTopic(prompt);
      toast.info('Using demo data (API not configured)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">AI Research Assistant</h1>
        <p className="text-muted-foreground">
          Generate a comprehensive research roadmap with papers, project ideas, outlines, and resources
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Research Prompt
              </CardTitle>
              <CardDescription>
                Enter a research topic, question, or idea to get a comprehensive research roadmap
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prompt">Research Topic or Question</Label>
                <Textarea
                  id="prompt"
                  placeholder="e.g., 'How can we improve few-shot learning in vision transformers?' or 'Federated learning for healthcare data privacy'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  className="mt-2"
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
                    Generate Research Roadmap
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {output && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Relevant Papers
                  </CardTitle>
                  <CardDescription>Top {output.papers.length} most relevant papers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {output.papers.map((paper, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold">{paper.title}</h4>
                        {paper.url && (
                          <a
                            href={paper.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      {paper.authors && (
                        <p className="text-sm text-muted-foreground">
                          {paper.authors.join(', ')} {paper.year && `(${paper.year})`}
                        </p>
                      )}
                      {paper.abstract && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{paper.abstract}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Project Ideas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {output.project_ideas.map((idea, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">{idea.title}</h4>
                      <p className="text-sm text-muted-foreground">{idea.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <List className="w-5 h-5" />
                    Paper Outline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {output.outline.sections.map((section, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="font-semibold text-primary">{index + 1}.</span>
                        <div>
                          <h4 className="font-semibold">{section.title}</h4>
                          <p className="text-sm text-muted-foreground">{section.description}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Database className="w-5 h-5" />
                      Datasets
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {output.datasets.map((dataset, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-sm">{dataset.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{dataset.description}</p>
                          </div>
                          {dataset.url && (
                            <a
                              href={dataset.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Code2 className="w-5 h-5" />
                      Libraries & Tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {output.libraries.map((lib, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-sm">{lib.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{lib.description}</p>
                          </div>
                          {lib.url && (
                            <a
                              href={lib.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How it works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Enter a research topic or question, and our AI will generate:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Relevant papers from arXiv and Semantic Scholar</li>
                <li>Project ideas to explore</li>
                <li>A structured paper outline</li>
                <li>Recommended datasets and libraries</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResearchAssistant;

