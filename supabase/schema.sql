
create extension if not exists pgcrypto;
create table if not exists public.employees (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(trim(name))>0),
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.leave_types (
 id uuid primary key default gen_random_uuid(),
 name text not null unique check(length(trim(name))>0),
 color text not null default '#4776c5',
 active boolean not null default true
);
create table if not exists public.leave_requests (
 id uuid primary key default gen_random_uuid(),
 employee_id uuid not null references public.employees(id) on delete restrict,
 leave_type_id uuid not null references public.leave_types(id) on delete restrict,
 start_date date not null,
 end_date date not null,
 reason text not null check(length(trim(reason))>0),
 notes text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint valid_date_range check(end_date>=start_date)
);
create index if not exists leave_requests_dates_idx on public.leave_requests(start_date,end_date);
insert into public.leave_types(name,color) values
 ('ลาป่วย','#dc6262'),('ลากิจ','#e49a3a'),('ลาพักร้อน','#3a9b79'),
 ('ลาไม่รับค่าจ้าง','#7b70c7'),('ลาคลอด','#d66ea8'),('ลาเพื่อดูแลครอบครัว','#bc7d52'),
 ('ลาเพื่อรับราชการทหาร','#64748b'),('ลาเพื่อฝึกอบรม','#3988b9'),
 ('วันหยุดชดเชย','#299eae'),('อื่น ๆ','#7c8798')
on conflict(name) do nothing;
alter table public.employees enable row level security;
alter table public.leave_types enable row level security;
alter table public.leave_requests enable row level security;
-- นโยบายสาธารณะตามความต้องการ: ทุกคนที่มีลิงก์สามารถดู/เพิ่ม/แก้ไข/ลบได้
-- ห้ามใช้กับข้อมูลละเอียดอ่อนโดยไม่เพิ่มระบบยืนยันตัวตน/สิทธิ์
do $$ declare t text; op text; begin
 foreach t in array array['leave_types','leave_requests'] loop
  execute format('drop policy if exists "public_all_%s" on public.%I',t,t);
  execute format('create policy "public_all_%s" on public.%I for all to anon, authenticated using (true) with check (true)',t,t);
 end loop;
end $$;
grant usage on schema public to anon, authenticated;
grant select,insert,update,delete on public.employees,public.leave_types,public.leave_requests to anon,authenticated;

-- Employee writes are performed by the Vercel API after server-side Admin authentication.
drop policy if exists "public_all_employees" on public.employees;
