import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listDepartments, listDoctors, listApprovedReviews } from "@/lib/public.functions";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { ReviewForm } from "@/components/review-form";
import heroClinic from "@/assets/hero-clinic.jpg";


const deptQO = queryOptions({ queryKey: ["departments"], queryFn: () => listDepartments() });
const docsQO = queryOptions({ queryKey: ["doctors"], queryFn: () => listDoctors({ data: {} }) });
const reviewsQO = queryOptions({ queryKey: ["reviews", "approved"], queryFn: () => listApprovedReviews() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MH Hospital — Advanced Medical Care & Online Consultation in Maharajganj" },
      { name: "description", content: "MH Hospital in Sinduria, Maharajganj: book in-person visits, video consultations, and access medical records. 24/7 emergency care." },
      { property: "og:title", content: "MH Hospital — Advanced Medical Care & Online Consultation" },
      { property: "og:description", content: "Book in-person visits, launch video consultations, and access your medical records at MH Hospital." },
      { property: "og:url", content: "https://mhhospital.lovable.app/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://mhhospital.lovable.app/" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Hospital",
        name: "MH Hospital",
        url: "https://mhhospital.lovable.app/",
        telephone: "+91-7905932721",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Sikarpur Road, Sinduria Chauraha (100m aage)",
          addressLocality: "Maharajganj",
          postalCode: "273303",
          addressRegion: "Uttar Pradesh",
          addressCountry: "IN",
        },
        medicalSpecialty: ["Cardiology", "Neurology", "Pediatrics", "General Medicine", "Emergency"],
        openingHours: "Mo-Su 00:00-23:59",
      }),
    }],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(deptQO);
    context.queryClient.ensureQueryData(docsQO);
    context.queryClient.ensureQueryData(reviewsQO);
  },
  component: Home,
});


const FALLBACK_REVIEWS = [
  { id: "f1", display_name: "Meera R.", relation: "Cardiology patient", rating: 5, quote: "The care at MH is precise and unhurried. The portal made following up after surgery feel easy — and human." },
  { id: "f2", display_name: "Arjun S.", relation: "General medicine", rating: 5, quote: "Booked a video consultation at 10pm — saw the doctor the next morning. Prescription reached my pharmacy before I did." },
  { id: "f3", display_name: "Priya K.", relation: "Family of ER patient", rating: 5, quote: "The ER team was calm and quick when we brought my father in at 2am. We felt looked after every step of the way." },
];

