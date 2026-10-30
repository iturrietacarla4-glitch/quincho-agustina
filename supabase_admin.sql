-- El Quincho de Agustina · Motivo de bloqueo de fechas (ejecutar una vez en SQL Editor)
-- Solo agrega una columna opcional; no modifica ni borra datos existentes.
alter table public.fechas_bloqueadas add column if not exists motivo text check (char_length(motivo) <= 120);
