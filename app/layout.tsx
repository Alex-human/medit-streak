import "./globals.css";

export const metadata = {
  title: "Medit Streak",
  description: "Streak + Timer (offline-first base)",
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

export const metadata = {
  title: "Medit Streak",
  description: "Streak + Timer (offline-first base)",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Medit Streak",
  },
};
