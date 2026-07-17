## Truly fix hero headline overflow

The stacked layout helped, but at ~995px the italic word "schedule" alone still overruns the viewport because the h1 uses `lg:text-[84px]` — a single 84px monospace word is ~640px wide and the "e" wraps to its own line, which looks broken.

### Root cause
The font sizes are hardcoded pixel values that don't scale with viewport width. On a narrow laptop the `lg:` breakpoint fires but the container is still only ~960px wide.

### Fix (single file: `src/routes/index.tsx`)

1. **Replace fixed h1 sizes with a fluid `clamp()`** so the headline always fits its column:
   ```
   style={{ fontSize: "clamp(2.25rem, 8.5vw, 6.5rem)" }}
   ```
   Remove the `text-[..]` classes for the h1. This scales smoothly from ~36px on phones to 104px on wide desktops with no dead zone in the middle.

2. **Prevent single-word overflow** by adding `[word-break:break-word] hyphens-none` and `max-w-full` on the h1, so even if a word is very wide it wraps cleanly inside the column instead of bleeding past.

3. **Tighten the italic word specifically** — wrap "schedule" in a span with `inline-block max-w-full` and a slightly smaller relative size (`text-[0.9em]`) so the italic (which is optically wider than the roman) never becomes the widest element.

4. **Remove the forced side-by-side split at `xl`** and keep the image column stacked below the text until `xl` — no change from last turn, already correct.

No copy changes, no color/layout changes elsewhere.
