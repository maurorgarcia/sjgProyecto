"use client";
import * as XLSX from "xlsx";
import type { TimeError } from "@/types";

interface Props { data: TimeError[]; fecha: string; }

export default function ExportExcel({ data, fecha }: Props) {
  const handleExport = () => {
    if (!data.length) return;

    const rows = data.map((r) => ({
      "Fecha":           r.fecha,
      "Día":             r.dia || "",
      "Contrato":        r.contrato,
      "Apellido y Nombre": r.empleado,
      "Motivo":          r.motivo,
      "Área / Sector":   r.sector,
      "OT":              r.ot,
      "OT Em.":          r.ot_em,
      "OT Em.2":         r.ot_em2,
      "HH Nor.":         r.hh_normales,
      "HH E.50%":        r.hh_50,
      "HH E.100%":       r.hh_100,
      "INSA":            r.insa !== "00:00" ? r.insa : "",
      "POLU":            r.polu !== "00:00" ? r.polu : "",
      "NOCT":            r.noct !== "00:00" ? r.noct : "",
      "Estado":          r.estado,
      "Observaciones":   r.observaciones,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Column widths
    ws["!cols"] = [
      { wch: 12 }, { wch: 6 }, { wch: 14 }, { wch: 24 }, { wch: 26 },
      { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
      { wch: 8 }, { wch: 8 }, { wch: 8 },
      { wch: 8 }, { wch: 8 }, { wch: 8 },
      { wch: 12 }, { wch: 28 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fichadas");
    const fileName = `fichadas_${fecha || "todos"}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <button className="btn btn-ghost" onClick={handleExport} disabled={!data.length} title="Exportar registros filtrados a Excel">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Exportar
    </button>
  );
}