function Home() {
  const { data: departments } = useSuspenseQuery(deptQO);
  const { data: doctors } = useSuspenseQuery(docsQO);
  const { data: reviewsData } = useSuspenseQuery(reviewsQO);
  const reviews = reviewsData.length > 0 ? reviewsData : FALLBACK_REVIEWS;
  const featuredDoctors = doctors.slice(0, 4);
  const editorPick = featuredDoctors[0];
  const supporting = featuredDoctors.slice(1, 4);


  const tickerItems = [
    "Now booking video consultations",
    "24/7 Emergency",
    "Cardiology · Orthopaedics · Paediatrics",
    "Same-day appointments available",
    "ER: +91 7905 932 721",
    "Serving Maharajganj since 2010",
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* HERO — editorial split */}
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-10 lg:pt-16 pb-14 lg:pb-20 grid grid-cols-12 gap-6 lg:gap-10 items-end">
          <div className="col-span-12 lg:col-span-7 animate-enter">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-kicker">{"\n"}</span>
              <span className="editorial-rule flex-1 max-w-24" />
              <span className="text-kicker !text-muted-foreground">Care Division</span>
            </div>
            <h1 className="font-mono font-bold tracking-[-0.03em] leading-[0.92] text-[52px] sm:text-[72px] lg:text-[104px]">
              Care for your <br />
              loved one,<br />
              on your&nbsp;
              <span className="italic font-normal text-primary">schedule</span>
            </h1>
            <p className="mt-8 text-base lg:text-lg text-muted-foreground max-w-xl leading-relaxed">
              Book in-person visits, launch video consultations, and access your medical records — from a single patient portal built for Maharajganj.
            </p>
            <div className="mt-10 flex flex-wrap gap-3 items-center">
              <Link to="/book" className="group inline-flex items-center gap-3 bg-foreground text-background px-6 py-4 font-mono text-[12px] tracking-[0.2em] uppercase hover:bg-primary transition-colors">
                Book appointment
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link to="/physicians" className="inline-flex items-center gap-3 border border-border px-6 py-4 font-mono text-[12px] tracking-[0.2em] uppercase hover:border-foreground transition-colors">
                MEET DOCTORS
              </Link>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5 relative animate-enter">
            <div className="relative aspect-[4/5] overflow-hidden bg-muted">
              <img
                src={heroClinic}
                alt="Sunlit hospital corridor at MH Hospital"
                width={1600}
                height={1200}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/70 to-transparent h-1/3" />
              <div className="absolute top-4 left-4 right-4 flex justify-between text-[10px] font-mono uppercase tracking-widest text-background/90 mix-blend-difference">
                <span>PLATE 01</span>
                <span>MH·MRJ</span>
              </div>
              <div className="absolute bottom-6 left-6 right-6 text-background">
                <div className="text-kicker !text-primary mb-2">Emergency line</div>
                <div className="font-mono text-2xl lg:text-3xl font-bold tracking-tight">
                  +91 7905 932 721
                </div>
                <div className="text-[11px] font-mono uppercase tracking-widest opacity-80 mt-1">
                  Always open · Always answered
                </div>
              </div>
            </div>
            <div className="absolute -left-3 -top-3 hidden lg:flex flex-col items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground rotate-180" style={{ writingMode: "vertical-rl" }}>
              <span>MH Hospital · Maharajganj · Est. 2010</span>
            </div>
          </div>
        </div>

        {/* Ticker */}
        <div className="border-t border-border bg-muted overflow-hidden">
          <div className="flex ticker-track whitespace-nowrap py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-foreground/70">
            {[...tickerItems, ...tickerItems].map((t, i) => (
              <span key={i} className="flex items-center gap-6 px-6">
                <span className="size-1 bg-primary rounded-full" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* DEPARTMENTS — magazine grid */}
        <section className="py-20 lg:py-28">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <div>
              <div className="text-kicker mb-3">DEPARTMENTS</div>
              <h2 className="font-mono font-bold text-4xl md:text-5xl tracking-tight leading-none">
                Where we<br />look after you.
              </h2>
            </div>
            <Link to="/departments" className="font-mono text-[11px] uppercase tracking-[0.2em] border-b border-foreground pb-1 hover:text-primary hover:border-primary">
              All departments →
            </Link>
          </div>
          <div className="editorial-rule mb-10" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {departments.slice(0, 6).map((dept, i) => (
              <Link
                key={dept.id}
                to="/departments"
                search={{ id: dept.id }}
                className="bg-background p-8 lg:p-10 hover:bg-muted transition-colors group"
              >
                <div className="font-mono text-[10px] text-muted-foreground mb-6 uppercase tracking-widest">
                  DEPT 0{i + 1}
                </div>
                <h3 className="font-mono font-bold text-xl lg:text-2xl tracking-tight mb-4 group-hover:text-primary transition-colors">
                  {dept.name}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {dept.description}
                </p>
              </Link>
            ))}
          </div>
        </section>


        {/* HOW IT WORKS */}
        <section className="pb-20 lg:pb-28">
          <div className="text-kicker mb-3">METHOD</div>
          <h2 className="font-mono font-bold text-4xl md:text-5xl tracking-tight leading-none mb-12">
            Three steps.<br />No paperwork.
          </h2>
          <div className="editorial-rule mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
            {[
              { n: "01", t: "Choose", d: "Pick a department, a physician, and a time that fits your day." },
              { n: "02", t: "Confirm", d: "Get an instant confirmation with reminders 24 hours before your visit." },
              { n: "03", t: "Consult", d: "Walk in, or launch an encrypted video room right from your portal." },
            ].map((s) => (
              <div key={s.n} className="bg-background p-10">
                <div className="font-mono text-primary text-6xl font-bold mb-8">{s.n}</div>
                <h3 className="font-mono font-bold text-2xl tracking-tight mb-3">{s.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* STATS BAND */}
      <section className="bg-muted border-y border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { n: "140K+", l: "Patients treated" },
              { n: "24", l: "Consultant physicians" },
              { n: "08", l: "Clinical specialties" },
              { n: "14m", l: "Avg. ER wait time" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-mono font-bold text-5xl md:text-6xl tracking-tighter text-foreground leading-none">
                  {s.n}
                </div>
                <div className="editorial-rule my-4 !max-w-12" />
                <div className="text-kicker !text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-20 lg:py-28">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <div className="text-kicker mb-3">04 — PATIENT REVIEWS</div>
            <h2 className="font-mono font-bold text-4xl md:text-5xl tracking-tight leading-none">
              What patients<br />say about us.
            </h2>
          </div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            ★★★★★ · Verified feedback
          </div>
        </div>
        <div className="editorial-rule mb-10" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
          {reviews.map((r) => (
            <figure key={r.id} className="bg-background p-8 lg:p-10 flex flex-col">
              <div className="font-mono text-primary text-6xl leading-none mb-2">"</div>
              <div className="mb-4 text-primary font-mono text-sm tracking-widest" aria-label={`${r.rating} out of 5 stars`}>
                {"★".repeat(r.rating)}<span className="text-muted-foreground/40">{"★".repeat(5 - r.rating)}</span>
              </div>
              <blockquote className="font-mono text-lg lg:text-xl tracking-tight leading-snug text-foreground flex-1">
                {r.quote}
              </blockquote>
              <figcaption className="mt-8 pt-6 border-t border-border">
                <div className="font-mono font-bold text-sm">{r.display_name}</div>
                {r.relation && <div className="text-kicker !text-muted-foreground mt-1">{r.relation}</div>}
              </figcaption>
            </figure>
          ))}
        </div>
        <ReviewForm />
      </section>


      {/* CTA */}
      <section className="bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16 lg:py-20 grid grid-cols-12 gap-6 items-center">
          <div className="col-span-12 md:col-span-8">
            <div className="text-kicker mb-4">Need urgent care?</div>
            <h2 className="font-mono font-bold text-4xl md:text-6xl tracking-tight leading-[0.95]">
              Call our ER. <span className="text-primary">Anytime.</span>
            </h2>
          </div>
          <div className="col-span-12 md:col-span-4 md:text-right">
            <a href="tel:+917905932721" className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-6 py-5 font-mono text-lg font-bold tracking-tight hover:bg-background hover:text-foreground transition-colors">
              +91 7905 932 721 →
            </a>
            <div className="mt-4 text-[10px] font-mono uppercase tracking-[0.2em] opacity-60">
              24 hours · 7 days
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
