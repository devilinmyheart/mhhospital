import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export function EmergencyRibbon() {
  return (
    <div className="bg-foreground text-background px-4 py-2 flex justify-between items-center text-[10px] font-mono tracking-[0.2em] uppercase">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2">
          <span className="size-1.5 bg-primary rounded-full animate-pulse" />
          Emergency · 24/7
        </span>
        <span className="opacity-40 hidden sm:inline">/</span>
        <span className="hidden sm:inline opacity-70">{"\n"}</span>
      </div>
      <a href="tel:+917905932721" className="hidden md:flex items-center gap-2 group">
        <span className="opacity-70 group-hover:opacity-100">Call ER</span>
        <span className="text-primary font-medium">+91 7905 932 721</span>
      </a>
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
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="size-7 bg-foreground text-background grid place-items-center font-mono font-bold text-[13px] group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                M
              </span>
              <span className="font-mono font-bold tracking-tight text-[15px]">
                MH<span className="text-primary">·</span>HOSPITAL
              </span>
            </Link>
            <div className="hidden lg:flex gap-7 text-[12px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
              {[
                ["/departments", "Depts"],
                ["/physicians", "Physicians"],
                ["/book", "Book"],
                ["/about", "About"],
                ["/contact", "Contact"],
              ].map(([to, label]) => (
                <Link key={to} to={to} className="hover:text-foreground transition-colors" activeProps={{ className: "text-foreground" }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/portal"
                  className="text-[11px] font-mono tracking-widest uppercase border border-border px-3 py-2 hover:border-foreground transition-colors"
                >
                  Portal
                </Link>
                <button
                  onClick={signOut}
                  className="hidden sm:inline text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="text-[11px] font-mono tracking-widest uppercase border border-border px-3 py-2 hover:border-foreground transition-colors"
              >
                Sign in
              </Link>
            )}
            <Link
              to="/book"
              className="bg-primary text-primary-foreground text-[11px] font-mono font-semibold tracking-widest uppercase px-4 py-2 hover:bg-foreground transition-colors"
            >
              Book →
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-16">
          <div className="md:col-span-5">
            <div className="text-kicker mb-4">EST. 2010</div>
            <div className="font-mono font-bold tracking-tight text-4xl md:text-5xl leading-[0.95] mb-6">
              MH<span className="text-primary">·</span>HOSPITAL
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              A community hospital in Sinduria,Maharajganj built on clinical excellence and patient-first digital care.
            </p>
          </div>
          <div className="md:col-span-3">
            <h4 className="text-kicker mb-5">Visit</h4>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>Sikarpur Road,</li>
              <li>Sinduria chauraha se 100m aage</li>
              <li>District Maharajganj 273303</li>
              <li className="pt-3">
                <a href="tel:+917905932721" className="text-foreground font-mono">
                  +91 7905 932 721
                </a>
              </li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="text-kicker mb-5">Care</h4>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li><Link to="/departments" className="hover:text-foreground">Departments</Link></li>
              <li><Link to="/physicians" className="hover:text-foreground">Physicians</Link></li>
              <li><Link to="/book" className="hover:text-foreground">Book visit</Link></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="text-kicker mb-5">Hospital</h4>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground">About MH</Link></li>
              <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
              <li>Privacy</li>
            </ul>
          </div>
        </div>
        <div className="editorial-rule mb-6" />
        <div className="flex flex-wrap justify-between gap-4 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          <div>© 2026 MH Healthcare Systems</div>
          <div>Maharajganj · Uttar Pradesh · India</div>
        </div>
      </div>
    </footer>
  );
}
