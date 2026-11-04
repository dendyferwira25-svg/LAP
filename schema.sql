-- Agenda Kerja Tim LAP: schema awal Supabase
-- Jalankan di Supabase Dashboard > SQL Editor > New query.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  department text not null default 'Desain Grafis',
  role text not null default 'staff' check (role in ('staff','head')),
  created_at timestamptz not null default now()
);

create table if not exists public.agenda_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  department text not null,
  assigned_to uuid references public.profiles(id) on delete set null,
  work_date date not null default current_date,
  priority text not null default 'Normal' check (priority in ('Rendah','Normal','Tinggi','Mendesak')),
  status text not null default 'Belum dikerjakan' check (status in ('Belum dikerjakan','Sedang dikerjakan','Selesai','Tertunda')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.agenda_tasks enable row level security;

-- Semua pengguna yang sudah login dapat membaca nama dan bagian rekan kerja
-- agar daftar penanggung jawab dapat ditampilkan. Batasi kolom sensitif: tabel ini
-- hanya berisi nama, bagian, peran, dan waktu pembuatan.
create policy "profiles_select_authenticated" on public.profiles
for select to authenticated
using (true);

-- Pengguna dapat melihat agenda bagian sendiri, agenda yang ditugaskan kepadanya,
-- agenda yang dibuatnya; kepala unit dapat melihat seluruh agenda.
create policy "tasks_select_by_scope" on public.agenda_tasks
for select to authenticated
using (
  created_by = auth.uid() or assigned_to = auth.uid()
  or department = (select p.department from public.profiles p where p.id = auth.uid())
  or exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'head')
);

create policy "tasks_insert_authenticated" on public.agenda_tasks
for insert to authenticated
with check (created_by = auth.uid());

create policy "tasks_update_by_scope" on public.agenda_tasks
for update to authenticated
using (
  created_by = auth.uid() or assigned_to = auth.uid()
  or department = (select p.department from public.profiles p where p.id = auth.uid())
  or exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'head')
)
with check (
  created_by = auth.uid() or assigned_to = auth.uid()
  or department = (select p.department from public.profiles p where p.id = auth.uid())
  or exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'head')
);

-- Catatan: pembuatan akun pengguna dilakukan melalui Supabase Authentication.
-- Setelah akun dibuat, administrator perlu membuat baris profil yang cocok pada public.profiles.
-- Jangan menaruh service_role key di website atau repository.
