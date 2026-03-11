export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer-left">
        <p className="app-footer-brand">SJG Montajes Industriales</p>
        <p className="app-footer-copy">© {new Date().getFullYear()} · Todos los derechos reservados</p>
      </div>

      <div className="app-footer-divider" />

      <a
        href="https://www.godreamai.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="app-footer-link"
      >
        <span className="app-footer-link-text">Desarrollado por</span>
        <img src="/logoGoD.png" alt="godreamai" className="app-footer-link-logo" />
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>

      <style jsx>{`
        .app-footer {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          padding: 16px 24px;
          background: var(--bg-row);
          border-top: 1px solid var(--border);
          box-shadow: 0 -1px 0 var(--border);
        }
        .app-footer-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          min-width: 180px;
        }
        .app-footer-brand {
          font-size: 12px;
          font-weight: 700;
          color: var(--t1);
        }
        .app-footer-copy {
          font-size: 11px;
          color: var(--t3);
          font-family: 'JetBrains Mono', monospace;
        }
        .app-footer-divider {
          width: 1px;
          height: 24px;
          background: var(--border-hi);
          opacity: 0.8;
        }
        .app-footer-link {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: var(--t3);
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          transition: all 0.2s ease;
        }
        .app-footer-link:hover {
          background: var(--bg-hover);
          color: var(--t1);
        }
        .app-footer-link-text {
          font-size: 11px;
          font-weight: 600;
        }
        .app-footer-link-logo {
          height: 18px;
          width: auto;
          object-fit: contain;
        }
      `}</style>
    </footer>
  );
}
