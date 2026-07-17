import { Link, useRouterState } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import type { ReactNode } from "react";

const patientNav = [
  { to: "/portal", label: "OVERVIEW" },
  { to: "/portal/appointments", label: "APPOINTMENTS" },
  { to: "/portal/prescriptions", label: "PRESCRIPTIONS" },
  { to: "/portal/reports", label: "REPORTS" },
];
const doctorNav = [
  { to: "/doctor", label: "SCHEDULE" },
  { to: "/doctor/appointments", label: "APPOINTMENTS" },
];
const adminNav = [
  { to: "/admin", label: "OVERVIEW" },
  { to: "/admin/doctors", label: "DOCTORS" },
];

export function PortalShell({ scope, children }: { scope: "patient" | "doctor" | "admin"; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const nav = scope === "patient" ? patientNav : scope === "doctor" ? doctorNav : adminNav;
  const scopeLabel = scope === "patient" ? "PATIENT_PORTAL" : scope === "doctor" ? "DOCTOR_PORTAL" : "ADMIN_CONSOLE";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 flex items-center gap-1 overflow-x-auto">
          <div className="mono-label mr-4 py-3 shrink-0">{scopeLabel}</div>
          {nav.map((n) => {
            const active = pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`text-[11px] font-mono px-3 py-3 border-b-2 transition-colors ${
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </div>
      </div>
      <main className="max-w-7xl mx-auto p-4 lg:p-6">{children}</main>
      <SiteFooter />
    </div>
  );
}
