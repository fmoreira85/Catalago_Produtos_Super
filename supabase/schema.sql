create extension if not exists pgcrypto;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.promotions (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  category text not null,
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  original_price numeric(10,2) not null default 0 check (original_price >= 0),
  image text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (original_price = 0 or original_price >= price)
);

create table if not exists public.store_settings (
  id text primary key default 'main',
  store_name text not null,
  whatsapp_number text not null,
  created_at timestamptz not null default now(),
  check (id = 'main')
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at_column();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'viewer')
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

alter table public.promotions enable row level security;
alter table public.store_settings enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "Public can read active promotions" on public.promotions;
create policy "Public can read active promotions"
on public.promotions
for select
using (active = true or public.is_admin());

drop policy if exists "Admins can insert promotions" on public.promotions;
create policy "Admins can insert promotions"
on public.promotions
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update promotions" on public.promotions;
create policy "Admins can update promotions"
on public.promotions
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete promotions" on public.promotions;
create policy "Admins can delete promotions"
on public.promotions
for delete
to authenticated
using (public.is_admin());

drop policy if exists "Anyone can read store settings" on public.store_settings;
create policy "Anyone can read store settings"
on public.store_settings
for select
using (true);

drop policy if exists "Admins can insert store settings" on public.store_settings;
create policy "Admins can insert store settings"
on public.store_settings
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update store settings" on public.store_settings;
create policy "Admins can update store settings"
on public.store_settings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'promotion-images',
  'promotion-images',
  true,
  3145728,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view promotion images" on storage.objects;
create policy "Public can view promotion images"
on storage.objects
for select
using (bucket_id = 'promotion-images');

drop policy if exists "Admins can upload promotion images" on storage.objects;
create policy "Admins can upload promotion images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'promotion-images'
  and public.is_admin()
);

drop policy if exists "Admins can update promotion images" on storage.objects;
create policy "Admins can update promotion images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'promotion-images'
  and public.is_admin()
)
with check (
  bucket_id = 'promotion-images'
  and public.is_admin()
);

drop policy if exists "Admins can delete promotion images" on storage.objects;
create policy "Admins can delete promotion images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'promotion-images'
  and public.is_admin()
);

insert into public.store_settings (id, store_name, whatsapp_number)
values ('main', 'Super Ofertas', '5565999999999')
on conflict (id) do update
set store_name = excluded.store_name,
    whatsapp_number = excluded.whatsapp_number;

insert into public.promotions (id, name, category, description, price, original_price, image, active)
values
  (
    'seed-banana',
    'Banana Prata',
    'Hortifruti',
    'Cacho selecionado, ideal para o café da manhã.',
    5.99,
    7.49,
    '',
    true
  ),
  (
    'seed-arroz',
    'Arroz Tipo 1 5kg',
    'Mercearia',
    'Pacote econômico para a despensa da semana.',
    22.90,
    27.50,
    '',
    true
  ),
  (
    'seed-detergente',
    'Detergente Neutro 500ml',
    'Limpeza',
    'Limpeza prática para a rotina da casa.',
    2.79,
    3.50,
    '',
    true
  )
on conflict (id) do nothing;
