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

-- =====================================================================
-- 6) Mural «Historias que quedan»: recuerdos de visitantes con fotos
-- =====================================================================
create table if not exists public.recuerdos (
  id uuid primary key default gen_random_uuid(),
  creado timestamptz not null default now(),
  nombre text not null check (char_length(nombre) between 2 and 80),
  fecha_visita date check (fecha_visita <= current_date),
  categoria text not null default 'familia' check (categoria in ('familia','cumpleanos','matrimonio','curso','otro')),
  mensaje text not null check (char_length(mensaje) between 5 and 300),
  fotos text[] not null default '{}' check (cardinality(fotos) <= 5),
  consentimiento boolean not null check (consentimiento),
  aparecen_menores boolean not null default false,
  consentimiento_tutor boolean not null default false,
  huella text not null unique,                       -- evita publicaciones duplicadas
  estado text not null default 'pendiente' check (estado in ('pendiente','aprobado','rechazado')),
  destacado boolean not null default false,
  me_encanta int not null default 0 check (me_encanta >= 0),
  revisado_por text,
  constraint fotos_requieren_consentimiento check (not aparecen_menores or consentimiento_tutor)
);
create index if not exists recuerdos_estado_idx on public.recuerdos (estado, creado desc);
alter table public.recuerdos enable row level security;

-- Público: enviar recuerdos (quedan pendientes) y ver solo los aprobados
drop policy if exists rec_insert on public.recuerdos;
create policy rec_insert on public.recuerdos for insert to anon, authenticated
  with check (estado = 'pendiente' and not destacado and me_encanta = 0 and revisado_por is null);
drop policy if exists rec_public_select on public.recuerdos;
create policy rec_public_select on public.recuerdos for select to anon, authenticated using (estado = 'aprobado' or public.es_admin());
drop policy if exists rec_admin_update on public.recuerdos;
create policy rec_admin_update on public.recuerdos for update to authenticated using (public.es_admin()) with check (public.es_admin());
drop policy if exists rec_admin_delete on public.recuerdos;
create policy rec_admin_delete on public.recuerdos for delete to authenticated using (public.es_admin());

-- Antispam: máximo 2 recuerdos por nombre cada 24 h y 20 pendientes nuevos por hora en total
create or replace function public.recuerdos_antispam() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.recuerdos where lower(nombre) = lower(new.nombre) and creado > now() - interval '24 hours') >= 2 then
    raise exception 'Ya recibimos recuerdos de este grupo hoy. Inténtalo mañana.';
  end if;
  if (select count(*) from public.recuerdos where estado = 'pendiente' and creado > now() - interval '1 hour') >= 20 then
    raise exception 'Estamos recibiendo muchos recuerdos. Inténtalo en un rato.';
  end if;
  return new;
end $$;
drop trigger if exists recuerdos_antispam on public.recuerdos;
create trigger recuerdos_antispam before insert on public.recuerdos for each row execute function public.recuerdos_antispam();

-- «Me encanta»: suma o resta 1, solo en recuerdos aprobados
create or replace function public.me_encanta(p_id uuid, p_delta int) returns int
language sql security definer set search_path = public as $$
  update public.recuerdos set me_encanta = greatest(0, me_encanta + case when p_delta > 0 then 1 else -1 end)
  where id = p_id and estado = 'aprobado' returning me_encanta;
$$;
grant execute on function public.me_encanta(uuid, int) to anon, authenticated;

-- Almacenamiento de fotos (privado): JPEG/WebP de hasta 2 MB
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recuerdos', 'recuerdos', false, 2097152, array['image/jpeg','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 2097152, allowed_mime_types = array['image/jpeg','image/webp'];

drop policy if exists rec_fotos_insert on storage.objects;
create policy rec_fotos_insert on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'recuerdos' and (storage.foldername(name))[1] = 'pendientes');
-- Las fotos solo se pueden ver si pertenecen a un recuerdo aprobado (o si eres administrador)
drop policy if exists rec_fotos_select on storage.objects;
create policy rec_fotos_select on storage.objects for select to anon, authenticated
  using (bucket_id = 'recuerdos' and (public.es_admin() or exists (select 1 from public.recuerdos r where r.estado = 'aprobado' and storage.objects.name = any (r.fotos))));
drop policy if exists rec_fotos_delete on storage.objects;
create policy rec_fotos_delete on storage.objects for delete to authenticated using (bucket_id = 'recuerdos' and public.es_admin());
