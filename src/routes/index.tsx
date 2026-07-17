import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listDepartments, listDoctors } from "@/lib/public.functions";
import { SiteHeader, SiteFooter } from "@/components/site-header";

const deptQO = queryOptions({ queryKey: ["departments"], queryFn: () => listDepartments() });
const docsQO = queryOptions({ queryKey: ["doctors"], queryFn: () => listDoctors({ data: {} }) });

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(deptQO);
    context.queryClient.ensureQueryData(docsQO);
  },
  component: Home,
});

function Home() {
  const { data: departments } = useSuspenseQuery(deptQO);
  const { data: doctors } = useSuspenseQuery(docsQO);
  const featuredDoctors = doctors.slice(0, 4);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="p-4 lg:p-6 max-w-7xl mx-auto grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <section className="bg-card border border-border p-6 animate-enter">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
              <div>
                <div className="mono-label mb-2">MH_HOSPITAL / PATIENT OPS</div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                  Advanced care, precisely scheduled.
                </h1>
                <p className="text-muted-foreground max-w-lg text-sm">
                  Book in-person visits, launch video consultations, and access your medical records — from a single operational portal.
                </p>
              </div>
              <div className="text-right">
                <div className="mono-label">{"\n"}</div>
                <div className="text-xs font-mono text-success mt-1">{"\n"}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/book" className="bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-sm hover:opacity-90">
                BOOK APPOINTMENT
              </Link>
              <Link to="/physicians" className="border border-border text-sm font-semibold px-5 py-2.5 rounded-sm hover:bg-accent">
                Find a Doc
              </Link>
            </div>
          </section>

          <section className="animate-enter">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-widest">Clinical Departments</h2>
              <Link to="/departments" className="text-xs text-primary font-medium underline">View all</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border">
              {departments.slice(0, 8).map((d) => (
                <Link
                  key={d.id}
                  to="/physicians"
                  search={{ dept: d.slug } as any}
                  className="bg-card p-4 hover:bg-accent transition-colors group"
                >
                  <div className="mono-label mb-4">{d.code}</div>
                  <div className="font-semibold group-hover:text-primary">{d.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{d.description}</div>
                </Link>
              ))}
            </div>
          </section>

          <section className="animate-enter">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4">Medical Directorship</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredDoctors.map((doc: any) => (
                <div key={doc.id} className="flex bg-card border border-border overflow-hidden">
                  <div className="w-24 aspect-square bg-muted flex-shrink-0 grid place-items-center border-r border-border">
                    <div className="font-mono text-xl text-muted-foreground">
                      {doc.full_name.split(" ").map((s: string) => s[0]).join("").slice(0, 2)}
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm">{doc.full_name}</h3>
                      <p className="text-xs text-muted-foreground">{doc.title}</p>
                    </div>
                    <div className="mt-3">
                      <span className="text-[10px] font-mono bg-success/10 text-success px-2 py-0.5 rounded uppercase">AVAIL_TODAY</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-primary text-primary-foreground p-6 rounded-sm shadow-lg animate-enter">
            <div className="mono-label mb-2 text-primary-foreground/80">DIGITAL CARE</div>
            <h2 className="text-xl font-bold mb-3">Launch Virtual Consultation</h2>
            <p className="text-sm opacity-90 mb-5">
              Connect with a general practitioner in under 10 minutes via encrypted video link.
            </p>
            <Link to="/book" search={{ mode: "video" } as any} className="block text-center w-full bg-background text-primary font-bold py-3 text-sm hover:opacity-90 transition-opacity">
              START SESSION
            </Link>
          </div>

          <div className="bg-card border border-border p-5 animate-enter">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4">Quick Schedule</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Jump directly into the appointment wizard to select a department, date, and time.
            </p>
            <Link to="/book" className="block text-center w-full bg-foreground text-background py-3 text-sm font-semibold hover:opacity-90">
              FIND SLOTS
            </Link>
          </div>

          <div className="bg-card border border-border p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary text-sm">98%</div>
              <div className="text-xs font-medium leading-tight">
                Patient satisfaction score across 14,000 procedures.
              </div>
            </div>
            <blockquote className="text-[11px] italic text-muted-foreground border-l-2 border-primary pl-4">
              "The care at MH Hospital is precise and efficient. The digital portal made my recovery tracking effortless."
              <cite className="block mt-2 font-mono not-italic uppercase tracking-tighter text-[9px]">— Michael R.</cite>
            </blockquote>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
