"use client";
import type { Estado } from "@/types";

interface Props {
  value: Estado;
  onChange?: (val: Estado) => void;
  readOnly?: boolean;
}

const ESTADOS: Estado[] = ["Pendiente", "En revisión", "Corregido"];

const CLASS_MAP: Record<Estado, string> = {
  Pendiente: "badge-pending",
  "En revisión": "badge-review",
  Corregido: "badge-done",
};

const DOT_MAP: Record<Estado, string> = {
  Pendiente: "bg-amber-500",
  "En revisión": "bg-blue-400",
  Corregido: "bg-green-400",
};

export default function StatusBadge({ value, onChange, readOnly }: Props) {
  if (readOnly || !onChange) {
    return (
      <span className={`badge ${CLASS_MAP[value]}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${DOT_MAP[value]}`} />
        {value}
      </span>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Estado)}
      className="w-full h-full bg-transparent border-none outline-none text-[11px] font-semibold uppercase tracking-wide cursor-pointer px-2"
      style={{ color: value === "Pendiente" ? "#f59e0b" : value === "En revisión" ? "#3b82f6" : "#22c55e" }}
    >
      {ESTADOS.map((s) => (
        <option key={s} value={s} style={{ background: "#1a2f47", color: "#e8f0f8" }}>
          {s}
        </option>
      ))}
    </select>
  );
}
