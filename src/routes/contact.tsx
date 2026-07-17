import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — MH Hospital" },
      { name: "description", content: "Contact MH Hospital: location, phone, hours, and 24/7 emergency line." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
        <div className="animate-enter">
          <div className="mono-label mb-2">CONTACT / MH_HOSPITAL</div>
          <h1 className="text-3xl font-bold tracking-tight">Get in touch</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border p-6">
            <div className="mono-label mb-3">LOCATION</div>
            <p className="text-sm">Sikarpur Road, Sinduria chauraha s 100m aage<br />District Maharajganj 273303<br />India</p>
          </div>
          <div className="bg-card border border-border p-6">
            <div className="mono-label mb-3">HOURS</div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span>Mon – Fri</span><span className="font-mono">08:00 – 21:00</span></div>
              <div className="flex justify-between"><span>Sat – Sun</span><span className="font-mono">10:00 – 18:00</span></div>
              <div className="flex justify-between text-success pt-2 border-t border-border mt-2"><span>Emergency Room</span><span className="font-mono">24/7</span></div>
            </div>
          </div>
          <div className="bg-emergency text-emergency-foreground p-6">
            <div className="mono-label mb-3 text-emergency-foreground/80">EMERGENCY LINE</div>
            <a href="tel:+917905932721" className="text-2xl font-bold font-mono underline-offset-4 hover:underline">+91 7905932721</a>
            <p className="text-xs opacity-90 mt-2">24-hour urgent medical assistance. Tap to call.</p>
          </div>
          <div className="bg-card border border-border p-6">
            <div className="mono-label mb-3">GENERAL</div>
            <div className="text-sm space-y-2">
              <div>Mobile: <a href="tel:+917905932721" className="font-mono text-primary underline-offset-4 hover:underline">+91 7905932721</a></div>
              <div>Records: <a href="mailto:records@mh-hospital.dev" className="font-mono text-primary underline-offset-4 hover:underline">records@mh-hospital.dev</a></div>
              <div>Billing: <a href="mailto:billing@mh-hospital.dev" className="font-mono text-primary underline-offset-4 hover:underline">billing@mh-hospital.dev</a></div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
