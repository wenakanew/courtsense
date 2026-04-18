import { useState } from "react";
import type { LegalAnalysis } from "@/types/analysis";
import { SeverityBadge } from "./SeverityBadge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  FileSignature,
  Gavel,
  ListChecks,
  Quote,
  ShieldAlert,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";

interface ResultsViewProps {
  analysis: LegalAnalysis;
  onReset: () => void;
}

const Section = ({
  icon: Icon,
  title,
  eyebrow,
  children,
}: {
  icon: typeof Gavel;
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) => (
  <section className="paper rounded-2xl p-6 sm:p-8 animate-fade-up">
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
          {title}
        </h2>
      </div>
    </div>
    {children}
  </section>
);

export const ResultsView = ({ analysis, onReset }: ResultsViewProps) => {
  const [speaking, setSpeaking] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);

  const speakSummary = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Voice not supported in this browser");
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const text = `${analysis.documentType}. ${analysis.urgencySummary} ${analysis.plainSummary}`;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.pitch = 1;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
    setSpeaking(true);
  };

  const copyDraft = async () => {
    const text = `Subject: ${analysis.draftResponse.subject}\n\n${analysis.draftResponse.body}`;
    await navigator.clipboard.writeText(text);
    setCopiedDraft(true);
    toast.success("Draft copied to clipboard");
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="paper-elevated relative overflow-hidden rounded-2xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-brass" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                What you're holding
              </p>
              <h1 className="mt-1 font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
                {analysis.documentType}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <SeverityBadge severity={analysis.severity} />
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {analysis.urgencySummary}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={speakSummary} className="gap-1.5">
                {speaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                {speaking ? "Stop" : "Read aloud"}
              </Button>
              <Button variant="ghost" size="sm" onClick={onReset} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                New document
              </Button>
            </div>
          </div>

          {analysis.keyFacts.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {analysis.keyFacts.slice(0, 8).map((f, i) => (
                <div key={i} className="bg-card p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {f.label}
                  </p>
                  <p className="mt-1 font-display text-base font-medium text-foreground text-pretty">
                    {f.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Plain summary */}
      <Section icon={Sparkles} eyebrow="Plain English" title="What this actually means">
        <div className="prose prose-neutral max-w-none">
          {analysis.plainSummary.split("\n").filter(Boolean).map((p, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-foreground/90 first:mt-0">
              {p}
            </p>
          ))}
        </div>
      </Section>

      {/* Risks */}
      {analysis.risks.length > 0 && (
        <Section icon={ShieldAlert} eyebrow="Things to watch" title="Risks & red flags">
          <ul className="space-y-4">
            {analysis.risks.map((r, i) => (
              <li
                key={i}
                className="rounded-xl border border-border bg-background/40 p-5 transition-colors hover:bg-background/70"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {r.title}
                  </h3>
                  <SeverityBadge severity={r.severity} size="sm" />
                </div>
                {r.quote && (
                  <blockquote className="mb-3 flex gap-2 border-l-2 border-accent/60 bg-card/60 px-3 py-2 text-sm italic text-muted-foreground">
                    <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                    <span>"{r.quote}"</span>
                  </blockquote>
                )}
                <p className="text-[15px] leading-relaxed text-foreground/85">{r.explanation}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Rights */}
      <Section icon={Gavel} eyebrow="Your rights" title="What you're entitled to">
        <div className="grid gap-4 sm:grid-cols-2">
          {analysis.rights.map((r, i) => (
            <div key={i} className="rounded-xl border border-border bg-background/40 p-4">
              <h3 className="mb-1.5 font-display text-base font-semibold text-foreground">
                {r.title}
              </h3>
              <p className="text-sm leading-relaxed text-foreground/80">{r.explanation}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Next steps */}
      <Section icon={ListChecks} eyebrow="What to do" title="Your next steps">
        <ol className="space-y-3">
          {analysis.nextSteps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink font-display text-sm font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <p className="pt-0.5 text-[15px] leading-relaxed text-foreground/90">{s}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Draft response */}
      {analysis.draftResponse.applicable && analysis.draftResponse.body && (
        <Section icon={FileSignature} eyebrow="Ready to send" title="Draft response">
          <div className="rounded-xl border border-border bg-card/80 shadow-paper">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Subject
                </p>
                <p className="truncate font-medium text-foreground">{analysis.draftResponse.subject}</p>
              </div>
              <Button variant="brass" size="sm" onClick={copyDraft} className="gap-1.5">
                {copiedDraft ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedDraft ? "Copied" : "Copy letter"}
              </Button>
            </div>
            <pre className="whitespace-pre-wrap p-5 font-body text-[15px] leading-relaxed text-foreground/90">
              {analysis.draftResponse.body}
            </pre>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Replace anything in [BRACKETS] with your own info before sending.
          </p>
        </Section>
      )}

      {/* Disclaimer */}
      <div className="rounded-xl border border-border/70 bg-secondary/40 p-4 text-xs text-muted-foreground">
        <strong className="font-semibold text-foreground">A note:</strong> {analysis.disclaimer}
      </div>
    </div>
  );
};
