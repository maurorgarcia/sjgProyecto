"use client";
import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import type { TimeError } from "@/types";
import { deleteByFecha, deleteAll } from "@/lib/supabase";

interface Props {
  onImport: (rows: Omit<TimeError, "id" | "created_at" | "updated_at" | "dia">[]) => Promise<void>;
  currentFecha: string;
  onReset?: () => void;
}

const HEADER_MAP: Record<string, keyof TimeError> = {
  fecha: "fecha", "día": "dia", dia: "dia",
  contrato: "contrato", "nro contrato": "contrato", "n° contrato": "contrato",
  "apellido y nombre": "empleado", nombre: "empleado", empleado: "empleado",
  "nombre completo": "empleado", "apellido, nombre": "empleado",
  motivo: "motivo", "motivo error": "motivo", "tipo error": "motivo",
  "área / sector": "sector", "area / sector": "sector", "área/sector": "sector",
  "area/sector": "sector", sector: "sector", "área": "sector", area: "sector",
  "area de trabajo": "sector", "área de trabajo": "sector",
  ot: "ot", "orden de trabajo": "ot",
  "ot em.": "ot_em", "ot em": "ot_em", "ot emergencia": "ot_em", "ot emer.": "ot_em",
  "ot em.2": "ot_em2", "ot em2": "ot_em2", "ot emergencia 2": "ot_em2",
  "hh nor.": "hh_normales", "hh nor": "hh_normales", "hh normales": "hh_normales",
  "hs normales": "hh_normales", "horas normales": "hh_normales",
  "hh e.50%": "hh_50", "hh 50%": "hh_50", "hh e. 50%": "hh_50",
  "hs 50%": "hh_50", "horas 50%": "hh_50",
  "hh e.100%": "hh_100", "hh 100%": "hh_100", "hh e. 100%": "hh_100",
  "hs 100%": "hh_100", "horas 100%": "hh_100",
  estado: "estado",
  observaciones: "observaciones", observacion: "observaciones", obs: "observaciones",
  insa: "insa", polu: "polu", noct: "noct",
};

