import { Loader2 } from "lucide-react";

const lines = [
  "Reading the document…",
  "Spotting deadlines and amounts…",
  "Flagging unfair clauses…",
  "Looking up your rights…",
  "Drafting a response…",
];

import { useEffect, useState } from "react";

export const AnalyzingState = () => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % lines.length), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="paper-elevated rounded-2xl p-10 text-center animate-fade-up">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brass animate-pulse-ring">
        <Loader2 className="h-7 w-7 animate-spin text-accent-foreground" />
      </div>
      <h2 className="font-display text-2xl font-semibold text-foreground">
        Reading carefully
      </h2>
      <p className="mt-2 text-muted-foreground transition-opacity duration-300">{lines[idx]}</p>
      <div className="mx-auto mt-8 grid max-w-md gap-2.5">
        {[100, 90, 75, 88, 60].map((w, i) => (
          <div
            key={i}
            className="h-3 rounded-full animate-shimmer"
            style={{ width: `${w}%`, animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
};
