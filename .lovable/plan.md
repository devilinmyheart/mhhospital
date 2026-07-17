## Redesign direction

- **Palette**: Cloud White base (`#fafbfc` / `#e8ecf1`), deep navy ink (`#0c2340`), coral accent (`#ff6b6b`) reserved for emergency + primary CTAs.
- **Type**: JetBrains Mono for headings, labels, and numeric data (keeps the operational-dashboard DNA). Work Sans for body/long-form.
- **Layout**: Magazine — a large featured hero with editorial typography, followed by a structured grid of departments, physicians, stats, and stories.
- **Visual richness: 3/5** — refined, not cinematic. Light textures, one hero image, tasteful motion.

## Homepage (`src/routes/index.tsx`) rebuild

Sections, top to bottom:

1. **Editorial hero (featured story style)**
   - Left column: kicker label ("ISSUE 01 · CARE DIVISION"), oversized mixed serif-feel heading using JetBrains Mono weight play ("Care, on your schedule."), lead paragraph, primary coral CTA "Book appointment" + ghost "Meet the physicians".
   - Right column: generated hero image (calm clinical portrait), floating stat card overlay ("24/7 ER · 7905932721") and a mono-label caption strip.
2. **Ticker strip**: horizontal marquee of departments / ER number / "Now accepting video visits" in mono caps on a light band.
3. **Departments grid (magazine cards)**: 6 department tiles, numbered `01–06`, hover reveals coral underline + arrow. Mono numerals, Work Sans description.
4. **Featured physicians**: asymmetric grid — one large "Editor's pick" card (Dr. Khurshid Alam) + 3 smaller cards. Each with generated portrait, specialty tag, "Book" link.
5. **How it works** (3-step editorial): "Choose · Confirm · Consult" with mono step numbers and thin dividers.
6. **Stats band**: 4 numeric stats (patients, physicians, specialties, avg. wait) in giant mono figures on the light-gray band.
7. **Pull-quote / patient story**: single large blockquote with coral quote mark.
8. **CTA footer band**: "Need urgent care? Call +91 7905932721" with coral background.

Motion: subtle `fade-in`/`slide-in` on scroll (using existing tailwind animations), hover lift on cards, marquee ticker. No heavy parallax.

## Design tokens (`src/styles.css`)

- Update semantic tokens: `--background` `#fafbfc`, `--foreground` `#0c2340`, `--muted` `#e8ecf1`, `--primary` coral `#ff6b6b` with navy `--primary-foreground`, `--accent` navy, `--border` soft gray.
- Add `--gradient-editorial` (subtle navy→transparent), `--shadow-editorial` (soft, low), `--color-coral`, `--color-ink`.
- Keep JetBrains Mono / Work Sans font tokens (already loaded in root head).
- Add a `.text-kicker` utility (mono, uppercase, tracked) and `.editorial-rule` (thin navy divider) via `@utility`.

## Shared components

- **`SiteHeader`**: lighten background to Cloud White, ink text, coral ER pill, mono nav labels, thin bottom rule. Keep address/ER content unchanged.
- **`EmergencyRibbon`**: slimmer, coral left border on white instead of solid red block; mono uppercase text.
- **`SiteFooter`**: three-column editorial footer with mono column titles and a large wordmark.
- **New**: `components/marquee-ticker.tsx`, `components/editorial-card.tsx`, `components/stat-figure.tsx`, `components/section-heading.tsx` (kicker + big title + rule).

## Other public routes (light polish, no logic changes)

- `physicians.tsx`, `book.tsx`, `contact.tsx`, `departments/*` inherit new tokens automatically; add `SectionHeading` at top of each and swap card chrome to the editorial style. No behavior/schema changes.

## Assets

- Generate 2 images with `imagegen`:
  1. `src/assets/hero-clinic.jpg` — bright, airy clinical corridor / clinician portrait, cloud white + navy palette.
  2. `src/assets/editorial-story.jpg` — patient-and-doctor moment for the pull-quote section.
- Physician portraits: reuse existing avatars; if missing, use a soft mono initial tile.

## Out of scope

- No changes to auth, portals, RLS, server functions, database, or booking logic.
- No new dependencies.
- Email/notifications untouched.

## Verification

- `bun run build` clean.
- Visit `/` in preview, screenshot at 1280×1800 to confirm hero, grid, stats, and CTA bands render as intended and coral is only on CTAs + ER.
