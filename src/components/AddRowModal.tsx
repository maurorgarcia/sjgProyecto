"use client";
import { useState, useCallback } from "react";
import type { TimeError } from "@/types";

interface Props {
  onAdd: (row: Omit<TimeError, "id" | "created_at" | "updated_at" | "dia">) => Promise<void>;
  onClose: () => void;
}

const CONTRATOS = ["6700248017", "6700302926"];
const MOTIVOS = [
  "Par de fichada incompleto",
  "Omisión",
  "Saldo Insuficiente",
  "OT inexistente",
  "Falta parte",
  "Falta cargar",
];

const SECTORES = [
  "Mecánica", "Eléctrica", "Instrumentos", "Civil",
  "Aislación", "Pintura", "Andamios",
  "Pañol/Logística", "Coordinación", "Puesto Fijo",
  "RRHH", "Administración",
];
const COMPLEMENTOS = ["", "INSA", "POLU", "NOCT"];

const BLANK = {
  fecha: new Date().toISOString().slice(0, 10),
  contrato: "",
  empleado: "",
  motivo: "",
  sector: "",
  ot: "",
  ot_em: "",
  ot_em2: "",
  hh_normales: "00:00",
  hh_50: "00:00",
  hh_100: "00:00",
  estado: "Pendiente" as const,
  observaciones: "",
  insa: "00:00",
  polu: "00:00",
  noct: "00:00",
};

const ic = "w-full bg-transparent border border-[#2a4060] rounded px-2.5 py-1.5 text-[12px] text-[#e8f0f8] outline-none focus:border-[#f59e0b] transition-colors";
const lc = "block text-[10px] font-semibold uppercase tracking-widest text-[#4a6a8a] mb-1";

