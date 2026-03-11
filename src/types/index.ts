export type Estado = "Pendiente" | "En revisión" | "Corregido";

export interface TimeError {
  id: string;
  fecha: string;
  dia: string;
  contrato: string;
  empleado: string;
  motivo: string;
  sector: string;
  ot: string;
  ot_em: string;
  ot_em2: string;
  grupo_id: string | null;
  hh_normales: string;   // formato "HH:MM"
  hh_50: string;
  hh_100: string;
  estado: Estado;
  observaciones: string;
  insa: string;          // formato "HH:MM"
  polu: string;
  noct: string;
  created_at: string;
  updated_at: string;
}

export type TimeErrorInsert = Omit<TimeError, "id" | "created_at" | "updated_at" | "dia">;
export type TimeErrorUpdate = Partial<TimeErrorInsert>;

export interface FilterState {
  fecha: string;
  estado: string;
  sector: string;
  motivo: string;
  search: string;
  soloFaltantes: boolean;
}