function normalizeDate(raw: unknown): string {
  if (!raw) return new Date().toISOString().slice(0, 10);
  if (typeof raw === "number") {
    const date = XLSX.SSF.parse_date_code(raw);
    return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
  }
  if (typeof raw === "string") {
    const ddmm = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmm) return `${ddmm[3]}-${ddmm[2].padStart(2, "0")}-${ddmm[1].padStart(2, "0")}`;
    return raw.slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

function toHHMM(raw: unknown): string {
  if (raw === "" || raw === null || raw === undefined) return "00:00";
  if (typeof raw === "number") {
    const mins = raw < 1 ? Math.round(raw * 24 * 60) : Math.round(raw * 60);
    const h = Math.floor(mins / 60), m = mins % 60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  }
  if (typeof raw === "string") {
    const t = raw.trim();
    const m = t.match(/^(\d{1,2}):(\d{2})/);
    if (m) return `${String(Number(m[1])).padStart(2,"0")}:${m[2]}`;
    const n = parseFloat(t);
    if (!isNaN(n)) return toHHMM(n);
  }
  return "00:00";
}

function parseHoraConComp(raw: unknown): { hora: string; comp: "insa"|"polu"|"noct"|null } {
  if (raw === "" || raw === null || raw === undefined) return { hora: "00:00", comp: null };
  if (typeof raw === "number") return { hora: toHHMM(raw), comp: null };
  if (typeof raw === "string") {
    const t = raw.trim().toUpperCase();
    const comp = t.includes("INSA") ? "insa" : t.includes("POLU") ? "polu" : t.includes("NOCT") ? "noct" : null;
    const hm = t.match(/(\d{1,2}:\d{2})/);
    if (hm) return { hora: toHHMM(hm[1]), comp };
    const n = parseFloat(raw);
    if (!isNaN(n)) return { hora: toHHMM(n), comp };
  }
  return { hora: "00:00", comp: null };
}

function normalizarMotivo(raw: unknown): string {
  if (!raw) return "";
  const t = String(raw).toLowerCase().trim();
  if (t.includes("par") || t.includes("incompleto") || t.includes("fichada")) return "Par de fichada incompleto";
  if (t.includes("omis") || t.includes("ausencia")) return "Omisión";
  if (t.includes("saldo") || t.includes("insuf") || t.includes("hrs insuf")) return "Saldo Insuficiente";
  if (t.includes("ot") && (t.includes("inexist") || t.includes("no exist"))) return "OT inexistente";
  if (t.includes("falta parte") || t.includes("falta el parte") || t.includes("sin parte")) return "Falta parte";
  if (t.includes("falta cargar") || t.includes("sin cargar") || t.includes("no se carg")) return "Falta cargar";
  return String(raw).trim();
}

function normalizarSector(raw: unknown): string {
  if (!raw) return "";
  const t = String(raw).trim();
  const map: Record<string, string> = {
    "pañol/logistica": "Pañol/Logística", "pañol/logística": "Pañol/Logística",
    "panol/logistica": "Pañol/Logística", "logistica": "Pañol/Logística", "logística": "Pañol/Logística",
    "coordinacion": "Coordinación", "coordinación": "Coordinación",
    "puesto fijo": "Puesto Fijo",
  };
  return map[t.toLowerCase()] ?? t;
}

type ImportMode = "replace_date" | "replace_all" | "append";

export default function ImportExcel({ onImport, currentFecha, onReset }: Props) {
  const fileRef            = useRef<HTMLInputElement>(null);
  const [loading, setLoading]   = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState<"reset_date" | "reset_all" | null>(null);

  const processFile = async (file: File, mode: ImportMode) => {
    setLoading(true);
    setShowMenu(false);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array", cellDates: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
      if (!raw.length) { toast.error("El archivo está vacío"); setLoading(false); return; }

      const unrecognized = Object.keys(raw[0]).filter(k => !HEADER_MAP[k.toLowerCase().trim()]);
      if (unrecognized.length) console.warn("⚠️ Columnas no reconocidas:", unrecognized);

      const rows = raw.map(r => {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(r)) {
          const mapped = HEADER_MAP[k.toLowerCase().trim()];
          if (mapped) out[mapped] = v;
        }
        return out;
      });

      const mapped = rows.map(r => {
        const nor  = parseHoraConComp(r.hh_normales);
        const e50  = parseHoraConComp(r.hh_50);
        const e100 = parseHoraConComp(r.hh_100);
        let insa = toHHMM(r.insa), polu = toHHMM(r.polu), noct = toHHMM(r.noct);
        const apply = (comp: "insa"|"polu"|"noct"|null, hora: string) => {
          if (!comp || hora === "00:00") return;
          if (comp === "insa" && insa === "00:00") insa = hora;
          if (comp === "polu" && polu === "00:00") polu = hora;
          if (comp === "noct" && noct === "00:00") noct = hora;
        };
        apply(nor.comp, nor.hora); apply(e50.comp, e50.hora); apply(e100.comp, e100.hora);
        return {
          fecha: normalizeDate(r.fecha),
          contrato: String(r.contrato ?? ""),
          empleado: String(r.empleado ?? ""),
          motivo: normalizarMotivo(r.motivo),
          sector: normalizarSector(r.sector),
          ot: String(r.ot ?? ""),
          ot_em: String(r.ot_em ?? ""),
          ot_em2: String(r.ot_em2 ?? ""),
          hh_normales: nor.hora, hh_50: e50.hora, hh_100: e100.hora,
          estado: (["Pendiente","En revisión","Corregido"].includes(String(r.estado)) ? r.estado : "Pendiente") as "Pendiente"|"En revisión"|"Corregido",
          observaciones: String(r.observaciones ?? ""),
          insa, polu, noct,
        };
      });

      // Delete existing records based on mode
      if (mode === "replace_all") {
        await deleteAll();
        toast("Base de datos limpiada", { icon: "🗑️" });
      } else if (mode === "replace_date") {
        // Get unique dates from the file
        const fechas = [...new Set(mapped.map(r => r.fecha))];
        await Promise.all(fechas.map(f => deleteByFecha(f)));
        toast(`${fechas.length} fecha(s) reemplazada(s)`, { icon: "🔄" });
      }

      await onImport(mapped);
      toast.success(`${mapped.length} registros importados`);
    } catch (err) {
      console.error(err);
      toast.error("Error al procesar el archivo");
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, mode: ImportMode) => {
    const f = e.target.files?.[0];
    if (f) processFile(f, mode);
  };

  return (
    <>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
        onChange={e => handleFileChange(e, "replace_date")} />

      {/* Confirm dialogs */}
      {showConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: "rgba(13,27,42,0.92)" }}>
          <div className="rounded-lg p-6 w-full max-w-sm fade-in"
            style={{ background: "#1a2f47", border: "1px solid #3a5a80" }}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                  {showConfirm === "reset_all" ? "Eliminar TODOS los registros" : `Eliminar registros del ${currentFecha}`}
                </p>
                <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>
                  {showConfirm === "reset_all"
                    ? "Esta acción borrará permanentemente todos los datos de la base. No se puede deshacer."
                    : "Se eliminarán todos los registros de esta fecha. No se puede deshacer."}
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button className="btn btn-ghost" onClick={() => setShowConfirm(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={async () => {
                setShowConfirm(null);
                setLoading(true);
                try {
                  if (showConfirm === "reset_all") {
                    await deleteAll();
                    toast.success("Base de datos limpiada");
                    onReset?.();
                  } else {
                    await deleteByFecha(currentFecha);
                    toast.success(`Registros del ${currentFecha} eliminados`);
                    onReset?.();
                  }
                } catch { toast.error("Error al eliminar"); }
                finally { setLoading(false); }
              }}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Button group */}
      <div className="relative flex items-center">
        {/* Main import button */}
        <button className="btn btn-ghost rounded-r-none border-r-0" disabled={loading}
          onClick={() => fileRef.current?.click()}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          {loading ? "Importando…" : "Importar Excel"}
        </button>

        {/* Dropdown arrow */}
        <button
          className="btn btn-ghost rounded-l-none px-2"
          onClick={() => setShowMenu(m => !m)}
          disabled={loading}
          title="Más opciones de importación"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-full mt-1 z-50 rounded-md shadow-2xl overflow-hidden"
              style={{ background: "#1a2f47", border: "1px solid #3a5a80", minWidth: 260 }}>

              {/* Import modes */}
              <div className="px-3 py-2 border-b" style={{ borderColor: "#2a4060" }}>
                <p className="text-[9px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                  Importar Excel
                </p>
                <label className="flex items-start gap-3 px-2 py-2 rounded cursor-pointer hover:bg-[#203a58] transition-colors">
                  <input type="file" accept=".xlsx,.xls,.csv" className="hidden"
                    onChange={e => { setShowMenu(false); handleFileChange(e, "replace_date"); }} />
                  <div className="w-5 h-5 rounded flex items-center justify-center mt-0.5 flex-shrink-0"
                    style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>Reemplazar por fecha</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>Borra los registros de cada fecha del Excel antes de importar. Evita duplicados.</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 px-2 py-2 rounded cursor-pointer hover:bg-[#203a58] transition-colors mt-1">
                  <input type="file" accept=".xlsx,.xls,.csv" className="hidden"
                    onChange={e => { setShowMenu(false); handleFileChange(e, "append"); }} />
                  <div className="w-5 h-5 rounded flex items-center justify-center mt-0.5 flex-shrink-0"
                    style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>Agregar sin reemplazar</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>Agrega los registros nuevos sin tocar los existentes.</p>
                  </div>
                </label>
              </div>

              {/* Danger zone */}
              <div className="px-3 py-2">
                <p className="text-[9px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                  Limpiar datos
                </p>
                <button
                  className="flex items-start gap-3 px-2 py-2 rounded w-full text-left hover:bg-[#203a58] transition-colors"
                  onClick={() => { setShowMenu(false); setShowConfirm("reset_date"); }}
                >
                  <div className="w-5 h-5 rounded flex items-center justify-center mt-0.5 flex-shrink-0"
                    style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium" style={{ color: "#f59e0b" }}>
                      Eliminar fecha seleccionada
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Borra todos los registros del {currentFecha || "día seleccionado"}.
                    </p>
                  </div>
                </button>
                <button
                  className="flex items-start gap-3 px-2 py-2 rounded w-full text-left hover:bg-[#203a58] transition-colors mt-1"
                  onClick={() => { setShowMenu(false); setShowConfirm("reset_all"); }}
                >
                  <div className="w-5 h-5 rounded flex items-center justify-center mt-0.5 flex-shrink-0"
                    style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium" style={{ color: "#ef4444" }}>Restablecer todo</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>Elimina absolutamente todos los registros de la base de datos.</p>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
