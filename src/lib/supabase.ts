import { createClient } from "@supabase/supabase-js";
import type { TimeError } from "@/types";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function fetchTimeErrors(fecha?: string) {
  let q = supabase.from("time_errors").select("*").order("fecha", { ascending: false }).order("created_at", { ascending: false });
  if (fecha) q = q.eq("fecha", fecha);
  const { data, error } = await q;
  if (error) throw error;
  return data as TimeError[];
}

export async function insertTimeError(row: Omit<TimeError, "id"|"created_at"|"updated_at"|"dia">) {
  const { data, error } = await supabase.from("time_errors").insert(row).select().single();
  if (error) throw error;
  return data as TimeError;
}

export async function updateTimeError(id: string, updates: Partial<TimeError>, prevValues?: Partial<TimeError>) {
  const { data, error } = await supabase.from("time_errors").update(updates).eq("id", id).select().single();
  if (error) throw error;
  // Write history for each changed field
  if (prevValues) {
    const entries = Object.entries(updates).map(([campo, valor_nuevo]) => ({
      record_id: id,
      campo,
      valor_anterior: String((prevValues as Record<string, unknown>)[campo] ?? ""),
      valor_nuevo: String(valor_nuevo ?? ""),
    }));
    if (entries.length) await supabase.from("time_errors_history").insert(entries);
  }
  return data as TimeError;
}

export async function deleteTimeError(id: string) {
  const { error } = await supabase.from("time_errors").delete().eq("id", id);
  if (error) throw error;
}

export async function duplicateTimeError(row: TimeError) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, created_at, updated_at, dia, ...rest } = row;
  const { data, error } = await supabase.from("time_errors").insert({ ...rest, estado: "Pendiente" }).select().single();
  if (error) throw error;
  return data as TimeError;
}

export async function bulkInsertTimeErrors(rows: Omit<TimeError, "id"|"created_at"|"updated_at"|"dia">[]) {
  const { data, error } = await supabase.from("time_errors").insert(rows).select();
  if (error) throw error;
  return data as TimeError[];
}

export async function fetchHistory(recordId: string) {
  const { data, error } = await supabase
    .from("time_errors_history")
    .select("*")
    .eq("record_id", recordId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as { id: string; campo: string; valor_anterior: string; valor_nuevo: string; usuario: string; created_at: string }[];
}

export async function deleteByFecha(fecha: string) {
  const { error } = await supabase.from("time_errors").delete().eq("fecha", fecha);
  if (error) throw error;
}

export async function deleteAll() {
  const { error } = await supabase.from("time_errors").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw error;
}
