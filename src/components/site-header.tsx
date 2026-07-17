import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export function EmergencyRibbon() {
  return (
    <div className="bg-emergency text-emergency-foreground px-4 py-1.5 flex justify-between items-center text-[11px] font-mono tracking-wider">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2">
          <span className="size-1.5 bg-white rounded-full animate-pulse" />
          EMERGENCY SERVICES ACTIVE: 24/7
        </span>
        <span className="opacity-70 hidden sm:inline">|</span>
        <span className="hidden sm:inline">ER WAIT TIME: 14 MIN</span>
      </div>
      <div className="hidden md:block">CALL: +91 7905932721</div>
    </div>
  );
}

export function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/", replace: true });
  }

  return (
    <>
      <EmergencyRibbon />
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-bold tracking-tighter text-lg">
            MH<span className="text-primary">&nbsp;HOSPITAL</span>
          </Link>
          <div className="hidden lg:flex gap-6 text-[13px] font-medium text-muted-foreground">
            <Link to="/departments" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              Departments
            </Link>
            <Link to="/physicians" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              Physicians
            </Link>
            <Link to="/book" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              Book
            </Link>
            <Link to="/about" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              About
            </Link>
            <Link to="/contact" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              Contact
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/portal"
                className="text-[12px] font-mono border border-border px-3 py-1.5 hover:bg-accent transition-colors rounded-sm"
              >
                MY_PORTAL
              </Link>
              <button
                onClick={signOut}
                className="text-[12px] font-medium text-muted-foreground hover:text-foreground"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="text-[12px] font-mono border border-border px-3 py-1.5 hover:bg-accent transition-colors rounded-sm"
            >
              SIGN_IN
            </Link>
          )}
          <Link
            to="/book"
            className="bg-primary text-primary-foreground text-[12px] font-semibold px-4 py-1.5 rounded-sm hover:opacity-90 transition-opacity"
          >
            BOOK APPOINTMENT
          </Link>
        </div>
      </nav>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-card p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-2">
          <div className="font-bold tracking-tighter text-xl mb-4">
            MH<span className="text-primary">&nbsp;HOSPITAL</span>
          </div>
          <p className="text-xs text-muted-foreground max-w-sm mb-6">
            A leading care institution dedicated to the intersection of clinical excellence and patient-first digital systems.
          </p>
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            © 2026 MH HEALTHCARE SYSTEMS
          </div>
        </div>
        <div>
          <h4 className="text-[10px] font-mono font-bold uppercase mb-4 tracking-widest">LOCATION</h4>
          <ul className="text-xs space-y-2 text-muted-foreground">
            <li>Sikarpur Road, Sinduria chauraha s 100m aage</li>
            <li>District Maharajganj 273303</li>
            <li className="pt-2 text-emergency font-mono">ER: +91 7905932721</li>
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] font-mono font-bold uppercase mb-4 tracking-widest">Administration</h4>
          <ul className="text-xs space-y-2 text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">About MH</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
            <li>HIPAA Privacy</li>
            <li>Ethics Committee</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
