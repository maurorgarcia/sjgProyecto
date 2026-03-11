"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const FEATURES = [
  { icon: "⚡", label: "Tiempo real", desc: "Actualizaciones instantáneas entre usuarios" },
  { icon: "📊", label: "Importar / Exportar", desc: "Compatible con los reportes Excel existentes" },
  { icon: "🔒", label: "Acceso seguro", desc: "Login con credenciales por usuario" },
];

const THEME_STORAGE_KEY = "sjg-theme";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement as HTMLElement;
    const attr = root.dataset.theme;
    let initial: "light" | "dark" = "light";
    if (attr === "light" || attr === "dark") {
      initial = attr;
    } else {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        initial = stored;
      } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        initial = "dark";
      }
    }
    setTheme(initial);
    root.dataset.theme = initial;
    window.localStorage.setItem(THEME_STORAGE_KEY, initial);
  }, []);

  const toggleTheme = () => {
    if (typeof window === "undefined") return;
    setTheme((prev) => {
      const next: "light" | "dark" = prev === "light" ? "dark" : "light";
      const root = document.documentElement as HTMLElement;
      root.dataset.theme = next;
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.session) {
        setError("Credenciales incorrectas.");
        setLoading(false);
        return;
      }
      router.replace("/");
    } catch {
      setError("Error de conexión.");
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Panel izquierdo — solo desktop */}
      <div className="login-left">
        <div className="login-logo-row">
          <img src="/logoSJG.png" alt="SJG Montajes Industriales" className="login-logo-img" />
          <span className="login-logo-divider" />
          <div className="login-logo-sub">
            <span>Montajes</span>
            <br />
            <span>Industriales</span>
          </div>
        </div>

        <div className="login-hero">
          <span className="login-tag">Sistema de gestión</span>
          <h1 className="login-heading">
            Gestión de <span className="login-heading-accent">horas</span> y fichadas
          </h1>
          <p className="login-desc">
            Control de asistencia y errores de fichada para el personal de SJG Montajes Industriales.
          </p>

          <div className="login-features">
            {FEATURES.map(({ icon, label, desc }) => (
              <div key={label} className="login-feature">
                <span className="login-feature-icon">{icon}</span>
                <div>
                  <div className="login-feature-label">{label}</div>
                  <div className="login-feature-desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="login-footer-left">
          © {new Date().getFullYear()} SJG Montajes Industriales
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="login-right">
        <div className="login-form-wrap">
          <div className="login-top-actions">
            <button
              type="button"
              className="login-theme-toggle"
              onClick={toggleTheme}
              title={theme === "light" ? "Cambiar a tema oscuro" : "Cambiar a tema claro"}
            >
              {theme === "light" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
          <div className="login-mobile-logo">
            <img src="/logoSJG.png" alt="SJG Montajes Industriales" className="login-logo-img" />
            <span className="login-logo-divider" />
            <div className="login-logo-sub">
              <span>Montajes</span>
              <br />
              <span>Industriales</span>
            </div>
          </div>

          <h2 className="login-welcome">Bienvenido</h2>
          <p className="login-welcome-sub">Ingresá tus credenciales para continuar</p>

          <form onSubmit={submit} className="login-form">
            <div className="login-field">
              <label className="lbl">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="usuario@sjg.com"
                required
                autoFocus
              />
            </div>

            <div className="login-field">
              <label className="lbl">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
                required
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" disabled={loading} className="btn btn-primary login-btn">
              {loading ? (
                <>
                  <span className="login-spinner" />
                  Ingresando…
                </>
              ) : (
                <>Ingresar →</>
              )}
            </button>
          </form>

          <p className="login-help">
            ¿Problemas para acceder?<br />
            Contactá a tu administrador
          </p>

          <p className="login-credit">
            Desarrollado por{" "}
            <a
              href="https://www.godreamai.com/"
              target="_blank"
              rel="noreferrer"
            >
              <img src="/logoGoD.png" alt="godreamai" className="login-credit-logo" />
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
