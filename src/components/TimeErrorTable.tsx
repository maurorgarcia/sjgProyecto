"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useReactTable, getCoreRowModel, getFilteredRowModel, getSortedRowModel,
  flexRender, createColumnHelper, type ColumnDef, type FilterFn, type SortingState } from "@tanstack/react-table";
import toast from "react-hot-toast";
import { supabase, fetchTimeErrors, insertTimeError, updateTimeError,
  deleteTimeError, duplicateTimeError, bulkInsertTimeErrors } from "@/lib/supabase";
import type { TimeError, FilterState, Estado } from "@/types";
import EditableCell from "./EditableCell";
import StatusBadge from "./StatusBadge";
import ImportExcel from "./ImportExcel";
import ExportExcel from "./ExportExcel";
import AddRowModal from "./AddRowModal";
import HistoryModal from "./HistoryModal";
import ComplementEditor from "./ComplementEditor";

export const MOTIVOS = [
  "Par de fichada incompleto",
  "Omisión",
  "Saldo Insuficiente",
  "OT inexistente",
  "Falta parte",
  "Falta cargar",
];

export const SECTORES = [
  "Mecánica",
  "Eléctrica",
  "Instrumentos",
  "Civil",
  "Aislación",
  "Pintura",
  "Andamios",
  "Pañol/Logística",
  "Coordinación",
  "Puesto Fijo",
  "RRHH",
  "Administración",
];

const FALTANTE_MOTIVOS = ["Falta parte", "Falta cargar"];
export const CONTRATOS = ["6700248017","6700302926"];

function diaES(fecha: string) {
  if (!fecha) return "—";
  const d = new Date(fecha + "T12:00:00");
  const n = d.toLocaleDateString("es-AR", { weekday: "long" });
  return n.charAt(0).toUpperCase() + n.slice(1, 3);
}

function toHHMM(v: string) {
  return (!v || v === "00:00") ? "—" : v;
}

function SortIcon({ dir }: { dir: "asc"|"desc"|false }) {
  if (!dir) return <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor" style={{ opacity: 0.2 }}><path d="M4 0L8 4H0z"/><path d="M4 10L0 6h8z"/></svg>;
  return <svg width="8" height="5" viewBox="0 0 8 5" fill="currentColor" style={{ color: "var(--accent)", transform: dir==="desc"?"rotate(180deg)":"none" }}><path d="M4 0L8 5H0z"/></svg>;
}

function SH({ col, label }: { col: { getToggleSortingHandler:()=>((e:unknown)=>void)|undefined; getIsSorted:()=>"asc"|"desc"|false; getCanSort:()=>boolean }; label: string }) {
  return col.getCanSort()
    ? <div onClick={col.getToggleSortingHandler()} className="flex items-center gap-1 cursor-pointer select-none w-full whitespace-nowrap">{label}<SortIcon dir={col.getIsSorted()} /></div>
    : <span className="whitespace-nowrap">{label}</span>;
}

const FALTANTE_MOTIVOS_SET = new Set(["Falta parte", "Falta cargar"]);

const gff: FilterFn<TimeError> = (row, _, f: FilterState) => {
  if (f.fecha && row.original.fecha !== f.fecha) return false;
  if (f.estado && row.original.estado !== f.estado) return false;
  if (f.sector && !row.original.sector?.toLowerCase().includes(f.sector.toLowerCase())) return false;
  if (f.motivo && row.original.motivo !== f.motivo) return false;
  if (f.search && !row.original.empleado?.toLowerCase().includes(f.search.toLowerCase())) return false;
  if (f.soloFaltantes && !FALTANTE_MOTIVOS_SET.has(row.original.motivo)) return false;
  return true;
};

const ch = createColumnHelper<TimeError>();

