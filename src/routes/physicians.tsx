import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listDepartments, listDoctors } from "@/lib/public.functions";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { z } from "zod";

const searchSchema = z.object({ dept: z.string().optional() });

const deptQO = queryOptions({ queryKey: ["departments"], queryFn: () => listDepartments() });
const docsQO = queryOptions({ queryKey: ["doctors", "all"], queryFn: () => listDoctors({ data: {} }) });

export const Route = createFileRoute("/physicians")({
  head: () => ({
    meta: [
      { title: "Physicians — MH Hospital" },
      { name: "description", content: "Browse our physicians and book with a specialist that fits your needs." },
      { property: "og:title", content: "Find a Doctor — MH Hospital" },
      { property: "og:description", content: "Meet our specialists and book an appointment that fits your needs." },
      { property: "og:url", content: "https://mhhospital.lovable.app/physicians" },
    ],
    links: [{ rel: "canonical", href: "https://mhhospital.lovable.app/physicians" }],
  }),
  validateSearch: searchSchema,
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(deptQO);
    context.queryClient.ensureQueryData(docsQO);
  },
  component: Physicians,
});

function Physicians() {
  const { dept } = Route.useSearch();
  const { data: departments } = useSuspenseQuery(deptQO);
  const { data: doctors } = useSuspenseQuery(docsQO);
  const filtered = dept
    ? doctors.filter((d: any) => d.departments?.slug === dept)
    : doctors;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="mb-8 animate-enter">
          <div className="mono-label mb-2">DIRECTORY / PHYSICIANS</div>
          <h1 className="text-3xl font-bold tracking-tight">Find a Physician</h1>
          <p className="text-muted-foreground text-sm mt-2">
            {filtered.length} specialist{filtered.length === 1 ? "" : "s"} available.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            to="/physicians"
            className={`text-[11px] font-mono px-3 py-1.5 border ${!dept ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}
          >
            ALL
          </Link>
          {departments.map((d) => (
            <Link
              key={d.id}
              to="/physicians"
              search={{ dept: d.slug }}
              className={`text-[11px] font-mono px-3 py-1.5 border ${dept === d.slug ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}
            >
              {d.name.toUpperCase()}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc: any) => (
            <div key={doc.id} className="bg-card border border-border p-5 flex flex-col">
              <div className="flex items-start gap-4 mb-4">
                <div className="size-14 bg-muted grid place-items-center border border-border font-mono text-lg text-muted-foreground shrink-0">
                  {doc.full_name.split(" ").map((s: string) => s[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{doc.full_name}</div>
                  <div className="text-xs text-muted-foreground">{doc.title}</div>
                  <div className="mono-label mt-1">{doc.departments?.name}</div>
                </div>
              </div>
              {doc.bio && <p className="text-xs text-muted-foreground mb-4 line-clamp-3">{doc.bio}</p>}
              <div className="mt-auto flex gap-2">
                <span className="text-[10px] font-mono bg-success/10 text-success px-2 py-1 rounded uppercase">Available</span>
                <Link
                  to="/book"
                  search={{ doctor: doc.id } as any}
                  className="ml-auto text-[11px] font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-sm hover:opacity-90"
                >
                  BOOK →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
