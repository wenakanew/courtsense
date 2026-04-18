import { Heart } from "lucide-react";

export const SiteFooter = () => (
  <footer className="border-t border-border/60 bg-background/60">
    <div className="container flex flex-col items-center justify-between gap-3 py-8 text-xs text-muted-foreground sm:flex-row">
      <p className="text-center sm:text-left">
        CourtSense provides general information, not legal advice. Always consult a licensed
        attorney for binding decisions.
      </p>
      <p className="flex items-center gap-1.5">
        Built with <Heart className="h-3 w-3 fill-accent text-accent" /> for people who can't afford a lawyer
      </p>
    </div>
  </footer>
);
