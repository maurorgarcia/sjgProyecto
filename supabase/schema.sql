-- ============================================================
-- SCHEMA v3 — time_errors + historial de cambios
-- ============================================================
create extension if not exists "uuid-ossp";

create table if not exists public.time_errors (
  id            uuid primary key default uuid_generate_v4(),
  fecha         date not null,
  dia           text,
  contrato      text,
  empleado      text not null,
  motivo        text,
  sector        text,
  ot            text,
  ot_em         text,
  ot_em2        text,
  hh_normales   text default '00:00',
  hh_50         text default '00:00',
  hh_100        text default '00:00',
  estado        text not null default 'Pendiente'
    check (estado in ('Pendiente', 'En revisión', 'Corregido')),
  observaciones text,
  insa          text default '00:00',
  polu          text default '00:00',
  noct          text default '00:00',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists set_updated_at on public.time_errors;
create trigger set_updated_at before update on public.time_errors
  for each row execute function public.handle_updated_at();

create index if not exists idx_te_fecha  on public.time_errors (fecha);
create index if not exists idx_te_estado on public.time_errors (estado);

alter table public.time_errors enable row level security;
drop policy if exists "allow_all" on public.time_errors;
create policy "allow_all" on public.time_errors for all using (true) with check (true);
alter publication supabase_realtime add table public.time_errors;

-- Historial
create table if not exists public.time_errors_history (
  id            uuid primary key default uuid_generate_v4(),
  record_id     uuid not null references public.time_errors(id) on delete cascade,
  campo         text not null,
  valor_anterior text,
  valor_nuevo   text,
  usuario       text default 'Sistema',
  created_at    timestamptz not null default now()
);
create index if not exists idx_teh_record on public.time_errors_history (record_id);
alter table public.time_errors_history enable row level security;
drop policy if exists "allow_all_history" on public.time_errors_history;
create policy "allow_all_history" on public.time_errors_history for all using (true) with check (true);

-- Reset: truncate table public.time_errors restart identity cascade;
