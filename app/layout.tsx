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
      <body>{children}</body>
    </html>
  );
}
