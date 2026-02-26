import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Medit Streak",
  description: "Streak + Timer (offline-first base)",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Medit Streak",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var h = new Date().getHours();
                  var phase = (h >= 6 && h < 9) ? "sunrise" : (h >= 9 && h < 17) ? "day" : (h >= 17 && h < 20) ? "sunset" : "night";
                  document.documentElement.setAttribute("data-time-phase", phase);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
