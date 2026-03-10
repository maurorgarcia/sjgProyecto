import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "SJG Montajes Industriales — Gestión de Horas",
  description: "Sistema de gestión de horas y control de fichadas — SJG Montajes Industriales",
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
              background: "#1a2f47",
              color: "#e8f0f8",
              border: "1px solid #2a4060",
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}
