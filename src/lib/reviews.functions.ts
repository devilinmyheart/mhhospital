import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const submitSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  relation: z.string().trim().max(80).optional().or(z.literal("")),
  rating: z.number().int().min(1).max(5),
  quote: z.string().trim().min(10).max(600),
});

export const submitReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => submitSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("reviews").insert({
      user_id: userId,
      display_name: data.displayName,
      relation: data.relation || null,
      rating: data.rating,
      quote: data.quote,
      approved: false,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
