import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { DocumentInput } from "@/components/DocumentInput";
import { ResultsView } from "@/components/ResultsView";
import { AnalyzingState } from "@/components/AnalyzingState";
import { analyzeDocument, AnalysisResult } from "@/lib/gemini";
import type { LegalAnalysis } from "@/types/analysis";
import { toast } from "sonner";
import { ArrowDown, FileText, Gavel, MessagesSquare, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "idle" | "loading" | "done" | "error";

const STEPS = [
  { n: "01", title: "Paste your document", desc: "Letter, lease, summons, contract.", Icon: FileText },
  { n: "02", title: "AI reads it carefully", desc: "Long-context understanding, no skimming.", Icon: Sparkles },
  { n: "03", title: "See risks & rights", desc: "Plain English. Red flags called out.", Icon: ShieldAlert },
  { n: "04", title: "Send a draft response", desc: "Calm, formal, ready to copy.", Icon: MessagesSquare },
];

const Index = () => {
  const [status, setStatus] = useState<Status>("idle");
  const [analysis, setAnalysis] = useState<LegalAnalysis | null>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((status === "loading" || status === "done") && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [status]);

  const handleAnalyze = async (documentText: string, region: string) => {
    setStatus("loading");
    setAnalysis(null);
    try {
      const result = await analyzeDocument(documentText, "text/plain");
      if (!result) {
        toast.error("Empty response", { description: "Please try again." });
        setStatus("error");
        return;
      }
      // Map correctly to LegalAnalysis type
      setAnalysis(result as unknown as LegalAnalysis);
      setStatus("done");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
      setStatus("error");
    }
  };

  const reset = () => {
    setStatus("idle");
    setAnalysis(null);
    workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToWorkspace = () =>
    workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="container relative pt-12 pb-16 sm:pt-20 sm:pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground shadow-paper">
              <Gavel className="h-3.5 w-3.5 text-accent" />
              Plain-English legal help, in seconds
            </div>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-foreground text-balance sm:text-6xl md:text-7xl">
              Got a scary letter?
              <br />
              <span className="brass-underline">We'll explain it.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground text-balance sm:text-xl">
              Upload any legal document — a contract, lease, court summons, or threatening letter
              — and CourtSense gives you a plain-English breakdown, flags risky clauses, explains
              your rights, and drafts a response.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button variant="brass" size="xl" onClick={scrollToWorkspace} className="gap-2">
                <Sparkles className="h-5 w-5" />
                Analyze my document
              </Button>
              <Button variant="ghost" size="xl" onClick={scrollToWorkspace} className="gap-1.5">
                <ArrowDown className="h-4 w-4" />
                See how it works
              </Button>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              Free. Private. Not legal advice — but a really good first step.
            </p>
          </div>

          {/* Floating sample preview */}
          <div className="relative mx-auto mt-16 max-w-4xl">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-brass opacity-20 blur-3xl" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="paper rounded-2xl p-5 rotate-[-1.2deg] shadow-card">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  What you got in the mail
                </p>
                <p className="mt-2 font-display text-sm leading-relaxed text-foreground/70">
                  "...you have FIVE (5) DAYS from receipt of this letter to remit payment in full,
                  after which we will commence eviction proceedings without further notice... you
                  have waived your right to a jury trial..."
                </p>
              </div>
              <div className="paper rounded-2xl p-5 rotate-[0.9deg] shadow-card">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-risk-high/10 px-2 py-0.5 text-[11px] font-medium text-risk-high ring-1 ring-risk-high/30">
                    High concern
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    What CourtSense says
                  </span>
                </div>
                <p className="font-display text-base font-semibold text-foreground">
                  This is a final demand before eviction.
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">
                  You have 5 days to respond. The "lease processing fee" and the jury trial waiver
                  may not be enforceable in your state. Here's a draft dispute letter…
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="container pb-16">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="paper rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl font-semibold text-accent">{s.n}</span>
                  <s.Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold text-foreground">
                  {s.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Workspace */}
        <section ref={workspaceRef} className="container scroll-mt-20 pb-20">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Your workspace
              </p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-foreground sm:text-4xl">
                Let's read it together.
              </h2>
            </div>

            <div ref={resultsRef} className="scroll-mt-20">
              {status === "idle" || status === "error" ? (
                <DocumentInput onAnalyze={handleAnalyze} isLoading={false} />
              ) : status === "loading" ? (
                <AnalyzingState />
              ) : analysis ? (
                <ResultsView analysis={analysis} onReset={reset} />
              ) : null}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Index;
