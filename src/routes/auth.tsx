import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({ next: z.string().optional() });

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — MH Hospital" },
      { name: "description", content: "Sign in or create an MH Hospital patient account." },
      { property: "og:title", content: "Sign in — MH Hospital" },
      { property: "og:description", content: "Access your MH Hospital patient portal." },
      { property: "og:url", content: "https://mhhospital.lovable.app/auth" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://mhhospital.lovable.app/auth" }],
  }),
  validateSearch: searchSchema,
  component: Auth,
});

function Auth() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: (next as any) || "/portal", replace: true });
    });
  }, [navigate, next]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created — you're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: (next as any) || "/portal", replace: true });
    } catch (e: any) {
      toast.error(e.message ?? "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="max-w-md mx-auto p-6 mt-8">
        <div className="bg-card border border-border p-8 animate-enter">
          <div className="mono-label mb-2">MH_HOSPITAL / AUTH</div>
          <h1 className="text-2xl font-bold tracking-tight mb-6">
            {mode === "signin" ? "Sign in" : "Create account"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label htmlFor="auth-full-name" className="mono-label block mb-2">FULL NAME</label>
                <input
                  id="auth-full-name"
                  name="full_name"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-background border border-border p-3 text-sm rounded-sm"
                />
              </div>
            )}
            <div>
              <label htmlFor="auth-email" className="mono-label block mb-2">EMAIL</label>
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-border p-3 text-sm rounded-sm"
              />
            </div>
            <div>
              <label htmlFor="auth-password" className="mono-label block mb-2">PASSWORD</label>
              <input
                id="auth-password"
                name="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background border border-border p-3 text-sm rounded-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 text-sm font-semibold rounded-sm hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "..." : mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-6 text-xs text-muted-foreground hover:text-foreground w-full text-center"
          >
            {mode === "signin" ? "No account? Sign up →" : "Already have an account? Sign in →"}
          </button>
        </div>
      </main>
    </div>
  );
}
