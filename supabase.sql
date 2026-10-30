-- =====================================================================
-- El Quincho de Agustina · Base de datos en Supabase
-- Desarrollado por FLUVA
-- Pegar completo en Supabase → SQL Editor → New query → Run
-- =====================================================================

-- 1) Administradores (solo estos correos pueden ver y gestionar solicitudes)
create table if not exists public.admins (
  email text primary key,
  nombre text not null
);
insert into public.admins (email, nombre) values
  ('iturrietacarla4@gmail.com', 'Carla'),
  ('matyast21@gmail.com', 'Matías')
on conflict (email) do nothing;

create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where lower(email) = lower(auth.jwt() ->> 'email'));
$$;

-- 2) Solicitudes de reserva y de cotización de eventos
create table if not exists public.solicitudes (
  id uuid primary key default gen_random_uuid(),
  creado timestamptz not null default now(),
  tipo text not null check (tipo in ('reserva', 'evento')),
  fecha date not null,
  actividad text check (char_length(actividad) <= 120),
  personas int check (personas between 1 and 1000),
  nombre text not null check (char_length(nombre) between 1 and 90),
  telefono text not null check (char_length(telefono) between 9 and 25),
  servicios text check (char_length(servicios) <= 300),
  observaciones text check (char_length(observaciones) <= 600),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aceptada', 'rechazada', 'cotizada')),
  gestionado_por text
);

-- 3) Fechas bloqueadas (lo único que ve el público)
create table if not exists public.fechas_bloqueadas (
  fecha date primary key,
  creado timestamptz not null default now(),
  solicitud uuid references public.solicitudes(id) on delete set null
);

-- 4) Seguridad por filas (RLS)
alter table public.admins enable row level security;
alter table public.solicitudes enable row level security;
alter table public.fechas_bloqueadas enable row level security;

-- admins: solo los administradores pueden ver la lista
drop policy if exists admins_select on public.admins;
create policy admins_select on public.admins for select to authenticated using (public.es_admin());

-- solicitudes: cualquiera puede ENVIAR una solicitud nueva (pendiente); solo admins la ven y gestionan
drop policy if exists sol_insert on public.solicitudes;
create policy sol_insert on public.solicitudes for insert to anon, authenticated
  with check (estado = 'pendiente' and gestionado_por is null and fecha >= current_date);
drop policy if exists sol_admin_select on public.solicitudes;
create policy sol_admin_select on public.solicitudes for select to authenticated using (public.es_admin());
drop policy if exists sol_admin_update on public.solicitudes;
create policy sol_admin_update on public.solicitudes for update to authenticated using (public.es_admin()) with check (public.es_admin());
drop policy if exists sol_admin_delete on public.solicitudes;
create policy sol_admin_delete on public.solicitudes for delete to authenticated using (public.es_admin());

-- fechas bloqueadas: todos las ven (solo la fecha); solo admins agregan o quitan
drop policy if exists fb_public_select on public.fechas_bloqueadas;
create policy fb_public_select on public.fechas_bloqueadas for select to anon, authenticated using (true);
drop policy if exists fb_admin_insert on public.fechas_bloqueadas;
create policy fb_admin_insert on public.fechas_bloqueadas for insert to authenticated with check (public.es_admin());
drop policy if exists fb_admin_delete on public.fechas_bloqueadas;
create policy fb_admin_delete on public.fechas_bloqueadas for delete to authenticated using (public.es_admin());

-- 5) Fechas ya reservadas en la agenda (carga inicial)
insert into public.fechas_bloqueadas (fecha) values
  ('2026-11-21'), ('2026-11-28'),
  ('2026-12-05'), ('2026-12-06'), ('2026-12-12'), ('2026-12-13'),
  ('2026-12-17'), ('2026-12-19'), ('2026-12-25'),
  ('2027-01-03')
on conflict (fecha) do nothing;
