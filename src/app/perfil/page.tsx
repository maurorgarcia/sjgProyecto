 "use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ProfileState = {
  full_name: string;
  title: string;
};

export default function PerfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileState>({
    full_name: "",
    title: "",
  });

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error(error);
        if (!ignore) setError("No se pudo obtener el usuario actual.");
        setLoading(false);
        return;
      }
      const user = data.user;
      if (!user) {
        router.replace("/login");
        return;
      }
      const meta = (user.user_metadata ?? {}) as {
        full_name?: string;
        name?: string;
        title?: string;
        role?: string;
      };
      if (!ignore) {
        setProfile({
          full_name: meta.full_name || meta.name || user.email || "",
          title: meta.title || meta.role || "",
        });
        setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name.trim(),
          title: profile.title.trim(),
        },
      });
      if (error) throw error;
      setSuccess("Perfil actualizado.");
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar el perfil.");
    } finally {
      setSaving(false);
    }
  }

  const initials = profile.full_name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

  return (
    <main className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            <span>{initials}</span>
          </div>
          <div className="profile-header-text">
            <h1 className="profile-title">Perfil profesional</h1>
            <p className="profile-subtitle">
              Configurá cómo querés que te vea el sistema y tus reportes.
            </p>
          </div>
        </div>

        <section className="profile-summary">
          <div className="profile-summary-main">
            <h2>{profile.full_name || "Sin nombre configurado"}</h2>
            <p className="profile-summary-role">
              {profile.title || "Agregá tu puesto o rol en la empresa."}
            </p>
          </div>
          <div className="profile-summary-meta">
            <span className="profile-pill">
              Estado: <strong>Activo</strong>
            </span>
          </div>
        </section>

        <form className="profile-form" onSubmit={handleSave}>
          <fieldset className="profile-fieldset" disabled={saving || loading}>
            <legend>Datos de identidad</legend>

            <label className="profile-field">
              <span className="profile-label">Nombre completo</span>
              <input
                type="text"
                className="profile-input"
                value={profile.full_name}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, full_name: e.target.value }))
                }
                placeholder="Ej: Mauro García"
              />
              <span className="profile-help">
                Se usará en el saludo del sistema y en reportes.
              </span>
            </label>

            <label className="profile-field">
              <span className="profile-label">Puesto / Rol</span>
              <input
                type="text"
                className="profile-input"
                value={profile.title}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="Ej: Administrador, Supervisor, etc."
              />
              <span className="profile-help">
                Describe tu función dentro de SJG (solo visible internamente).
              </span>
            </label>
          </fieldset>

          {error && <p className="profile-error">{error}</p>}
          {success && <p className="profile-success">{success}</p>}

          <div className="profile-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => router.back()}
              disabled={saving}
            >
              Volver
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .profile-page {
          padding: 24px;
          display: flex;
          justify-content: center;
        }
        .profile-card {
          width: 100%;
          max-width: 720px;
          background: var(--bg-card);
          border-radius: 16px;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-md);
          padding: 20px 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .profile-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .profile-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--accent-soft);
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 20px;
        }
        .profile-header-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .profile-title {
          font-size: 20px;
          font-weight: 600;
          color: var(--t1);
        }
        .profile-subtitle {
          font-size: 13px;
          color: var(--t3);
        }
        .profile-summary {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 12px;
          background: var(--bg-soft);
        }
        .profile-summary-main h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--t1);
        }
        .profile-summary-role {
          margin: 2px 0 0;
          font-size: 13px;
          color: var(--t3);
        }
        .profile-summary-meta {
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }
        .profile-pill {
          font-size: 12px;
          background: var(--bg-card);
          border-radius: 999px;
          padding: 4px 10px;
          border: 1px solid var(--border-hi);
          color: var(--t2);
        }
        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .profile-fieldset {
          border-radius: 12px;
          border: 1px solid var(--border);
          padding: 14px 14px 12px;
        }
        .profile-fieldset legend {
          padding: 0 6px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--t3);
        }
        .profile-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 8px;
        }
        .profile-label {
          font-size: 13px;
          color: var(--t2);
        }
        .profile-input {
          border-radius: 8px;
          border: 1px solid var(--border);
          padding: 8px 10px;
          font-size: 13px;
          background: var(--bg-input);
          color: var(--t1);
        }
        .profile-input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 1px var(--accent-soft);
        }
        .profile-help {
          font-size: 11px;
          color: var(--t3);
        }
        .profile-error {
          font-size: 12px;
          color: #b00020;
        }
        .profile-success {
          font-size: 12px;
          color: #1b873f;
        }
        .profile-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 4px;
        }
        @media (max-width: 640px) {
          .profile-page {
            padding: 16px;
          }
          .profile-card {
            padding: 16px;
          }
          .profile-summary {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </main>
  );
}

