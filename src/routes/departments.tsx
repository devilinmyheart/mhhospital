import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listDepartments } from "@/lib/public.functions";
import { SiteHeader, SiteFooter } from "@/components/site-header";

const qo = queryOptions({ queryKey: ["departments"], queryFn: () => listDepartments() });

export const Route = createFileRoute("/departments")({
  head: () => ({
    meta: [
      { title: "Departments — MH Hospital" },
      { name: "description", content: "Browse specialized clinical departments at MH Hospital." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  component: Departments,
});

function Departments() {
  const { data } = useSuspenseQuery(qo);
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="mb-8 animate-enter">
          <div className="mono-label mb-2">DIRECTORY / DEPARTMENTS</div>
          <h1 className="text-3xl font-bold tracking-tight">Clinical Departments</h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-xl">
            Specialized care across every discipline. Select a department to see its physicians and book an appointment.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
          {data.map((d) => (
            <Link
              key={d.id}
              to="/physicians"
              search={{ dept: d.slug } as any}
              className="bg-card p-6 hover:bg-accent transition-colors group"
            >
              <div className="mono-label mb-4">{d.code}</div>
              <div className="text-lg font-semibold group-hover:text-primary mb-1">{d.name}</div>
              <div className="text-xs text-muted-foreground">{d.description}</div>
              <div className="mt-4 text-[11px] font-mono text-primary uppercase">View physicians →</div>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
