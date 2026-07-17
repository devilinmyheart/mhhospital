## Fix hero overflow on mid-desktop widths

The problem: at viewports around 900–1100px (like the user's 995px preview), the huge monospace headline "schedule" bleeds under the corridor image because the h1 font size jumps to the `lg:` value (104px) as soon as the layout also switches to a 7/5 side-by-side grid. The italic "schedule" word alone is wider than the 7-column text track at that width, so it slides into the image column.

### Changes (single file: `src/routes/index.tsx`)

1. **Delay the side-by-side layout until it actually fits.** Change the hero grid from `lg:col-span-7 / lg:col-span-5` to trigger at `xl:` instead of `lg:`. Between `lg` and `xl` the two blocks stack cleanly and the image sits below the headline — no overlap.

2. **Retune the headline scale** so it never exceeds its column:
   - `text-[44px] sm:text-[64px] lg:text-[84px] xl:text-[96px]`
   - Add `break-words` and `min-w-0` on the text column so the italic word can't push the column wider than its grid track.

3. **Increase the grid gap** at the split breakpoint (`xl:gap-12`) so even at the narrowest side-by-side width there's a safety margin between text and image.

4. No changes to copy, image, colors, or any other section — purely responsive fitment on the hero.

### Why not just shrink the font

Shrinking alone would make the headline look weak on true desktop (≥1280px). Gating the split layout at `xl` keeps the dramatic 96px headline at wide widths and stacks safely on laptops.
