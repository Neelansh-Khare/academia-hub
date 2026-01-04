import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { FlaskConical, LineChart, Mail, Search, Sparkles, Users2 } from "lucide-react";

const Index = () => {
  const handlePrimaryCta = () => {
    toast({
      title: "Early access coming soon",
      description: "This is a concept preview of AcademiaLink. We'll hook up real sign-ups next.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-[-10%] top-[-25%] h-[420px] bg-subtle-glow opacity-70" />

        <div className="container relative z-10 flex flex-col pb-12 pt-8 md:pb-16 md:pt-10 lg:pb-20">
          <header className="mb-10 flex items-center justify-between gap-4 md:mb-16">
            <a href="/" className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-hero-gradient text-primary-foreground shadow-ring">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="flex flex-col">
                <span className="font-display text-lg font-semibold tracking-tight">AcademiaLink</span>
                <span className="text-xs text-muted-foreground">Academic research collaboration network</span>
              </div>
            </a>

            <nav className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="hidden items-center gap-6 md:flex">
                <a href="#product" className="transition-colors hover:text-foreground">
                  Product
                </a>
                <a href="#mvp" className="transition-colors hover:text-foreground">
                  MVP flows
                </a>
                <a href="#roadmap" className="transition-colors hover:text-foreground">
                  Roadmap
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => window.location.href = '/auth'}>
                  Log in
                </Button>
                <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={() => window.location.href = '/auth'}>
                  Sign up
                </Button>
              </div>
            </nav>
          </header>

          <main className="space-y-16 pb-4 md:space-y-20">
            <section
              id="hero"
              className="grid gap-10 md:gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center"
            >
              <div className="space-y-6">
                <Badge
                  variant="secondary"
                  className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/80 px-3 py-1 text-xs"
                >
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                  Built for labs, departments &amp; research students
                </Badge>

                <div className="space-y-4">
                  <h1 className="max-w-xl text-4xl tracking-tight sm:text-5xl md:text-6xl">
                    Connect {" "}
                    <span className="bg-hero-gradient bg-clip-text text-transparent">labs, students &amp; funding</span>{" "}
                    into one research graph.
                  </h1>
                  <p className="max-w-xl text-base text-muted-foreground md:text-lg">
                    AcademiaLink is a professional network for research collaboration and discovery — with an
                    intelligent lab assistant that surfaces perfect matches, outreach email drafts, and grant leads.
                  </p>
                </div>

                <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Search className="mt-0.5 h-4 w-4 text-accent" />
                    <p>Search by field, methods, tools, university or keywords — not just titles.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users2 className="mt-0.5 h-4 w-4 text-accent" />
                    <p>Profiles for professors, labs &amp; students with skills, datasets and equipment.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <FlaskConical className="mt-0.5 h-4 w-4 text-accent" />
                    <p>Post RAships, collaborations &amp; grant projects with structured requirements.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <LineChart className="mt-0.5 h-4 w-4 text-accent" />
                    <p>AI scoring turns noisy searches into a ranked shortlist of best-fit matches.</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Button variant="hero" size="lg" onClick={() => window.location.href = '/auth'}>
                    Request early access
                  </Button>
                  <Button variant="ghost" size="lg" className="gap-2" onClick={() => window.location.href = '/auth'}>
                    <span>Sign in</span>
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    MVP: profiles · tag-based search · RA posts · apply with CV &amp; message.
                  </p>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">AI match scoring</Badge>
                  <Badge variant="outline">Cold email drafts</Badge>
                  <Badge variant="outline">Grant opportunity suggestions</Badge>
                </div>
              </div>

              <div className="relative">
                <div className="pointer-events-none absolute -inset-6 rounded-3xl bg-hero-gradient opacity-20 blur-3xl" />
                <Card className="relative mx-auto max-w-md animate-fade-up border border-border/80 bg-card/80 shadow-elevated backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                      <CardTitle className="text-base">AI lab assistant</CardTitle>
                      <CardDescription>Concept preview · powered by GPT-style models</CardDescription>
                    </div>
                    <Badge variant="secondary">Live soon</Badge>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="space-y-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Example conversation
                      </p>
                      <div className="space-y-2">
                        <div className="max-w-[90%] rounded-2xl bg-secondary px-3 py-2 text-xs text-secondary-foreground">
                          <span className="font-medium">PI · Neuroscience lab</span>
                          <p className="mt-1">
                            
                            
                            
                            
                            “Find 3 RA candidates with Python + fMRI experience at EU universities for Fall 2025.”
                          </p>
                        </div>
                        <div className="flex justify-end">
                          <div className="max-w-[88%] rounded-2xl bg-primary px-3 py-2 text-xs text-primary-foreground">
                            <span className="font-medium">AcademiaLink</span>
                            <p className="mt-1">
                              Here are 3 ranked profiles plus 2 labs open to co‑supervision. I&apos;ve drafted outreach
                              emails and highlighted relevant publications from Google Scholar &amp; arXiv.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/60 p-3 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-foreground">Matching signals</span>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">
                          Tag-based search · GPT scoring
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-background/70 p-2">
                          <p className="text-[11px] text-muted-foreground">Methods overlap</p>
                          <p className="text-sm font-semibold text-foreground">92%</p>
                        </div>
                        <div className="rounded-xl bg-background/70 p-2">
                          <p className="text-[11px] text-muted-foreground">Tooling fit</p>
                          <p className="text-sm font-semibold text-foreground">88%</p>
                        </div>
                        <div className="rounded-xl bg-background/70 p-2">
                          <p className="text-[11px] text-muted-foreground">Timeline match</p>
                          <p className="text-sm font-semibold text-foreground">Perfect</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Backed by AI · ready to plug into your real profiles, posts, and grants.
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between border-t border-border/60 bg-muted/40 px-6 py-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                      <span>Realtime suggestions · no scraping of private data.</span>
                    </div>
                    <span className="hidden text-[10px] uppercase tracking-wide md:inline">
                      Google Scholar · arXiv · location via Mapbox
                    </span>
                  </CardFooter>
                </Card>
              </div>
            </section>

            <section id="product" className="space-y-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                    Built for real academic workflows
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                    Capture the nuance of research profiles, then search and match by what actually matters: fields,
                    methods, datasets, tools, and constraints.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">Profiles</Badge>
                  <Badge variant="outline">Search</Badge>
                  <Badge variant="outline">RA / jobs / projects</Badge>
                  <Badge variant="outline">AI assistant</Badge>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <Card className="flex flex-col justify-between border-border/80 bg-card/80 shadow-soft transition-all hover:-translate-y-1.5 hover:shadow-elevated">
                  <CardHeader className="space-y-3">
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-secondary">
                      <Users2 className="h-4 w-4 text-accent" />
                    </div>
                    <CardTitle className="text-lg">Profiles that feel like mini lab websites</CardTitle>
                    <CardDescription>
                      Professors, labs and students highlight fields, methods, tools, datasets, equipment and teaching
                      interests.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-6 text-xs text-muted-foreground">
                    <ul className="space-y-1.5">
                      <li>• Structured tags for fields, methods &amp; tools</li>
                      <li>• Links to Google Scholar, ORCID, lab pages</li>
                      <li>• Location &amp; visa constraints via Mapbox</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="flex flex-col justify-between border-border/80 bg-card/80 shadow-soft transition-all hover:-translate-y-1.5 hover:shadow-elevated">
                  <CardHeader className="space-y-3">
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-secondary">
                      <Search className="h-4 w-4 text-accent" />
                    </div>
                    <CardTitle className="text-lg">Search &amp; RA / collab posting</CardTitle>
                    <CardDescription>
                      Labs post opportunities, students filter by fit, and everyone sees expectations up front.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-6 text-xs text-muted-foreground">
                    <ul className="space-y-1.5">
                      <li>• RAships, fellowships, visiting roles, grants</li>
                      <li>• Filter by level, time zone, funding, on-site/remote</li>
                      <li>• Apply with CV, portfolio, and tailored message</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="flex flex-col justify-between border-border/80 bg-card/80 shadow-soft transition-all hover:-translate-y-1.5 hover:shadow-elevated">
                  <CardHeader className="space-y-3">
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-secondary">
                      <LineChart className="h-4 w-4 text-accent" />
                    </div>
                    <CardTitle className="text-lg">AI matching &amp; outreach assist</CardTitle>
                    <CardDescription>
                      Start with tag-based matches, then let AI re-rank, explain scores and draft messages.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-6 text-xs text-muted-foreground">
                    <ul className="space-y-1.5">
                      <li>• GPT-powered explainable match scores</li>
                      <li>• Cold email generator with academic tone</li>
                      <li>• Grant opportunity suggestions by topic</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section id="mvp" className="space-y-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">MVP scope · v0.1</h2>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                    Start simple: accounts, profiles, posts, applications — then layer GPT match scoring and email
                    generation on top.
                  </p>
                </div>
                <Badge variant="secondary">Focused, demo‑able slice</Badge>
              </div>

              <div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
                <div className="space-y-4 rounded-2xl border border-dashed border-border bg-card/70 p-5 text-sm shadow-soft">
                  <h3 className="text-base font-semibold text-foreground">User journey</h3>
                  <ol className="space-y-3 text-muted-foreground">
                    <li>
                      <span className="font-medium text-foreground">1 · Create an account &amp; profile</span>
                      <p className="text-xs">
                        Email-based sign up. Users choose &quot;Professor / PI&quot;, &quot;Lab&quot; or &quot;Student&quot; and add skills,
                        methods, tools, and links.
                      </p>
                    </li>
                    <li>
                      <span className="font-medium text-foreground">2 · Search &amp; discover</span>
                      <p className="text-xs">
                        Tag-based search across profiles and posts: research areas, methods, tools, and locations.
                      </p>
                    </li>
                    <li>
                      <span className="font-medium text-foreground">3 · Post &amp; apply</span>
                      <p className="text-xs">
                        Labs post RAships or collaboration calls. Students apply with CV and a short motivation
                        message.
                      </p>
                    </li>
                    <li>
                      <span className="font-medium text-foreground">4 · AI match scoring</span>
                      <p className="text-xs">
                        GPT scores candidates vs. posts, surfaces best fits, and offers email drafts for outreach from
                        both sides.
                      </p>
                    </li>
                  </ol>
                </div>

                <div className="space-y-4 rounded-2xl border border-border bg-muted/60 p-5 text-xs text-muted-foreground">
                  <h3 className="text-sm font-semibold text-foreground">Implementation notes</h3>
                  <ul className="space-y-2">
                    <li>• Frontend: React + Tailwind + shadcn (this project).</li>
                    <li>• Backend: Lovable Cloud database for profiles, posts, and applications.</li>
                    <li>• AI: Lovable AI gateway for match scoring &amp; cold email generation.</li>
                    <li>• Integrations: Google Scholar, arXiv, Mapbox location (later passes).</li>
                  </ul>
                  <p className="pt-2 text-[11px]">
                    This UI is your starting point. Next steps: wire authentication, create tables, and connect the AI
                    edge functions.
                  </p>
                </div>
              </div>
            </section>

            <section id="roadmap" className="space-y-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Stretch goals &amp; trust layer</h2>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                    Once the MVP is stable, grow into a trusted academic graph with verification, team views, and
                    health metrics.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-border/80 bg-card/80">
                  <CardHeader className="space-y-2">
                    <CardTitle className="text-base">Trust metrics</CardTitle>
                    <CardDescription>
                      Lightweight signals for recency of activity, completion of profiles, and history of successful
                      matches.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    <ul className="space-y-1.5">
                      <li>• "Last active" and "response rate" for labs</li>
                      <li>• Anonymous satisfaction scores after placements</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-border/80 bg-card/80">
                  <CardHeader className="space-y-2">
                    <CardTitle className="text-base">Verified .edu badge</CardTitle>
                    <CardDescription>
                      Domain + email verification for institutions, programs and labs to reduce impersonation risk.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    <ul className="space-y-1.5">
                      <li>• Institution-level management dashboard</li>
                      <li>• Optional human review for new universities</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-border/80 bg-card/80">
                  <CardHeader className="space-y-2">
                    <CardTitle className="text-base">Team dashboards</CardTitle>
                    <CardDescription>
                      Departmental overviews of applications, offers, and grant-related collaborations across labs.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    <ul className="space-y-1.5">
                      <li>• Pipeline views for RAships and projects</li>
                      <li>• Export to CSV for reporting and grant writing</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>
          </main>

          <footer className="mt-6 border-t border-border/80 pt-6 text-xs text-muted-foreground md:mt-10">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <p>
                © {new Date().getFullYear()} AcademiaLink. Concept interface built with Lovable.
              </p>
              <p className="text-[11px]">
                Next: connect authentication, database tables, AI edge functions, and real integrations.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Index;
