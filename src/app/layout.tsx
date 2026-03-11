import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const APP_TITLE = "SJG Montajes Industriales — Gestión de Horas";
const APP_DESCRIPTION = "Sistema de gestión de horas y control de fichadas para SJG Montajes Industriales.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: APP_TITLE,
  description: APP_DESCRIPTION,
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", rel: "shortcut icon" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    url: "https://sjg-gestor-horas.local",
    siteName: "SJG Gestión de Horas",
    type: "website",
    locale: "es_AR",
    images: [
      {
        url: "/logoSJG.png",
        width: 512,
        height: 512,
        alt: "SJG Montajes Industriales",
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--bg-card)",
              color: "var(--t1)",
              border: "1px solid var(--border-hi)",
              fontFamily: "inherit",
              fontSize: "13px",
              borderRadius: "var(--radius)",
              boxShadow: "var(--shadow-lg)",
            },
            success: { iconTheme: { primary: "var(--green)", secondary: "var(--bg-card)" } },
            error:   { iconTheme: { primary: "var(--red)", secondary: "var(--bg-card)" } },
          }}
        />
      </body>
    </html>
  );
}
