"use client";
import { useEffect, useState } from "react";
import { fetchHistory } from "@/lib/supabase";

interface Props { recordId: string; empleado: string; onClose: () => void; }

const FIELD_LABELS: Record<string, string> = {
  fecha: "Fecha", contrato: "Contrato", empleado: "Empleado", motivo: "Motivo",
  sector: "Sector", ot: "OT", ot_em: "OT Em.", ot_em2: "OT Em.2",
  hh_normales: "HH Normales", hh_50: "HH E.50%", hh_100: "HH E.100%",
  estado: "Estado", observaciones: "Observaciones", insa: "INSA", polu: "POLU", noct: "NOCT",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", { day:"2-digit", month:"2-digit", year:"2-digit", hour:"2-digit", minute:"2-digit" });
}

export default function HistoryModal({ recordId, empleado, onClose }: Props) {
  const [history, setHistory] = useState<Awaited<ReturnType<typeof fetchHistory>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory(recordId).then(h => { setHistory(h); setLoading(false); });
  }, [recordId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(13,27,42,0.88)" }}>
      <div className="fade-in rounded-md shadow-2xl w-full max-w-lg overflow-hidden" style={{ background: "#1a2f47", border: "1px solid #3a5a80" }}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "#2a4060" }}>
          <div>
            <span className="font-semibold text-sm text-[#e8f0f8]">Historial de cambios</span>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>{empleado}</p>
          </div>
          <button type="button" onClick={onClose} className="text-[#4a6a8a] hover:text-[#e8f0f8] text-lg leading-none">✕</button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-10" style={{ color: "var(--text-muted)", fontSize: 12 }}>
              Sin cambios registrados
            </div>
          ) : (
            <table className="w-full text-[11px]" style={{ fontFamily: "'DM Mono', monospace" }}>
              <thead>
                <tr style={{ background: "var(--bg-elevated)" }}>
                  <th className="px-4 py-2 text-left font-semibold text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Fecha</th>
                  <th className="px-4 py-2 text-left font-semibold text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Campo</th>
                  <th className="px-4 py-2 text-left font-semibold text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Antes</th>
                  <th className="px-4 py-2 text-left font-semibold text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Después</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={h.id} style={{ background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-elevated)" }}>
                    <td className="px-4 py-2" style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDate(h.created_at)}</td>
                    <td className="px-4 py-2 font-medium" style={{ color: "var(--text-secondary)" }}>{FIELD_LABELS[h.campo] || h.campo}</td>
                    <td className="px-4 py-2" style={{ color: "#ef4444", textDecoration: "line-through", opacity: 0.7 }}>{h.valor_anterior || "—"}</td>
                    <td className="px-4 py-2" style={{ color: "#22c55e" }}>{h.valor_nuevo || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-5 py-3 border-t flex justify-end" style={{ borderColor: "#2a4060" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
