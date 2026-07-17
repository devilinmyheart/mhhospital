import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mono-label mb-4">ERR_404</div>
        <h1 className="text-6xl font-bold tracking-tight text-foreground">Not found</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mono-label mb-4 text-emergency">SYSTEM_ERROR</div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We couldn't load this page. Try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-sm border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MH Hospital — Advanced Medical Care & Online Consultation" },
      {
        name: "description",
        content:
          "Book appointments, consult doctors online, and manage your medical records at MH Hospital. 24/7 emergency care and specialists across 8+ departments.",
      },
      { property: "og:title", content: "MH Hospital — Advanced Medical Care & Online Consultation" },
      {
        property: "og:description",
        content:
          "Book appointments, consult doctors online, and manage your medical records at MH Hospital. 24/7 emergency care and specialists across 8+ departments.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "MH Hospital — Advanced Medical Care & Online Consultation" },
      { name: "twitter:description", content: "Book appointments, consult doctors online, and manage your medical records at MH Hospital. 24/7 emergency care and specialists across 8+ departments." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/358ceb7f-653c-40df-918a-2bae247e1039/id-preview-68504a32--dcf06839-2a39-4343-90d5-bfdd4e05756f.lovable.app-1784259133632.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/358ceb7f-653c-40df-918a-2bae247e1039/id-preview-68504a32--dcf06839-2a39-4343-90d5-bfdd4e05756f.lovable.app-1784259133632.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
