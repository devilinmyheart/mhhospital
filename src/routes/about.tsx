import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — MH Hospital" },
      { name: "description", content: "About MH Hospital: mission, values, and clinical excellence since 1984." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="max-w-3xl mx-auto p-4 lg:p-6 space-y-6">
        <div className="animate-enter">
          <div className="mono-label mb-2">ABOUT / MH_HOSPITAL</div>
          <h1 className="text-3xl font-bold tracking-tight">Precision care, since 1984.</h1>
        </div>
        <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
          <p>
            MH Hospital is a leading quaternary-care institution serving the metropolitan region with more than
            300 physicians across 8 specialized clinical departments. We combine world-class medical expertise
            with a patient-first digital infrastructure.
          </p>
          <p>
            Our operations center manages 14,000+ procedures annually with a 98% patient satisfaction score, and
            our emergency department is open 24 hours a day, 7 days a week.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-px bg-border border border-border">
          {[
            { k: "1984", v: "Founded" },
            { k: "300+", v: "Physicians" },
            { k: "98%", v: "Satisfaction" },
          ].map((s) => (
            <div key={s.k} className="bg-card p-6 text-center">
              <div className="text-2xl font-bold">{s.k}</div>
              <div className="mono-label mt-1">{s.v}</div>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
