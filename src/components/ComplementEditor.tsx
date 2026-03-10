"use client";
import { useState } from "react";
import type { TimeError } from "@/types";

interface Props {
  row: TimeError;
  onSave: (vals: { insa: string; polu: string; noct: string }) => void;
}

const ic = "bg-transparent border border-[#2a4060] rounded px-2 py-1 text-[11px] text-[#e8f0f8] outline-none focus:border-[#f59e0b] w-20 text-center";

export default function ComplementEditor({ row, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [insa, setInsa] = useState(row.insa || "00:00");
  const [polu, setPolu] = useState(row.polu || "00:00");
  const [noct, setNoct] = useState(row.noct || "00:00");

  const hasAny = (v: string) => v && v !== "00:00";
  const anySet = hasAny(row.insa) || hasAny(row.polu) || hasAny(row.noct);

  const handleSave = () => { onSave({ insa, polu, noct }); setOpen(false); };

  return (
    <div className="relative h-full flex items-center px-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 flex-wrap"
        title="Editar complementos"
      >
        {hasAny(row.insa) && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}>INSA {row.insa}</span>}
        {hasAny(row.polu) && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.25)" }}>POLU {row.polu}</span>}
        {hasAny(row.noct) && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.25)" }}>NOCT {row.noct}</span>}
        {!anySet && <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>+ agregar</span>}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-50 rounded-md shadow-xl p-3 flex flex-col gap-2"
            style={{ background: "#1a2f47", border: "1px solid #3a5a80", minWidth: 200 }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Complementos</p>
            {[
              { label: "INSA", val: insa, set: setInsa, color: "#f59e0b" },
              { label: "POLU", val: polu, set: setPolu, color: "#60a5fa" },
              { label: "NOCT", val: noct, set: setNoct, color: "#a78bfa" },
            ].map(({ label, val, set, color }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-[10px] font-bold w-9" style={{ color }}>{label}</span>
                <input type="text" value={val} onChange={e => set(e.target.value)}
                  className={ic} placeholder="00:00" />
              </div>
            ))}
            <div className="flex gap-2 mt-1">
              <button className="btn btn-primary flex-1 justify-center text-[11px] py-1" onClick={handleSave}>Guardar</button>
              <button className="btn btn-ghost text-[11px] py-1" onClick={() => setOpen(false)}>✕</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
