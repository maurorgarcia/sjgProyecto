"use client";
import type { Estado } from "@/types";
const CFG: Record<Estado,{cls:string;dot:string}> = {
  "Pendiente":   { cls:"badge-pending", dot:"#fbbf24" },
  "En revisión": { cls:"badge-review",  dot:"#818cf8" },
  "Corregido":   { cls:"badge-done",    dot:"#4ade80" },
};
const ORDER: Estado[] = ["Pendiente","En revisión","Corregido"];
export default function StatusBadge({ value, onChange }: { value: Estado; onChange:(v:Estado)=>void }) {
  const cfg = CFG[value] ?? CFG["Pendiente"];
  return (
    <button onClick={e=>{e.stopPropagation();onChange(ORDER[(ORDER.indexOf(value)+1)%3]);}}
      className={`badge ${cfg.cls}`} title="Clic para cambiar estado">
      <span style={{width:5,height:5,borderRadius:"50%",background:cfg.dot,boxShadow:`0 0 5px ${cfg.dot}`,display:"inline-block",flexShrink:0}}/>
      {value}
    </button>
  );
}
