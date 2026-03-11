"use client";
import { useRouter, usePathname } from "next/navigation";

export default function Header({ onLogout }: { onLogout: () => void }) {
  const router = useRouter();
  const pathname = usePathname();

  const go = (path: string) => {
    if (pathname === path) return;
    router.push(path);
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
        .app-header-logout {
          padding: 8px 14px;
          height: 36px;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }
      `}</style>
    </header>
  );
}
