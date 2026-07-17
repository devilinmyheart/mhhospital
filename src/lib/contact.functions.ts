import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(10).max(4000),
  // Spam protection
  website: z.string().max(0), // honeypot: must be empty
  elapsedMs: z.number().int().nonnegative(),
  formToken: z.string().min(8),
});

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => contactSchema.parse(input))
  .handler(async ({ data }) => {
    // Spam checks: honeypot filled or form submitted too fast (<3s)
    if (data.website && data.website.length > 0) {
      return { ok: true as const };
    }
    if (data.elapsedMs < 3000) {
      return { ok: true as const };
    }

    // Basic content spam heuristic: too many URLs
    const urlCount = (data.message.match(/https?:\/\//gi) ?? []).length;
    if (urlCount > 3) {
      return { ok: true as const };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      subject: data.subject,
      message: data.message,
    });

    if (error) {
      console.error("contact insert failed", error);
      throw new Error("Could not send your message. Please try again shortly.");
    }

    return { ok: true as const };
  });