// ─── Mobile card ─────────────────────────────────────────────
function MobileCard({
  row, onUpdate, onDuplicate, onDelete, onHistory,
}: {
  row: TimeError;
  onUpdate: (id: string, f: keyof TimeError, v: unknown) => void;
  onDuplicate: (r: TimeError) => void;
  onDelete: (id: string) => void;
  onHistory: (r: TimeError) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusColor: Record<Estado, string> = {
    "Pendiente": "border-l-amber-500",
    "En revisión": "border-l-blue-400",
    "Corregido": "border-l-green-400",
  };

  return (
    <div className={`rounded-md mb-2 border-l-4 ${statusColor[row.estado as Estado] || "border-l-gray-600"}`}
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderLeftWidth: 4 }}>
      {/* Main row */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{row.empleado || "—"}</p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>
              {row.fecha} · {diaES(row.fecha)} · {row.contrato || "—"}
            </p>
          </div>
          <StatusBadge value={row.estado as Estado} onChange={(v) => onUpdate(row.id, "estado", v)} />
        </div>

        <div className="flex flex-wrap gap-1.5 mb-2">
          {row.motivo && <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>{row.motivo}</span>}
          {row.sector && <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>{row.sector}</span>}
          {row.ot && <span className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>{row.ot}</span>}
        </div>

        {/* Hours summary */}
        <div className="flex gap-3 text-[11px]" style={{ fontFamily: "'DM Mono', monospace" }}>
          {row.hh_normales !== "00:00" && <span style={{ color: "var(--text-secondary)" }}>Nor: <strong style={{ color: "var(--text-primary)" }}>{row.hh_normales}</strong></span>}
          {row.hh_50 !== "00:00" && <span style={{ color: "var(--text-secondary)" }}>50%: <strong style={{ color: "var(--text-primary)" }}>{row.hh_50}</strong></span>}
          {row.hh_100 !== "00:00" && <span style={{ color: "var(--text-secondary)" }}>100%: <strong style={{ color: "var(--text-primary)" }}>{row.hh_100}</strong></span>}
        </div>

        {/* Complements */}
        {(row.insa !== "00:00" || row.polu !== "00:00" || row.noct !== "00:00") && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {row.insa !== "00:00" && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}>INSA {row.insa}</span>}
            {row.polu !== "00:00" && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.25)" }}>POLU {row.polu}</span>}
            {row.noct !== "00:00" && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.25)" }}>NOCT {row.noct}</span>}
          </div>
        )}

        {row.observaciones && (
          <p className="text-[11px] mt-2 italic" style={{ color: "var(--text-muted)" }}>"{row.observaciones}"</p>
        )}

        {/* Actions row */}
        <div className="flex items-center gap-2 mt-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={() => setExpanded(e => !e)} className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
            {expanded ? "▲ Cerrar" : "▼ Editar"}
          </button>
          <div className="flex-1" />
          <button onClick={() => onHistory(row)} className="text-[10px] px-2 py-1 rounded" style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }} title="Historial">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </button>
          <button onClick={() => onDuplicate(row)} className="text-[10px] px-2 py-1 rounded" style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }} title="Duplicar">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <button onClick={() => { if (confirm("¿Eliminar?")) onDelete(row.id); }}
            className="text-[10px] px-2 py-1 rounded" style={{ color: "#ef4444", background: "rgba(239,68,68,0.1)" }} title="Eliminar">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
          </button>
        </div>
      </div>

      {/* Expanded edit */}
      {expanded && (
        <div className="px-3 pb-3 border-t grid grid-cols-2 gap-2" style={{ borderColor: "var(--border)" }}>
          {[
            { label: "Sector", field: "sector" as keyof TimeError, val: row.sector },
            { label: "OT", field: "ot" as keyof TimeError, val: row.ot },
            { label: "OT Em.", field: "ot_em" as keyof TimeError, val: row.ot_em },
            { label: "OT Em.2", field: "ot_em2" as keyof TimeError, val: row.ot_em2 },
            { label: "HH Nor.", field: "hh_normales" as keyof TimeError, val: row.hh_normales },
            { label: "HH 50%", field: "hh_50" as keyof TimeError, val: row.hh_50 },
            { label: "HH 100%", field: "hh_100" as keyof TimeError, val: row.hh_100 },
            { label: "INSA", field: "insa" as keyof TimeError, val: row.insa },
            { label: "POLU", field: "polu" as keyof TimeError, val: row.polu },
            { label: "NOCT", field: "noct" as keyof TimeError, val: row.noct },
          ].map(({ label, field, val }) => (
            <div key={field} className="mt-2">
              <label className="block text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>{label}</label>
              <input type="text" defaultValue={String(val ?? "")}
                onBlur={e => onUpdate(row.id, field, e.target.value)}
                className="w-full bg-transparent border border-[#2a4060] rounded px-2 py-1 text-[11px] text-[#e8f0f8] outline-none focus:border-[#f59e0b]" />
            </div>
          ))}
          <div className="col-span-2 mt-2">
            <label className="block text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Observaciones</label>
            <textarea defaultValue={row.observaciones || ""}
              onBlur={e => onUpdate(row.id, "observaciones", e.target.value)} rows={2}
              className="w-full bg-transparent border border-[#2a4060] rounded px-2 py-1 text-[11px] text-[#e8f0f8] outline-none focus:border-[#f59e0b] resize-none" />
          </div>
        </div>
      )}
    </div>
  );
}


