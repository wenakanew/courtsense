import { Scale } from "lucide-react";

export const Logo = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-ink shadow-paper">
      <Scale className="h-5 w-5 text-accent" strokeWidth={2.25} />
      <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent ring-2 ring-background" />
    </div>
    <div className="flex flex-col leading-none">
      <span className="font-display text-xl font-semibold tracking-tight text-foreground">
        Court<span className="text-accent">Sense</span>
      </span>
      <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        AI legal aid
      </span>
    </div>
  </div>
);
