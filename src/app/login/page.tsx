"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const FEATURES = [
  { icon: "⚡", label: "Tiempo real", desc: "Actualizaciones instantáneas entre usuarios" },
  { icon: "📊", label: "Importar / Exportar", desc: "Compatible con los reportes Excel existentes" },
  { icon: "🔒", label: "Acceso seguro", desc: "Login con credenciales por usuario" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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
              href="https://godream.ai"
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}
            >
              gdai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