// ─── SectorCell — editable con sugerencias ───────────────────
function SectorCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal]     = useState(value);
  const [flash, setFlash]     = useState(false);
  const inputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => { setLocal(value); }, [value]);
  useEffect(() => { if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, [editing]);

  const commit = () => {
    setEditing(false);
    if (local !== value) {
      onChange(local);
      setFlash(true);
      setTimeout(() => setFlash(false), 800);
    }
  };

  const suggestions = SECTORES.filter(s =>
    local.trim() && s.toLowerCase().includes(local.toLowerCase()) && s.toLowerCase() !== local.toLowerCase()
  ).slice(0, 5);

  if (editing) {
    return (
      <div className="relative w-full h-full">
        <input ref={inputRef} value={local} list="sector-list"
          onChange={e => setLocal(e.target.value)}
          onBlur={() => setTimeout(commit, 120)}
          onKeyDown={e => { if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); commit(); } if (e.key === "Escape") { setLocal(value); setEditing(false); } }}
          className="cell-input"
          placeholder="Escribir o seleccionar…"
          style={{ background: "rgba(245,158,11,0.08)", boxShadow: "inset 0 0 0 1.5px var(--accent)" }}
        />
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 z-50 w-full shadow-xl rounded-b-md overflow-hidden"
            style={{ background: "#1a2f47", border: "1px solid #3a5a80", borderTop: "none" }}>
            {suggestions.map(s => (
              <div key={s} onMouseDown={() => { setLocal(s); setTimeout(commit, 50); }}
                className="px-3 py-1.5 cursor-pointer text-[11px] hover:bg-[#203a58]"
                style={{ color: "var(--text-primary)", fontFamily: "'DM Mono', monospace" }}>
                {s}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div onClick={() => setEditing(true)} className="w-full h-full px-2.5 flex items-center cursor-text select-none"
      style={{
        color: value ? "var(--text-primary)" : "var(--text-muted)",
        background: flash ? "rgba(34,197,94,0.1)" : "transparent",
        transition: "background 0.6s",
        minHeight: 34,
      }}>
      {value ? <span className="truncate text-[11.5px]" style={{ fontFamily: "'DM Mono', monospace" }}>{value}</span>
             : <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>—</span>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function TimeErrorTable() {
  const [data, setData]                 = useState<TimeError[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [historyRow, setHistoryRow]     = useState<TimeError | null>(null);
  const [isMobile, setIsMobile]         = useState(false);
  const [sorting, setSorting]           = useState<SortingState>([{ id: "fecha", desc: true }]);
  const [filters, setFilters]           = useState<FilterState>({
    fecha: new Date().toISOString().slice(0, 10),
    estado: "", sector: "", motivo: "", search: "", soloFaltantes: false,
  });

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Load + realtime
  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await fetchTimeErrors()); }
    catch { toast.error("Error al cargar datos"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ch = supabase.channel("te_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "time_errors" }, (p) => {
        if (p.eventType === "INSERT") setData(d => [p.new as TimeError, ...d]);
        else if (p.eventType === "UPDATE") setData(d => d.map(r => r.id === (p.new as TimeError).id ? p.new as TimeError : r));
        else if (p.eventType === "DELETE") setData(d => d.filter(r => r.id !== (p.old as TimeError).id));
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Handlers
  const handleUpdate = useCallback(async (id: string, field: keyof TimeError, value: unknown) => {
    const prev = data.find(r => r.id === id);
    setData(d => d.map(r => r.id === id ? { ...r, [field]: value } : r));
    try { await updateTimeError(id, { [field]: value } as Partial<TimeError>, prev ? { [field]: (prev as Record<string, unknown>)[field as string] } : undefined); }
    catch { toast.error("Error al guardar"); load(); }
  }, [data, load]);

  const handleAdd = useCallback(async (row: Omit<TimeError,"id"|"created_at"|"updated_at"|"dia">) => {
    try { await insertTimeError(row); toast.success("Registro agregado"); }
    catch { toast.error("Error al agregar"); }
  }, []);

  const handleDuplicate = useCallback(async (row: TimeError) => {
    try { await duplicateTimeError(row); toast.success("Registro duplicado"); }
    catch { toast.error("Error al duplicar"); }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try { await deleteTimeError(id); toast.success("Eliminado"); }
    catch { toast.error("Error al eliminar"); }
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    if (!selectedRows.size) return;
    if (!confirm(`¿Eliminar ${selectedRows.size} registro(s)?`)) return;
    try {
      await Promise.all([...selectedRows].map(handleDelete));
      setSelectedRows(new Set());
    } catch { toast.error("Error al eliminar"); }
  }, [selectedRows, handleDelete]);

  const handleImport = useCallback(async (rows: Omit<TimeError,"id"|"created_at"|"updated_at"|"dia">[]) => {
    await bulkInsertTimeErrors(rows);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const setFilter = (k: keyof FilterState, v: string) => setFilters(f => ({ ...f, [k]: v }));
  const hasActiveFilters = !!(filters.search || filters.estado || filters.sector || filters.motivo || filters.soloFaltantes);

  // Columns
  const selectCell = "w-full h-full bg-transparent border-none outline-none px-2.5 text-[11.5px] cursor-pointer";
  const columns = useMemo<ColumnDef<TimeError, unknown>[]>(() => [
    {
      id: "select", enableSorting: false,
      header: () => <input type="checkbox" className="accent-amber-500 cursor-pointer"
        checked={selectedRows.size === data.length && data.length > 0}
        onChange={e => e.target.checked ? setSelectedRows(new Set(data.map(r => r.id))) : setSelectedRows(new Set())} />,
      cell: ({ row }) => (
        <div className="flex items-center justify-center h-full">
          <input type="checkbox" className="accent-amber-500 cursor-pointer"
            checked={selectedRows.has(row.original.id)}
            onChange={e => setSelectedRows(prev => { const n = new Set(prev); e.target.checked ? n.add(row.original.id) : n.delete(row.original.id); return n; })} />
        </div>
      ), size: 36,
    },
    ch.accessor("fecha", {
      header: ({ column }) => <SH col={column} label="Fecha" />,
      cell: ({ row }) => <EditableCell value={row.original.fecha} type="date" onChange={v => handleUpdate(row.original.id, "fecha", v)} />,
      size: 116, sortingFn: "alphanumeric",
    }),
    { id: "dia", header: "Día", enableSorting: false,
      cell: ({ row }) => <div className="px-2 text-center text-[11px] font-medium" style={{ color: "var(--text-secondary)", fontFamily:"'DM Mono',monospace" }}>{diaES(row.original.fecha)}</div>,
      size: 44 },
    ch.accessor("contrato", {
      header: ({ column }) => <SH col={column} label="Contrato" />,
      cell: ({ row }) => (
        <select value={row.original.contrato} onChange={e => handleUpdate(row.original.id, "contrato", e.target.value)}
          className={selectCell} style={{ color: row.original.contrato ? "var(--text-primary)" : "var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>
          <option value="" style={{ background:"#1a2f47" }}>—</option>
          {CONTRATOS.map(c => <option key={c} value={c} style={{ background:"#1a2f47" }}>{c}</option>)}
        </select>
      ), size: 116,
    }),
    ch.accessor("empleado", {
      header: ({ column }) => <SH col={column} label="Apellido y Nombre" />,
      cell: ({ row }) => <EditableCell value={row.original.empleado} placeholder="García, Juan" onChange={v => handleUpdate(row.original.id, "empleado", v)} />,
      size: 182,
    }),
    ch.accessor("motivo", {
      header: ({ column }) => <SH col={column} label="Motivo" />,
      cell: ({ row }) => (
        <select value={row.original.motivo} onChange={e => handleUpdate(row.original.id, "motivo", e.target.value)}
          className={selectCell} style={{ color: row.original.motivo ? "var(--text-primary)" : "var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>
          <option value="" style={{ background:"#1a2f47" }}>— Seleccionar —</option>
          {MOTIVOS.map(m => <option key={m} value={m} style={{ background:"#1a2f47" }}>{m}</option>)}
        </select>
      ), size: 195,
    }),
    ch.accessor("sector", {
      header: ({ column }) => <SH col={column} label="Área / Sector" />,
      cell: ({ row }) => (
        <SectorCell
          value={row.original.sector}
          onChange={v => handleUpdate(row.original.id, "sector", v)}
        />
      ),
      size: 148,
    }),
    ch.accessor("ot", {
      header: ({ column }) => <SH col={column} label="OT" />,
      cell: ({ row }) => <EditableCell value={row.original.ot} placeholder="OT-XXXX" onChange={v => handleUpdate(row.original.id, "ot", v)} />,
      size: 105,
    }),
    ch.accessor("ot_em", { header: "OT Em.", enableSorting: false,
      cell: ({ row }) => <EditableCell value={row.original.ot_em} onChange={v => handleUpdate(row.original.id, "ot_em", v)} />, size: 86 }),
    ch.accessor("ot_em2", { header: "OT Em.2", enableSorting: false,
      cell: ({ row }) => <EditableCell value={row.original.ot_em2} onChange={v => handleUpdate(row.original.id, "ot_em2", v)} />, size: 86 }),
    ch.accessor("hh_normales", {
      header: ({ column }) => <SH col={column} label="HH Nor." />,
      cell: ({ row }) => <EditableCell value={row.original.hh_normales} placeholder="00:00" align="center" onChange={v => handleUpdate(row.original.id, "hh_normales", v)} />, size: 74 }),
    ch.accessor("hh_50", {
      header: ({ column }) => <SH col={column} label="HH 50%" />,
      cell: ({ row }) => <EditableCell value={row.original.hh_50} placeholder="00:00" align="center" onChange={v => handleUpdate(row.original.id, "hh_50", v)} />, size: 72 }),
    ch.accessor("hh_100", {
      header: ({ column }) => <SH col={column} label="HH 100%" />,
      cell: ({ row }) => <EditableCell value={row.original.hh_100} placeholder="00:00" align="center" onChange={v => handleUpdate(row.original.id, "hh_100", v)} />, size: 76 }),
    {
      id: "complements", header: "Complementos", enableSorting: false,
      cell: ({ row }) => (
        <ComplementEditor row={row.original}
          onSave={vals => { handleUpdate(row.original.id, "insa", vals.insa); handleUpdate(row.original.id, "polu", vals.polu); handleUpdate(row.original.id, "noct", vals.noct); }} />
      ), size: 155,
    },
    ch.accessor("estado", {
      header: ({ column }) => <SH col={column} label="Estado" />,
      cell: ({ row }) => (
        <div className="flex items-center justify-center h-full px-2">
          <StatusBadge value={row.original.estado as Estado} onChange={v => handleUpdate(row.original.id, "estado", v)} />
        </div>
      ), size: 126,
    }),
    ch.accessor("observaciones", { header: "Observaciones", enableSorting: false,
      cell: ({ row }) => <EditableCell value={row.original.observaciones} placeholder="Notas…" onChange={v => handleUpdate(row.original.id, "observaciones", v)} />, size: 170 }),
    {
      id: "actions", header: "", enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-1 h-full px-1">
          <button onClick={() => setHistoryRow(row.original)} title="Historial"
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#203a58] transition-colors" style={{ color: "var(--text-muted)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </button>
          <button onClick={() => handleDuplicate(row.original)} title="Duplicar"
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#203a58] transition-colors" style={{ color: "var(--text-muted)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
        </div>
      ), size: 62,
    },
  ], [data, selectedRows, handleUpdate, handleDuplicate, selectCell]);

  const table = useReactTable({
    data, columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: gff,
    state: { globalFilter: filters, sorting },
    onSortingChange: setSorting,
    onGlobalFilterChange: () => {},
  });

  const filteredRows = table.getRowModel().rows;

  // Stats + totals
  const stats = useMemo(() => {
    const total     = filteredRows.length;
    const pendiente = filteredRows.filter(r => r.original.estado === "Pendiente").length;
    const revision  = filteredRows.filter(r => r.original.estado === "En revisión").length;
    const corregido = filteredRows.filter(r => r.original.estado === "Corregido").length;
    const parseHH = (s: string) => { if (!s || s === "00:00") return 0; const [h,m] = s.split(":").map(Number); return h*60+(m||0); };
    const sumMin = (field: keyof TimeError) => filteredRows.reduce((acc, r) => acc + parseHH(String(r.original[field] ?? "")), 0);
    const fmt = (m: number) => m > 0 ? `${Math.floor(m/60)}:${String(m%60).padStart(2,"0")}` : "—";
    return { total, pendiente, revision, corregido,
      norTotal: fmt(sumMin("hh_normales")),
      e50Total: fmt(sumMin("hh_50")),
      e100Total: fmt(sumMin("hh_100")),
    };
  }, [filteredRows]);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>

      {/* ══ HEADER ══ */}
      <header style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        {/* Top row */}
        <div className="flex items-center justify-between px-4 py-2.5 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/logo-sjg.jpg" alt="SJG" style={{ height: isMobile ? 32 : 44, width:"auto", filter:"invert(1)", mixBlendMode:"screen", flexShrink:0 }} />
            {!isMobile && <>
              <div style={{ width:1, height:28, background:"var(--border)", flexShrink:0 }} />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color:"var(--text-secondary)", fontFamily:"'DM Mono',monospace" }}>Gestión de Horas</p>
                <p className="text-[9px] tracking-wide" style={{ color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>Control de Fichadas</p>
              </div>
            </>}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)" }}>
              <div className="live-dot" />
              {!isMobile && <span className="text-[10px] font-semibold tracking-widest" style={{ color:"#22c55e", fontFamily:"'DM Mono',monospace" }}>EN VIVO</span>}
            </div>
            {!isMobile && <ImportExcel onImport={handleImport} currentFecha={filters.fecha} onReset={load} />}
            {!isMobile && filteredRows.length > 0 && <ExportExcel data={filteredRows.map(r => r.original)} fecha={filters.fecha} />}
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {isMobile ? "" : "Nuevo"}
            </button>
            {selectedRows.size > 0 && (
              <button className="btn btn-danger" onClick={handleDeleteSelected}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                {!isMobile && `Eliminar (${selectedRows.size})`}
              </button>
            )}
            <button onClick={handleLogout} className="btn btn-ghost" title="Cerrar sesión">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>

        {/* Filter row */}
        <div className="px-4 pb-2.5 flex flex-wrap items-center gap-2" style={{ borderTop:"1px solid var(--border)" }}>
          <div className="relative flex items-center">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="absolute left-2.5" style={{ color:"var(--text-muted)", pointerEvents:"none" }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input className="filter-input pl-7 w-44" placeholder="Buscar empleado…"
              value={filters.search} onChange={e => setFilter("search", e.target.value)} />
          </div>

          <div className="flex items-center gap-1">
            <input type="date" className="filter-input" value={filters.fecha} onChange={e => setFilter("fecha", e.target.value)} />
            {filters.fecha && <button onClick={() => setFilter("fecha","")} className="text-[10px] px-1.5 py-1 rounded" style={{ color:"var(--text-muted)", background:"var(--bg-elevated)" }}>✕</button>}
          </div>

          <select className="filter-input" value={filters.estado} onChange={e => setFilter("estado", e.target.value)}>
            <option value="">Todos los estados</option>
            <option>Pendiente</option><option>En revisión</option><option>Corregido</option>
          </select>

          {!isMobile && <>
            <select className="filter-input w-44" value={filters.motivo} onChange={e => setFilter("motivo", e.target.value)}>
              <option value="">Todos los motivos</option>
              {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input className="filter-input w-32" placeholder="Sector…" value={filters.sector} onChange={e => setFilter("sector", e.target.value)} />
          <button
            onClick={() => setFilters(f => ({ ...f, soloFaltantes: !f.soloFaltantes }))}
            className="btn text-[11px] py-1 px-3 flex items-center gap-1.5"
            style={{
              background: filters.soloFaltantes ? "rgba(245,158,11,0.2)" : "transparent",
              border: filters.soloFaltantes ? "1px solid rgba(245,158,11,0.5)" : "1px solid var(--border)",
              color: filters.soloFaltantes ? "#f59e0b" : "var(--text-secondary)",
              borderRadius: 3,
              cursor: "pointer",
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Faltantes
            {filters.soloFaltantes && <span className="text-[10px] font-bold">✓</span>}
          </button>
          </>}

          {hasActiveFilters && (
            <button className="btn btn-ghost text-[11px] py-1" onClick={() => setFilters(f => ({ ...f, estado:"", sector:"", motivo:"", search:"", soloFaltantes: false }))}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Limpiar
            </button>
          )}

          {/* Mobile import */}
          {isMobile && <ImportExcel onImport={handleImport} currentFecha={filters.fecha} onReset={load} />}

          {/* Stats */}
          <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
            <span className="text-[10px]" style={{ color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>{stats.total} reg.</span>
            <div className="w-px h-3" style={{ background:"var(--border)" }} />
            <span className="badge badge-pending">{stats.pendiente}</span>
            <span className="badge badge-review">{stats.revision}</span>
            <span className="badge badge-done">{stats.corregido}</span>
          </div>
        </div>

        {/* Totals bar */}
        {filteredRows.length > 0 && (
          <div className="px-4 pb-2 flex items-center gap-4 flex-wrap" style={{ fontFamily:"'DM Mono',monospace", fontSize:10 }}>
            <span style={{ color:"var(--text-muted)" }}>Totales del período:</span>
            {[
              { label:"HH Nor.", val:stats.norTotal, color:"var(--text-primary)" },
              { label:"HH 50%", val:stats.e50Total, color:"#f59e0b" },
              { label:"HH 100%", val:stats.e100Total, color:"#60a5fa" },
            ].map(({ label, val, color }) => val !== "—" && (
              <span key={label} style={{ color:"var(--text-muted)" }}>
                {label}: <strong style={{ color }}>{val}</strong>
              </span>
            ))}
          </div>
        )}
      </header>

      {/* ══ CONTENT ══ */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3" style={{ color:"var(--text-muted)" }}>
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor:"var(--accent)", borderTopColor:"transparent" }} />
              <span className="text-xs">Cargando datos…</span>
            </div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color:"var(--text-muted)" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.75" style={{ opacity:0.2 }}>
              <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>
            </svg>
            <p className="text-sm font-medium" style={{ color:"var(--text-secondary)" }}>Sin registros</p>
            <p className="text-xs" style={{ color:"var(--text-muted)" }}>
              {hasActiveFilters ? "Probá limpiar los filtros" : "Agregá un registro o importá un Excel"}
            </p>
          </div>
        ) : isMobile ? (
          /* Mobile cards */
          <div className="p-3">
            {filteredRows.map(row => (
              <MobileCard key={row.id} row={row.original}
                onUpdate={handleUpdate} onDuplicate={handleDuplicate}
                onDelete={handleDelete} onHistory={setHistoryRow} />
            ))}
          </div>
        ) : (
          /* Desktop table */
          <table className="timeclock-table">
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(header => (
                    <th key={header.id} style={{ width:header.getSize() }}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {filteredRows.map((row, i) => (
                <tr key={row.id}
                  className={`fade-in ${selectedRows.has(row.original.id) ? "selected" : ""}`}
                  style={{
                    animationDelay:`${Math.min(i*12,200)}ms`,
                    ...(FALTANTE_MOTIVOS.includes(row.original.motivo)
                      ? { borderLeft: "3px solid #f59e0b" }
                      : {}),
                  }}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} style={{ width:cell.column.getSize() }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ══ FOOTER ══ */}
      <footer className="flex-none flex items-center justify-between px-4 py-2 border-t" style={{ background:"var(--bg-surface)", borderColor:"var(--border)" }}>
        <span className="text-[10px]" style={{ color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>
          SJG Montajes Industriales © {new Date().getFullYear()}
        </span>
        <a href="https://www.godreamai.com/" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <span className="text-[10px]" style={{ color:"var(--text-muted)" }}>Desarrollado por</span>
          <img src="/logo-gdai.png" alt="Go Dream AI" style={{ height:28, width:"auto", mixBlendMode:"screen", filter:"brightness(1.6)" }} />
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color:"var(--text-muted)", opacity:0.4 }}>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </footer>

      {showAddModal && <AddRowModal onAdd={handleAdd} onClose={() => setShowAddModal(false)} />}
      {historyRow && <HistoryModal recordId={historyRow.id} empleado={historyRow.empleado} onClose={() => setHistoryRow(null)} />}
    </div>
  );
}
