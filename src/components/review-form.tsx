import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { submitReview } from "@/lib/reviews.functions";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export function ReviewForm() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [relation, setRelation] = useState("");
  const [quote, setQuote] = useState("");
  const submit = useServerFn(submitReview);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s?.user));
    return () => sub.subscription.unsubscribe();
  }, []);

  const m = useMutation({
    mutationFn: () => submit({ data: { displayName, relation, rating, quote } }),
    onSuccess: () => {
      toast.success("Thanks! Your review is pending approval.");
      setDisplayName(""); setRelation(""); setQuote(""); setRating(5);
    },
    onError: (e: Error) => toast.error(e.message || "Could not submit review"),
  });

  if (authed === false) {
    return (
      <div className="mt-12 border border-border bg-background p-8 lg:p-10">
        <div className="text-kicker mb-3">Leave a review</div>
        <p className="font-mono text-lg tracking-tight mb-4">Sign in to share your experience with MH Hospital.</p>
        <Link to="/auth" className="inline-block bg-primary text-primary-foreground px-5 py-3 font-mono text-xs uppercase tracking-widest hover:opacity-90">
          Sign in to leave a review →
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); m.mutate(); }}
      className="mt-12 border border-border bg-background p-8 lg:p-10 grid gap-5"
    >
      <div>
        <div className="text-kicker mb-3">Leave a review</div>
        <h3 className="font-mono font-bold text-2xl tracking-tight">Tell us how we did.</h3>
      </div>

      <div>
        <label className="mono-label block mb-2">Rating</label>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1,2,3,4,5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} star${n>1?"s":""}`}
              className={`text-3xl leading-none transition-colors ${(hover || rating) >= n ? "text-primary" : "text-muted-foreground/40"}`}
            >★</button>
          ))}
          <span className="ml-3 font-mono text-xs self-center text-muted-foreground">{rating}/5</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="rv-name" className="mono-label block mb-2">Display name</label>
          <input
            id="rv-name" required maxLength={80} value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full border border-border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
            placeholder="Meera R."
          />
        </div>
        <div>
          <label htmlFor="rv-rel" className="mono-label block mb-2">Relation (optional)</label>
          <input
            id="rv-rel" maxLength={80} value={relation}
            onChange={(e) => setRelation(e.target.value)}
            className="w-full border border-border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
            placeholder="Cardiology patient"
          />
        </div>
      </div>

      <div>
        <label htmlFor="rv-q" className="mono-label block mb-2">Your review</label>
        <textarea
          id="rv-q" required minLength={10} maxLength={600} rows={4} value={quote}
          onChange={(e) => setQuote(e.target.value)}
          className="w-full border border-border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary resize-y"
          placeholder="Share your experience with our care team..."
        />
        <div className="mt-1 font-mono text-[10px] text-muted-foreground">{quote.length}/600</div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <button
          type="submit" disabled={m.isPending}
          className="bg-primary text-primary-foreground px-6 py-3 font-mono text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50"
        >
          {m.isPending ? "Submitting..." : "Submit review →"}
        </button>
        <span className="font-mono text-[11px] text-muted-foreground">Reviews appear after admin approval.</span>
      </div>
    </form>
  );
}
