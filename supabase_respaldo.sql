-- =====================================================================
-- El Quincho de Agustina · Respaldo e historial (ejecutar en SQL Editor)
-- Registra TODO cambio en solicitudes y fechas bloqueadas. Nadie puede
-- borrar ni editar el historial desde la app (ni siquiera administradores).
-- =====================================================================
create table if not exists public.historial (
  id bigserial primary key,
  cuando timestamptz not null default now(),
  tabla text not null,
  accion text not null,            -- INSERT / UPDATE / DELETE
  quien text,                      -- correo del administrador o 'cliente'
  datos jsonb,                     -- fila nueva (o la borrada en DELETE)
  antes jsonb                      -- fila anterior en UPDATE
);
create index if not exists historial_cuando_idx on public.historial (cuando desc);
alter table public.historial enable row level security;
drop policy if exists hist_admin_select on public.historial;
create policy hist_admin_select on public.historial for select to authenticated using (public.es_admin());
-- (sin políticas de insert/update/delete: solo el trigger puede escribir)

create or replace function public.registrar_historial() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.historial (tabla, accion, quien, datos, antes)
  values (TG_TABLE_NAME, TG_OP, coalesce(auth.jwt() ->> 'email', 'cliente'),
          case when TG_OP = 'DELETE' then to_jsonb(OLD) else to_jsonb(NEW) end,
          case when TG_OP = 'UPDATE' then to_jsonb(OLD) else null end);
  return coalesce(NEW, OLD);
end $$;

drop trigger if exists hist_solicitudes on public.solicitudes;
create trigger hist_solicitudes after insert or update or delete on public.solicitudes for each row execute function public.registrar_historial();
drop trigger if exists hist_fechas on public.fechas_bloqueadas;
create trigger hist_fechas after insert or update or delete on public.fechas_bloqueadas for each row execute function public.registrar_historial();

-- Permite a administradores restaurar una solicitud borrada (con su estado original)
drop policy if exists sol_admin_insert on public.solicitudes;
create policy sol_admin_insert on public.solicitudes for insert to authenticated with check (public.es_admin());
