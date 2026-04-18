import { Logo } from "./Logo";
import { ShieldCheck } from "lucide-react";

export const SiteHeader = () => {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <div className="hidden items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground sm:flex">
          <ShieldCheck className="h-3.5 w-3.5 text-risk-low" />
          <span>Private. Not legal advice.</span>
        </div>
      </div>
    </header>
  );
};
