import { useCallback, useRef, useState } from "react";
import { FileText, Loader2, Sparkles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface DocumentInputProps {
  onAnalyze: (text: string, region: string) => void;
  isLoading: boolean;
}

const SAMPLE = `NOTICE OF DEMAND FOR PAYMENT

Re: Account #4471-882-A
Date: 14 March 2025

Dear Tenant,

This letter serves as final demand for the sum of $2,847.00 owed for unpaid rent for the months of January and February 2025, plus late fees of $250 per month and a "lease processing fee" of $475.

You are hereby notified that you have FIVE (5) DAYS from receipt of this letter to remit payment in full, after which we will commence eviction proceedings without further notice and pursue all available legal remedies including reporting to credit bureaus.

Please note that under Section 14.3 of your lease, you have waived your right to a jury trial and agreed to binding arbitration in any dispute, with all attorney's fees to be borne by the tenant regardless of outcome.

Sincerely,
Pinnacle Property Management LLC`;

export const DocumentInput = ({ onAnalyze, isLoading }: DocumentInputProps) => {
  const [text, setText] = useState("");
  const [region, setRegion] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", { description: "Please use a file under 5 MB." });
      return;
    }
    const isText = file.type.startsWith("text/") || /\.(txt|md)$/i.test(file.name);
    if (isText) {
      const content = await file.text();
      setText(content);
      setFileName(file.name);
      toast.success("File loaded", { description: file.name });
      return;
    }
    toast.message("Paste the text instead", {
      description: "PDF/image upload is coming soon. For now, copy the document text and paste it below.",
    });
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const trimmed = text.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < 30;
  const canSubmit = trimmed.length >= 30 && !isLoading;

  return (
    <div className="paper-elevated relative overflow-hidden rounded-2xl">
      {/* Notebook ruling effect */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(180deg, transparent 0, transparent 31px, hsl(var(--primary)) 31px, hsl(var(--primary)) 32px)",
        }}
      />
      <div className="relative p-5 sm:p-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Paste or upload your document</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setText(SAMPLE)}
              className="text-xs font-medium text-accent underline-offset-4 hover:underline"
            >
              Try a sample
            </button>
          </div>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="relative"
        >
          <Textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (fileName) setFileName(null);
            }}
            placeholder="Paste the letter, contract, lease, summons, or notice you received here…"
            className="min-h-[260px] resize-y border-border/60 bg-card/40 font-body text-[15px] leading-relaxed placeholder:text-muted-foreground/70 focus-visible:ring-accent/40"
          />
          {fileName && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs">
              <FileText className="h-3 w-3" />
              <span className="font-medium">{fileName}</span>
              <button
                onClick={() => {
                  setFileName(null);
                  setText("");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,text/plain"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5"
          >
            <Upload className="h-4 w-4" />
            Upload .txt
          </Button>
          <input
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="Country or state (optional, e.g. California, UK)"
            className="h-9 flex-1 min-w-[180px] rounded-md border border-border/60 bg-card/40 px-3 text-sm placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          />
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {tooShort
              ? "Add a bit more text so we can analyze it accurately."
              : `${trimmed.length.toLocaleString()} characters`}
          </p>
          <Button
            variant="brass"
            size="lg"
            disabled={!canSubmit}
            onClick={() => onAnalyze(trimmed, region.trim())}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Reading carefully…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Explain this in plain English
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
