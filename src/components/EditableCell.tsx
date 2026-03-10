"use client";
import { useState, useRef, useEffect, useCallback } from "react";

interface Props {
  value: string | number;
  onChange: (val: string) => void;
  type?: "text" | "number" | "date";
  placeholder?: string;
  align?: "left" | "right" | "center";
  className?: string;
}

export default function EditableCell({ value, onChange, type = "text", placeholder = "", align = "left", className = "" }: Props) {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(String(value ?? ""));
  const [flash, setFlash] = useState<"saved" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLocalVal(String(value ?? "")); }, [value]);
  useEffect(() => { if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    if (localVal !== String(value ?? "")) {
      onChange(localVal);
      setFlash("saved");
      setTimeout(() => setFlash(null), 800);
    }
  }, [localVal, value, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); commit(); }
    if (e.key === "Escape") { setLocalVal(String(value ?? "")); setEditing(false); }
  };

  const alignClass = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  const flashStyle = flash === "saved"
    ? { background: "rgba(34,197,94,0.12)", transition: "background 0.1s" }
    : { transition: "background 0.6s" };

  if (editing) {
    return (
      <input ref={inputRef} type={type} value={localVal}
        onChange={e => setLocalVal(e.target.value)}
        onBlur={commit} onKeyDown={handleKeyDown} placeholder={placeholder}
        className={`cell-input ${alignClass} ${className}`}
        step={type === "number" ? "0.01" : undefined} />
    );
  }

  return (
    <div onClick={() => setEditing(true)}
      className={`w-full h-full px-2.5 flex items-center cursor-text select-none ${alignClass} ${className}`}
      style={{ minHeight: 34, color: value ? "var(--text-primary)" : "var(--text-muted)", ...flashStyle }}>
      {value !== "" && value !== null && value !== undefined
        ? <span className="truncate">{value}</span>
        : <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{placeholder || "—"}</span>}
    </div>
  );
}
