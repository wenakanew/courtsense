import { Logo } from "./Logo";
import { ShieldCheck, LogIn, LayoutDashboard } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";

export const SiteHeader = () => {
  const { user, signInWithGoogle } = useAuth();
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <div className="hidden items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground sm:flex">
          <ShieldCheck className="h-3.5 w-3.5 text-risk-low" />
          <span>Private. Not legal advice.</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            !isDashboard && (
              <Button variant="brass" size="sm" asChild>
                <Link to="/dashboard" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            )
          ) : (
            <Button variant="brass" size="sm" onClick={signInWithGoogle} className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
