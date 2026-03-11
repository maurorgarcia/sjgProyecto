import { useState, useRef, useEffect } from "react";

export function SelectDropdown({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  style = {}
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label || placeholder;

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        ...style
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          height: 30,
          padding: "0 10px",
          borderRadius: 7,
          border: "1px solid var(--border-hi)",
          background: "var(--bg-input)",
          color: value ? "var(--t1)" : "var(--t3)",
          fontSize: 11,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "all 0.2s",
          fontFamily: "inherit",
          fontWeight: 500
        }}
      >
        <span style={{ textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}>
          {selectedLabel}
        </span>
        <svg
          width="8"
          height="8"
          viewBox="0 0 8 5"
          fill="currentColor"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            opacity: 0.6,
            flexShrink: 0,
            marginLeft: 6
          }}
        >
          <path d="M4 0L8 5H0z" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--bg-card)",
            border: "1px solid var(--border-hi)",
            borderRadius: 7,
            boxShadow: "0 12px 32px rgba(31,41,55,0.12)",
            zIndex: 100,
            overflow: "hidden"
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              style={{
                padding: "9px 12px",
                fontSize: 11,
                color: value === opt.value ? "#374151" : "var(--t1)",
                cursor: "pointer",
                background: value === opt.value ? "rgba(31,41,55,0.1)" : "transparent",
                borderBottom: "1px solid var(--border)",
                fontWeight: value === opt.value ? 600 : 400,
                transition: "all 0.15s"
              }}
              onMouseEnter={(e) => {
                if (value !== opt.value) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(31,41,55,0.06)";
                  (e.currentTarget as HTMLElement).style.color = "#1f2937";
                }
              }}
              onMouseLeave={(e) => {
                if (value !== opt.value) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--t1)";
                }
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
