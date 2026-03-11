 "use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const THEME_STORAGE_KEY = "sjg-theme";

export default function Header({ onLogout }: { onLogout: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userLabel, setUserLabel] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [themeInitialized, setThemeInitialized] = useState(false);

  useEffect(() => {
    let ignore = false;
    supabase.auth.getUser().then(({ data }) => {
      if (ignore) return;
      const user = data.user;
      if (!user) {
        setUserLabel(null);
        return;
      }
      const fullName =
        (user.user_metadata as { full_name?: string; name?: string } | null)?.full_name ??
        (user.user_metadata as { full_name?: string; name?: string } | null)?.name ??
        null;
      setUserLabel(fullName || user.email || null);
    });
    return () => {
      ignore = true;
    };
  }, []);

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
    setThemeInitialized(true);
  }, []);

  const go = (path: string) => {
    if (pathname === path) return;
    router.push(path);
  };

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

  return (
    <header className="app-header">
      <div className="app-header-brand">
        <img
          src="/logoSJG.png"
          alt="SJG Logo"
          className="app-header-logo"
        />
        <div className="app-header-titles">
          <p className="app-header-title">SJG Montajes Industriales</p>
          <p className="app-header-subtitle">Gestión de Horas</p>
        </div>
      </div>

      <div className="app-header-spacer" />

      <nav className="app-header-nav">
        <button
          type="button"
          onClick={() => go("/")}
          className={`app-header-nav-btn${pathname === "/" ? " active" : ""}`}
        >
          Tabla
        </button>
        <button
          type="button"
          onClick={() => go("/dashboard")}
          className={`app-header-nav-btn${pathname === "/dashboard" ? " active" : ""}`}
        >
          Dashboard
        </button>
      </nav>

      {userLabel && (
        <button
          type="button"
          onClick={() => go("/perfil")}
          className="app-header-user"
          title="Ver perfil"
        >
          <span className="app-header-user-greeting">Hola,</span>
          <span className="app-header-user-name">{userLabel}</span>
        </button>
      )}

      {themeInitialized && (
        <button
          type="button"
          onClick={toggleTheme}
          className="app-header-theme"
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
      )}

      <button
        type="button"
        onClick={onLogout}
        className="btn btn-ghost app-header-logout"
        title="Cerrar sesión"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Salir
      </button>

      <style jsx>{`
        .app-header {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 14px 24px;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
        }
        .app-header-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .app-header-logo {
          height: 32px;
          width: auto;
          object-fit: contain;
        }
        .app-header-titles {
          border-left: 1px solid var(--border-hi);
          padding-left: 12px;
        }
        .app-header-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--t1);
          line-height: 1.3;
        }
        .app-header-subtitle {
          font-size: 10px;
          color: var(--t3);
          margin-top: 2px;
          font-family: 'JetBrains Mono', monospace;
        }
        .app-header-spacer { flex: 1; }

        .app-header-nav {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-right: 8px;
        }
        .app-header-nav-btn {
          border: none;
          background: transparent;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          color: var(--t3);
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .app-header-nav-btn:hover {
          background: var(--bg-hover);
          color: var(--t1);
        }
        .app-header-nav-btn.active {
          background: var(--accent-bg);
          color: var(--accent);
          font-weight: 600;
        }
        .app-header-user {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          background: var(--bg-soft);
          font-size: 12px;
          color: var(--t2);
          max-width: 220px;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          border: none;
          cursor: pointer;
        }
        .app-header-user-greeting {
          color: var(--t3);
        }
        .app-header-user-name {
          font-weight: 600;
          color: var(--t1);
        }
        .app-header-logout {
          padding: 8px 14px;
          height: 36px;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }
        .app-header-theme {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          border: 1px solid var(--border-hi);
          background: var(--bg-input);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-right: 8px;
          cursor: pointer;
          color: var(--t2);
          transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.1s;
        }
        .app-header-theme:hover {
          background: var(--bg-hover);
          border-color: var(--accent);
          color: var(--accent);
          transform: translateY(-0.5px);
        }
        .app-header-theme svg {
          stroke: currentColor;
          fill: none;
        }
        .app-header-theme svg path:first-of-type {
          fill: currentColor;
        }
        @media (max-width: 768px) {
          .app-header {
            padding: 10px 14px;
            gap: 12px;
            flex-wrap: wrap;
            align-items: flex-start;
          }
          .app-header-brand {
            flex: 1 1 100%;
            gap: 8px;
          }
          .app-header-logo {
            height: 26px;
          }
          .app-header-titles {
            border-left: none;
            padding-left: 0;
          }
          .app-header-subtitle {
            display: none;
          }
          .app-header-spacer {
            flex: 0;
          }
          .app-header-nav {
            order: 3;
            width: 100%;
            justify-content: flex-start;
            overflow-x: auto;
          }
          .app-header-user {
            max-width: 140px;
          }
          .app-header-logout {
            height: 32px;
            padding: 6px 10px;
            font-size: 12px;
          }
        }
      `}</style>
    </header>
  );
}
