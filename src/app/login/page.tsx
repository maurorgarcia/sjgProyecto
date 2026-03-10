"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.session) {
        setError("Credenciales incorrectas. Verificá tu email y contraseña.");
        setLoading(false);
        return;
      }
      router.replace("/");
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
      setLoading(false);
    }
  };

  const ic = "w-full bg-transparent border border-[#2a4060] rounded-md px-3 py-2.5 text-[13px] text-[#e8f0f8] outline-none focus:border-[#f59e0b] transition-colors placeholder-[#4a6a8a]";

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg-base)" }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 gap-4">
          <img src="/logo-sjg.jpg" alt="SJG" style={{ height: 56, filter: "invert(1)", mixBlendMode: "screen" }} />
          <div className="text-center">
            <h1 className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "'IBM Plex Sans', sans-serif" }}>
              SJG Montajes Industriales
            </h1>
            <p className="text-[11px] tracking-widest uppercase mt-0.5" style={{ color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>
              Gestión de Horas
            </p>
          </div>
        </div>

        <div className="rounded-lg p-6" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold mb-5" style={{ color: "var(--text-primary)" }}>Iniciar sesión</h2>
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
                Correo electrónico
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className={ic} placeholder="usuario@sjg.com" required autoFocus />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
                Contraseña
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className={ic} placeholder="••••••••" required />
            </div>

            {error && (
              <div className="text-[12px] px-3 py-2 rounded" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center mt-1 py-2.5">
              {loading ? "Ingresando…" : "Ingresar"}
            </button>
          </form>
        </div>

        <div className="flex justify-center mt-8">
          <a href="https://www.godreamai.com/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 opacity-50 hover:opacity-80 transition-opacity">
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Desarrollado por</span>
            <img src="/logo-gdai.png" alt="Go Dream AI" style={{ height: 18, mixBlendMode: "screen", filter: "brightness(1.6)" }} />
          </a>
        </div>
      </div>
    </div>
  );
}
