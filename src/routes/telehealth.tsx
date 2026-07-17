import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/telehealth")({
  head: () => ({
    meta: [
      { title: "Preparing for your virtual visit — MH Online Quick Care" },
      { name: "description", content: "A patient guide to online doctor consultations at MH Hospital: what to expect, technical requirements, and which conditions are suitable for a video visit." },
      { property: "og:title", content: "Preparing for your virtual visit — MH Online Quick Care" },
      { property: "og:description", content: "What to expect from a video consultation with MH Hospital, technical requirements, and which conditions we treat online." },
      { property: "og:url", content: "https://mhhospital.lovable.app/telehealth" },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: "https://mhhospital.lovable.app/telehealth" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "MedicalWebPage",
        name: "Preparing for your virtual visit — MH Online Quick Care",
        about: "Online doctor consultation and telehealth at MH Hospital",
        url: "https://mhhospital.lovable.app/telehealth",
      }),
    }],
  }),
  component: Telehealth,
});

function Telehealth() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="max-w-3xl mx-auto p-4 lg:p-6 space-y-8">
        <header className="animate-enter">
          <div className="mono-label mb-2">GUIDE / ONLINE_QUICK_CARE</div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Preparing for your virtual visit: what to expect from MH Online Quick Care
          </h1>
          <p className="mt-4 text-muted-foreground">
            Video consultations let you see an MH Hospital doctor from home for routine care, follow-ups, and
            second opinions — often on the same day. This guide walks through what to expect, how to prepare, and
            which conditions are a good fit for an online visit.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">What is an online doctor consultation?</h2>
          <p className="text-sm text-muted-foreground">
            An online consultation is a scheduled, private video call with a licensed MH Hospital physician. You
            join from your phone or laptop through the patient portal. The doctor can review your history, discuss
            symptoms, prescribe medication, order lab tests, and refer you for an in-person visit if needed.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Conditions suitable for a video visit</h2>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>Cold, cough, sore throat, and seasonal flu</li>
            <li>Skin concerns — rashes, acne, minor infections</li>
            <li>Follow-ups for chronic conditions (diabetes, hypertension, thyroid)</li>
            <li>Medication reviews and refills</li>
            <li>Post-surgery check-ins</li>
            <li>Mental health, stress, and sleep concerns</li>
            <li>Second opinions on lab reports or imaging</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Emergencies — chest pain, severe bleeding, breathing difficulty, stroke symptoms — always need
            in-person care. Call our 24/7 ER line at <a className="underline" href="tel:+917905932721">+91 7905932721</a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Technical requirements</h2>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>A phone, tablet, or laptop with a working camera and microphone</li>
            <li>A stable internet connection (Wi-Fi or 4G/5G)</li>
            <li>A modern browser — Chrome, Safari, Edge, or Firefox</li>
            <li>An MH Hospital patient account — <Link to="/auth" className="underline">create one here</Link></li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Before your appointment</h2>
          <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1">
            <li>Find a quiet, well-lit room where you can speak freely.</li>
            <li>Keep a list of your current medications, allergies, and recent test reports handy.</li>
            <li>Note your main symptoms — when they started, what makes them better or worse.</li>
            <li>Join the call from your patient portal 2–3 minutes early.</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Privacy and your records</h2>
          <p className="text-sm text-muted-foreground">
            Video sessions are private and one-to-one between you and your doctor. Prescriptions, notes, and
            follow-up instructions are saved to your portal so you can access them anytime.
          </p>
        </section>

        <div className="pt-2">
          <Link
            to="/book"
            search={{ mode: "video" }}
            className="inline-flex items-center justify-center rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Book a video consultation
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
