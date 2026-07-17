import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitContactMessage } from "@/lib/contact.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — MH Hospital" },
      { name: "description", content: "Contact MH Hospital: location, phone, hours, 24/7 emergency line, and a message form." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const submit = useServerFn(submitContactMessage);
  const mountedAt = useMemo(() => Date.now(), []);
  const formToken = useMemo(() => crypto.randomUUID(), []);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      await submit({
        data: {
          name,
          email,
          phone,
          subject,
          message,
          website,
          elapsedMs: Date.now() - mountedAt,
          formToken,
        },
      });
      setSent(true);
      setName(""); setEmail(""); setPhone(""); setSubject(""); setMessage("");
      toast.success("Message received. We'll be in touch shortly.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send message.");
    } finally {
      setSending(false);
    }
  };

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

        <section className="bg-card border border-border p-6 md:p-8" aria-labelledby="contact-form-title">
          <div className="mono-label mb-2">SEND / MESSAGE</div>
          <h2 id="contact-form-title" className="text-2xl font-bold tracking-tight mb-1">Write to us</h2>
          <p className="text-sm text-muted-foreground mb-6">Non-urgent enquiries only. For emergencies, call the line above.</p>

          {sent ? (
            <div className="border border-success/40 bg-success/10 text-success p-4 text-sm">
              Message received. Our team will reply within one working day.
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4" noValidate>
            <div className="md:col-span-1">
              <label htmlFor="c-name" className="mono-label block mb-1">NAME</label>
              <input
                id="c-name" type="text" required maxLength={120}
                value={name} onChange={(e) => setName(e.target.value)}
                className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                autoComplete="name"
              />
            </div>
            <div className="md:col-span-1">
              <label htmlFor="c-email" className="mono-label block mb-1">EMAIL</label>
              <input
                id="c-email" type="email" required maxLength={254}
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                autoComplete="email"
              />
            </div>
            <div className="md:col-span-1">
              <label htmlFor="c-phone" className="mono-label block mb-1">PHONE (OPTIONAL)</label>
              <input
                id="c-phone" type="tel" maxLength={40}
                value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                autoComplete="tel"
              />
            </div>
            <div className="md:col-span-1">
              <label htmlFor="c-subject" className="mono-label block mb-1">SUBJECT</label>
              <input
                id="c-subject" type="text" required maxLength={200}
                value={subject} onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="c-message" className="mono-label block mb-1">MESSAGE</label>
              <textarea
                id="c-message" required minLength={10} maxLength={4000} rows={6}
                value={message} onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
              />
              <div className="text-xs text-muted-foreground mt-1 font-mono">{message.length}/4000</div>
            </div>

            {/* Honeypot: visually hidden, bots fill it */}
            <div aria-hidden="true" className="hidden">
              <label htmlFor="c-website">Website</label>
              <input
                id="c-website" type="text" tabIndex={-1} autoComplete="off"
                value={website} onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-between gap-4 pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">By submitting, you agree to be contacted about your enquiry.</p>
              <button
                type="submit" disabled={sending}
                className="bg-primary text-primary-foreground px-5 py-2.5 text-sm font-mono uppercase tracking-wider hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sending ? "SENDING…" : "SEND MESSAGE"}
              </button>
            </div>
          </form>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
