-- Inicialización de esquema + datos base para CiudadAlerta en Supabase
-- Ejecutar en SQL Editor de Supabase con rol de servicio.

create extension if not exists pgcrypto;

create table if not exists public.usuarios (
  id uuid primary key,
  nombre text not null,
  email text not null unique,
  rol text not null default 'ciudadano' check (rol in ('admin', 'ciudadano')),
  created_at timestamptz not null default now()
);

create table if not exists public.categorias (
  id bigint generated always as identity primary key,
  nombre text not null unique,
  icono text,
  color_hex text not null default '#3B82F6' check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  competencia text not null,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.reportes (
  id bigint generated always as identity primary key,
  titulo text not null,
  descripcion text not null,
  categoria_id bigint not null references public.categorias(id),
  latitud double precision not null,
  longitud double precision not null,
  zona text not null,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_proceso', 'resuelto', 'rechazado')),
  area_asignada text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fotos_reporte (
  id bigint generated always as identity primary key,
  reporte_id bigint not null references public.reportes(id) on delete cascade,
  url_imagen text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.historial_estados (
  id bigint generated always as identity primary key,
  reporte_id bigint not null references public.reportes(id) on delete cascade,
  estado_anterior text,
  estado_nuevo text not null check (estado_nuevo in ('pendiente', 'en_proceso', 'resuelto', 'rechazado')),
  admin_id uuid references public.usuarios(id),
  comentario text,
  created_at timestamptz not null default now()
);

create table if not exists public.votos (
  reporte_id bigint not null references public.reportes(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reporte_id, usuario_id)
);

create table if not exists public.notificaciones (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  reporte_id bigint references public.reportes(id) on delete cascade,
  mensaje text not null,
  leida boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_reportes_estado on public.reportes(estado);
create index if not exists idx_reportes_categoria on public.reportes(categoria_id);
create index if not exists idx_reportes_usuario on public.reportes(usuario_id);
create index if not exists idx_notificaciones_usuario on public.notificaciones(usuario_id, leida, created_at desc);

alter table public.usuarios enable row level security;
alter table public.categorias enable row level security;
alter table public.reportes enable row level security;
alter table public.fotos_reporte enable row level security;
alter table public.historial_estados enable row level security;
alter table public.votos enable row level security;
alter table public.notificaciones enable row level security;

create or replace function public.es_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios u
    where u.id = uid
      and u.rol = 'admin'
  );
$$;

revoke all on function public.es_admin(uuid) from public;
grant execute on function public.es_admin(uuid) to anon, authenticated, service_role;

drop policy if exists "usuarios_select_own_or_admin" on public.usuarios;
create policy "usuarios_select_own_or_admin"
on public.usuarios
for select
to authenticated
using (auth.uid() = id or public.es_admin());

drop policy if exists "usuarios_insert_own_or_admin" on public.usuarios;
create policy "usuarios_insert_own_or_admin"
on public.usuarios
for insert
to authenticated
with check (auth.uid() = id or public.es_admin());

drop policy if exists "usuarios_update_own_or_admin" on public.usuarios;
create policy "usuarios_update_own_or_admin"
on public.usuarios
for update
to authenticated
using (auth.uid() = id or public.es_admin())
with check (auth.uid() = id or public.es_admin());

drop policy if exists "categorias_public_read" on public.categorias;
create policy "categorias_public_read"
on public.categorias
for select
to anon, authenticated
using (activa = true or public.es_admin());

drop policy if exists "categorias_admin_write" on public.categorias;
create policy "categorias_admin_write"
on public.categorias
for all
to authenticated
using (public.es_admin())
with check (public.es_admin());

drop policy if exists "reportes_public_read" on public.reportes;
create policy "reportes_public_read"
on public.reportes
for select
to anon, authenticated
using (true);

drop policy if exists "reportes_insert_owner_or_admin" on public.reportes;
create policy "reportes_insert_owner_or_admin"
on public.reportes
for insert
to authenticated
with check (auth.uid() = usuario_id or public.es_admin());

drop policy if exists "reportes_update_owner_or_admin" on public.reportes;
create policy "reportes_update_owner_or_admin"
on public.reportes
for update
to authenticated
using (auth.uid() = usuario_id or public.es_admin())
with check (auth.uid() = usuario_id or public.es_admin());

drop policy if exists "reportes_delete_admin" on public.reportes;
create policy "reportes_delete_admin"
on public.reportes
for delete
to authenticated
using (public.es_admin());

drop policy if exists "fotos_public_read" on public.fotos_reporte;
create policy "fotos_public_read"
on public.fotos_reporte
for select
to anon, authenticated
using (true);

drop policy if exists "fotos_insert_owner_or_admin" on public.fotos_reporte;
create policy "fotos_insert_owner_or_admin"
on public.fotos_reporte
for insert
to authenticated
with check (
  exists (
    select 1
    from public.reportes r
    where r.id = reporte_id
      and (r.usuario_id = auth.uid() or public.es_admin())
  )
);

drop policy if exists "historial_read_owner_or_admin" on public.historial_estados;
create policy "historial_read_owner_or_admin"
on public.historial_estados
for select
to authenticated
using (
  public.es_admin()
  or exists (
    select 1
    from public.reportes r
    where r.id = reporte_id
      and r.usuario_id = auth.uid()
  )
);

drop policy if exists "historial_admin_write" on public.historial_estados;
create policy "historial_admin_write"
on public.historial_estados
for all
to authenticated
using (public.es_admin())
with check (public.es_admin());

drop policy if exists "votos_read_public" on public.votos;
create policy "votos_read_public"
on public.votos
for select
to anon, authenticated
using (true);

drop policy if exists "votos_insert_own_or_admin" on public.votos;
create policy "votos_insert_own_or_admin"
on public.votos
for insert
to authenticated
with check (auth.uid() = usuario_id or public.es_admin());

drop policy if exists "votos_delete_own_or_admin" on public.votos;
create policy "votos_delete_own_or_admin"
on public.votos
for delete
to authenticated
using (auth.uid() = usuario_id or public.es_admin());

drop policy if exists "notificaciones_select_own_or_admin" on public.notificaciones;
create policy "notificaciones_select_own_or_admin"
on public.notificaciones
for select
to authenticated
using (auth.uid() = usuario_id or public.es_admin());

drop policy if exists "notificaciones_insert_admin" on public.notificaciones;
create policy "notificaciones_insert_admin"
on public.notificaciones
for insert
to authenticated
with check (public.es_admin());

drop policy if exists "notificaciones_update_own_or_admin" on public.notificaciones;
create policy "notificaciones_update_own_or_admin"
on public.notificaciones
for update
to authenticated
using (auth.uid() = usuario_id or public.es_admin())
with check (auth.uid() = usuario_id or public.es_admin());

insert into public.usuarios (id, nombre, email, rol)
select '11111111-1111-1111-1111-111111111111', 'Admin CiudadAlerta', 'admin@ciudadalerta.local', 'admin'
where not exists (
  select 1 from public.usuarios where email = 'admin@ciudadalerta.local'
);

insert into public.usuarios (id, nombre, email, rol)
select '22222222-2222-2222-2222-222222222222', 'María Pérez', 'maria@ciudadalerta.local', 'ciudadano'
where not exists (
  select 1 from public.usuarios where email = 'maria@ciudadalerta.local'
);

insert into public.usuarios (id, nombre, email, rol)
select '33333333-3333-3333-3333-333333333333', 'Juan Gómez', 'juan@ciudadalerta.local', 'ciudadano'
where not exists (
  select 1 from public.usuarios where email = 'juan@ciudadalerta.local'
);

insert into public.categorias (nombre, icono, color_hex, competencia, activa)
values
  ('Alumbrado', '💡', '#F59E0B', 'Servicios Públicos', true),
  ('Baches', '🛣️', '#EF4444', 'Obras Públicas', true),
  ('Basura', '🗑️', '#10B981', 'Limpieza Urbana', true),
  ('Seguridad', '🚨', '#3B82F6', 'Seguridad Ciudadana', true)
on conflict (nombre) do update
set icono = excluded.icono,
    color_hex = excluded.color_hex,
    competencia = excluded.competencia,
    activa = excluded.activa;

insert into public.reportes (
  titulo, descripcion, categoria_id, latitud, longitud, zona, usuario_id, estado, area_asignada
)
select
  'Poste sin luz en avenida principal',
  'El poste frente al parque central lleva 4 noches apagado.',
  c.id,
  19.432608,
  -99.133209,
  'Centro',
  '22222222-2222-2222-2222-222222222222',
  'en_proceso',
  'Servicios Públicos'
from public.categorias c
where c.nombre = 'Alumbrado'
  and not exists (
    select 1 from public.reportes r
    where r.titulo = 'Poste sin luz en avenida principal'
  );

insert into public.reportes (
  titulo, descripcion, categoria_id, latitud, longitud, zona, usuario_id, estado
)
select
  'Bache profundo en cruce escolar',
  'Riesgo para motocicletas y bicicletas en hora pico.',
  c.id,
  19.427025,
  -99.167665,
  'Colonia San Miguel',
  '33333333-3333-3333-3333-333333333333',
  'pendiente'
from public.categorias c
where c.nombre = 'Baches'
  and not exists (
    select 1 from public.reportes r
    where r.titulo = 'Bache profundo en cruce escolar'
  );

insert into public.notificaciones (usuario_id, reporte_id, mensaje, leida)
select
  '22222222-2222-2222-2222-222222222222',
  r.id,
  'Tu reporte fue recibido y está siendo atendido.',
  false
from public.reportes r
where r.titulo = 'Poste sin luz en avenida principal'
  and not exists (
    select 1
    from public.notificaciones n
    where n.usuario_id = '22222222-2222-2222-2222-222222222222'
      and n.mensaje = 'Tu reporte fue recibido y está siendo atendido.'
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fotos-reportes',
  'fotos-reportes',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "fotos_reportes_public_read" on storage.objects;
create policy "fotos_reportes_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'fotos-reportes');

drop policy if exists "fotos_reportes_insert_auth" on storage.objects;
create policy "fotos_reportes_insert_auth"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'fotos-reportes'
  and (storage.foldername(name))[1] = 'reportes'
);

drop policy if exists "fotos_reportes_update_owner" on storage.objects;
create policy "fotos_reportes_update_owner"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'fotos-reportes'
  and owner = auth.uid()
)
with check (
  bucket_id = 'fotos-reportes'
  and owner = auth.uid()
);

drop policy if exists "fotos_reportes_delete_owner" on storage.objects;
create policy "fotos_reportes_delete_owner"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'fotos-reportes'
  and owner = auth.uid()
);
