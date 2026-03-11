import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const APP_TITLE = "SJG Montajes Industriales — Gestión de Horas";
const APP_DESCRIPTION = "Sistema de gestión de horas y control de fichadas para SJG Montajes Industriales.";

export const metadata: Metadata = {
  title: APP_TITLE,
  description: APP_DESCRIPTION,
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
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
