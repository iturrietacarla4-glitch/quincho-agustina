-- =====================================================================
-- El Quincho de Agustina · Pagos por reserva (ejecutar una vez en SQL Editor)
-- Una fila por fecha reservada: valor total, abonos y saldo. Solo administradores.
-- =====================================================================
create table if not exists public.pagos (
  fecha date primary key,
  cliente text check (char_length(cliente) <= 120),
  telefono text check (char_length(telefono) <= 25),
  personas int check (personas >= 0),
  horario text check (char_length(horario) <= 60),
  incluye text check (char_length(incluye) <= 600),
  notas text check (char_length(notas) <= 600),
  total int not null default 0 check (total >= 0),
  abonos jsonb not null default '[]'::jsonb check (jsonb_typeof(abonos) = 'array'),
  solicitud uuid references public.solicitudes(id) on delete set null,
  actualizado timestamptz not null default now(),
  actualizado_por text
);
alter table public.pagos enable row level security;
drop policy if exists pagos_admin on public.pagos;
create policy pagos_admin on public.pagos for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Historial (respaldo) de todo cambio en pagos
drop trigger if exists hist_pagos on public.pagos;
create trigger hist_pagos after insert or update or delete on public.pagos for each row execute function public.registrar_historial();
