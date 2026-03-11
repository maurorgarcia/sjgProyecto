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

          <p className="login-credit">Desarrollado por <strong>gdai</strong></p>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          display: flex;
          min-height: 100vh;
          background: radial-gradient(circle at top left, rgba(184,134,11,0.12), transparent 55%),
                      radial-gradient(circle at bottom right, rgba(37,99,235,0.08), transparent 60%),
                      var(--bg);
          color: var(--t1);
        }

        .login-left {
          display: none;
          width: 50%;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 56px;
          background: var(--bg-card);
          border-right: 1px solid var(--border);
          animation: loginFadeLeft 0.5s ease-out both;
        }
        @media (min-width: 1024px) {
          .login-left { display: flex; }
        }

        .login-logo-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .login-logo-img {
          height: 36px;
          width: auto;
          object-fit: contain;
        }
        .login-logo-divider {
          width: 1px;
          height: 28px;
          background: var(--border-hi);
        }
        .login-logo-sub {
          font-size: 11px;
          line-height: 1.5;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--t3);
        }
        .login-logo-sub span:first-child { font-weight: 600; color: var(--t1); }

        .login-hero { display: flex; flex-direction: column; gap: 24px; }
        .login-tag {
          font-size: 11px;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-weight: 600;
        }
        .login-heading {
          font-size: clamp(28px, 3.5vw, 42px);
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: var(--t1);
        }
        .login-heading-accent { color: var(--accent); }
        .login-desc {
          font-size: 15px;
          color: var(--t2);
          line-height: 1.65;
          max-width: 380px;
        }

        .login-features {
          border-top: 1px solid var(--border);
          padding-top: 20px;
        }
        .login-feature {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 0;
          border-bottom: 1px solid var(--border);
        }
        .login-feature:last-child { border-bottom: none; }
        .login-feature-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-row);
          border-radius: var(--radius);
          font-size: 18px;
          flex-shrink: 0;
        }
        .login-feature-label {
          font-size: 11px;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 600;
          margin-bottom: 2px;
        }
        .login-feature-desc {
          font-size: 13px;
          color: var(--t2);
          font-weight: 500;
        }

        .login-footer-left {
          font-size: 12px;
          color: var(--t3);
        }

        .login-right {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 20px;
          background: var(--bg);
        }
        @media (min-width: 1024px) {
          .login-right { width: 50%; padding: 32px; }
        }

        .login-form-wrap {
          width: 100%;
          max-width: 400px;
          background: var(--bg-card);
          padding: 40px 36px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-lg);
          animation: loginCardRise 0.5s ease-out 0.05s both;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .login-form-wrap:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 40px rgba(28,33,40,0.14);
          border-color: var(--accent-bg);
        }

        .login-mobile-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 28px;
        }
        @media (min-width: 1024px) {
          .login-mobile-logo { display: none; }
        }
        .login-mobile-logo .login-logo-divider { height: 24px; }

        .login-welcome {
          font-size: 22px;
          font-weight: 700;
          color: var(--t1);
          margin-bottom: 6px;
        }
        .login-welcome-sub {
          font-size: 14px;
          color: var(--t3);
          margin-bottom: 28px;
        }

        .login-form { display: flex; flex-direction: column; gap: 0; }
        .login-field { margin-bottom: 18px; }
        .login-btn { width: 100%; margin-top: 6px; height: 40px; }
        .login-error {
          font-size: 13px;
          font-weight: 500;
          color: var(--red);
          background: rgba(220, 38, 38, 0.08);
          border: 1px solid rgba(220, 38, 38, 0.25);
          padding: 10px 14px;
          border-radius: var(--radius);
          margin-bottom: 16px;
        }
        .login-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        .login-help {
          text-align: center;
          font-size: 13px;
          color: var(--t3);
          margin-top: 24px;
          line-height: 1.6;
        }
        .login-credit {
          text-align: center;
          font-size: 11px;
          color: var(--t3);
          margin-top: 28px;
        }
        .login-credit strong { color: var(--accent); font-weight: 600; }

        @keyframes loginFadeLeft {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes loginCardRise {
          from { opacity: 0; transform: translateY(8px) scale(0.99); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
