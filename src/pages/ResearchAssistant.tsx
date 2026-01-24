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
    citationCount?: number;
    venue?: string;
  }>;
  project_ideas: Array<{
    title: string;
    description: string;
    methodology?: string;
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
            title: 'Attention Is All You Need',
            authors: ['Vaswani, A.', 'Shazeer, N.', 'Parmar, N.'],
            url: 'https://arxiv.org/abs/1706.03762',
            abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks...',
            year: 2017,
            citationCount: 95000,
            venue: 'NeurIPS',
          },
          {
            title: 'BERT: Pre-training of Deep Bidirectional Transformers',
            authors: ['Devlin, J.', 'Chang, M.', 'Lee, K.'],
            url: 'https://arxiv.org/abs/1810.04805',
            abstract: 'We introduce a new language representation model called BERT...',
            year: 2018,
            citationCount: 75000,
            venue: 'NAACL',
          },
        ],
        project_ideas: [
          {
            title: 'Efficient Transformer Architectures',
            description: 'Explore novel attention mechanisms that reduce computational complexity while maintaining performance.',
            methodology: 'Implement sparse attention patterns, benchmark on standard NLP tasks',
          },
          {
            title: 'Cross-Modal Learning with Transformers',
            description: 'Investigate how transformer architectures can be adapted for multi-modal learning tasks.',
            methodology: 'Design unified encoder-decoder architecture, evaluate on vision-language benchmarks',
          },
        ],
        outline: {
          sections: [
            { title: 'Introduction', description: 'Background and motivation for the research' },
            { title: 'Related Work', description: 'Review of existing literature and approaches' },
            { title: 'Methodology', description: 'Proposed approach and technical details' },
            { title: 'Experiments', description: 'Experimental setup and evaluation metrics' },
            { title: 'Results', description: 'Quantitative and qualitative findings' },
            { title: 'Conclusion', description: 'Summary and future directions' },
          ],
        },
        datasets: [
          { name: 'glue', description: 'General Language Understanding Evaluation benchmark', url: 'https://huggingface.co/datasets/glue' },
          { name: 'squad', description: 'Stanford Question Answering Dataset', url: 'https://huggingface.co/datasets/squad' },
        ],
        libraries: [
          { name: 'Hugging Face Transformers', description: 'State-of-the-art NLP models', url: 'https://huggingface.co/transformers' },
          { name: 'PyTorch', description: 'Deep learning framework', url: 'https://pytorch.org' },
        ],
      };
      setOutput(mockOutput);
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
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold">{paper.title}</h4>
                        {paper.url && (
                          <a
                            href={paper.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex-shrink-0"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {paper.authors && paper.authors.length > 0 && (
                          <span>{paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ' et al.' : ''}</span>
                        )}
                        {paper.year && <Badge variant="outline">{paper.year}</Badge>}
                        {paper.citationCount !== undefined && paper.citationCount > 0 && (
                          <Badge variant="secondary">{paper.citationCount} citations</Badge>
                        )}
                        {paper.venue && (
                          <Badge variant="outline" className="text-xs">{paper.venue}</Badge>
                        )}
                      </div>
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
                    <div key={index} className="p-4 border rounded-lg space-y-2">
                      <h4 className="font-semibold">{idea.title}</h4>
                      <p className="text-sm text-muted-foreground">{idea.description}</p>
                      {idea.methodology && (
                        <div className="flex items-center gap-2 pt-1">
                          <Badge variant="outline" className="text-xs">Methodology</Badge>
                          <span className="text-xs text-muted-foreground">{idea.methodology}</span>
                        </div>
                      )}
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
                Enter a research topic or question, and our AI will:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Search <strong>Semantic Scholar</strong> for relevant papers with citation data</li>
                <li>Query <strong>arXiv</strong> for the latest preprints</li>
                <li>Find datasets on <strong>HuggingFace</strong></li>
                <li>Generate project ideas based on research gaps</li>
                <li>Create a structured paper outline</li>
                <li>Recommend libraries and tools</li>
              </ul>
              <Separator className="my-3" />
              <p className="text-xs">
                Papers are deduplicated and sorted by citation count for relevance.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResearchAssistant;