export default function AddRowModal({ onAdd, onClose }: Props) {
  const [form, setForm] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [comp50, setComp50] = useState("");
  const [comp100, setComp100] = useState("");
  const [compNor, setCompNor] = useState("");

  const handleChange = useCallback(
    (field: keyof typeof BLANK) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const val = e.target.value;
        setForm((prev) => ({ ...prev, [field]: val }));
      },
    []
  );

  const handleSubmit = async () => {
    if (!form.empleado.trim()) return;
    setSaving(true);
    const mapped = { ...form };
    // Store complement reference (which hh group it belongs to)
    if (compNor) mapped[compNor.toLowerCase() as "insa"|"polu"|"noct"] = form.hh_normales;
    if (comp50)  mapped[comp50.toLowerCase() as "insa"|"polu"|"noct"] = form.hh_50;
    if (comp100) mapped[comp100.toLowerCase() as "insa"|"polu"|"noct"] = form.hh_100;
    await onAdd(mapped);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(13,27,42,0.88)" }}>
      <div className="fade-in rounded-md shadow-2xl w-full max-w-2xl overflow-hidden" style={{ background: "#1a2f47", border: "1px solid #3a5a80" }}>

        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "#2a4060" }}>
          <span className="font-semibold text-sm text-[#e8f0f8]">Agregar Registro</span>
          <button type="button" onClick={onClose} className="text-[#4a6a8a] hover:text-[#e8f0f8] text-lg leading-none">✕</button>
        </div>

        <div className="p-5 grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">

          <div>
            <label className={lc}>Fecha</label>
            <input type="date" value={form.fecha} onChange={handleChange("fecha")} className={ic} />
          </div>

          <div>
            <label className={lc}>Contrato</label>
            <select value={form.contrato} onChange={handleChange("contrato")} className={ic}>
              <option value="">— Seleccionar —</option>
              {CONTRATOS.map((c) => <option key={c} value={c} style={{ background: "#1a2f47" }}>{c}</option>)}
            </select>
          </div>

          <div className="col-span-2">
            <label className={lc}>Apellido y Nombre *</label>
            <input type="text" value={form.empleado} onChange={handleChange("empleado")} className={ic} placeholder="García, Juan Carlos" autoFocus />
          </div>

          <div className="col-span-2">
            <label className={lc}>Motivo</label>
            <select value={form.motivo} onChange={handleChange("motivo")} className={ic}>
              <option value="">— Seleccionar —</option>
              {MOTIVOS.map((m) => <option key={m} value={m} style={{ background: "#1a2f47" }}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className={lc}>Área / Sector</label>
            <input type="text" value={form.sector} onChange={handleChange("sector")} className={ic}
              placeholder="Escribir o seleccionar…" list="modal-sector-list" autoComplete="off" />
            <datalist id="modal-sector-list">
              {SECTORES.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>

          <div>
            <label className={lc}>OT</label>
            <input type="text" value={form.ot} onChange={handleChange("ot")} className={ic} placeholder="OT-4421" />
          </div>

          <div>
            <label className={lc}>OT Em.</label>
            <input type="text" value={form.ot_em} onChange={handleChange("ot_em")} className={ic} />
          </div>

          <div>
            <label className={lc}>OT Em. 2</label>
            <input type="text" value={form.ot_em2} onChange={handleChange("ot_em2")} className={ic} />
          </div>

          <div className="col-span-2">
            <label className={lc}>Horas + Complemento</label>
            <div className="grid grid-cols-3 gap-3">

              <div>
                <span className="text-[10px] text-[#627d98] block mb-1">HH Normales</span>
                <div className="flex gap-1">
                  <input type="text" value={form.hh_normales} onChange={handleChange("hh_normales")} className={ic + " w-20"} placeholder="09:00" />
                  <select value={compNor} onChange={(e) => setCompNor(e.target.value)} className={ic + " flex-1 text-[11px]"}>
                    {COMPLEMENTOS.map((c) => <option key={c} value={c} style={{ background: "#1a2f47" }}>{c || "—"}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-[#627d98] block mb-1">HH E.50%</span>
                <div className="flex gap-1">
                  <input type="text" value={form.hh_50} onChange={handleChange("hh_50")} className={ic + " w-20"} placeholder="03:00" />
                  <select value={comp50} onChange={(e) => setComp50(e.target.value)} className={ic + " flex-1 text-[11px]"}>
                    {COMPLEMENTOS.map((c) => <option key={c} value={c} style={{ background: "#1a2f47" }}>{c || "—"}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-[#627d98] block mb-1">HH E.100%</span>
                <div className="flex gap-1">
                  <input type="text" value={form.hh_100} onChange={handleChange("hh_100")} className={ic + " w-20"} placeholder="03:00" />
                  <select value={comp100} onChange={(e) => setComp100(e.target.value)} className={ic + " flex-1 text-[11px]"}>
                    {COMPLEMENTOS.map((c) => <option key={c} value={c} style={{ background: "#1a2f47" }}>{c || "—"}</option>)}
                  </select>
                </div>
              </div>

            </div>
          </div>

          <div>
            <label className={lc}>Estado</label>
            <select value={form.estado} onChange={handleChange("estado")} className={ic}>
              <option value="Pendiente" style={{ background: "#1a2f47" }}>Pendiente</option>
              <option value="En revisión" style={{ background: "#1a2f47" }}>En revisión</option>
              <option value="Corregido" style={{ background: "#1a2f47" }}>Corregido</option>
            </select>
          </div>

          <div>
            <label className={lc}>Observaciones</label>
            <textarea rows={2} value={form.observaciones} onChange={handleChange("observaciones")} className={ic + " resize-none"} placeholder="Notas adicionales…" />
          </div>

        </div>

        <div className="flex justify-end gap-3 px-5 py-3.5 border-t" style={{ borderColor: "#2a4060" }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={saving || !form.empleado.trim()}>
            {saving ? "Guardando…" : "Agregar"}
          </button>
        </div>

      </div>
    </div>
  );
}
