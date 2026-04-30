import { createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AppShell } from "../components/AppShell";

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl">404</h1>
        <p className="mt-2 text-muted-foreground">Página no encontrada.</p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PWR.TRACKER — Powerlifting progress tracker" },
      { name: "description", content: "Track your Squat, Bench and Deadlift progress with a clean, fast powerlifting tracker. Plate calculator, 1RM estimates and history included." },
      { name: "theme-color", content: "#c581ff" },
      { property: "og:title", content: "PWR.TRACKER — Powerlifting progress tracker" },
      { property: "og:description", content: "Track your Squat, Bench and Deadlift progress with a clean, fast powerlifting tracker. Plate calculator, 1RM estimates and history included." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "PWR.TRACKER — Powerlifting progress tracker" },
      { name: "twitter:description", content: "Track your Squat, Bench and Deadlift progress with a clean, fast powerlifting tracker. Plate calculator, 1RM estimates and history included." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/366264bf-f2a3-45cf-b083-ae6cd3046e1f/id-preview-e39a4aeb--e8283196-4ceb-4865-825c-683b27c0b7c4.lovable.app-1777547502195.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/366264bf-f2a3-45cf-b083-ae6cd3046e1f/id-preview-e39a4aeb--e8283196-4ceb-4865-825c-683b27c0b7c4.lovable.app-1777547502195.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: AppShell,
  notFoundComponent: NotFound,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('pwr-tracker:theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
+
