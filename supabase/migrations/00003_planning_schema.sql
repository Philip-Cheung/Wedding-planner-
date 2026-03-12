-- Planning subnav schema: tasks, guests extensions, vendors, budget, vision board

-- 1. Tasks: rename todo -> not_started
alter type public.task_status rename value 'todo' to 'not_started';

-- 2. Guests: extended columns
alter table public.guests
  add column if not exists guest_of text,
  add column if not exists type text,
  add column if not exists attendance text,
  add column if not exists hotel_rooms int,
  add column if not exists room_type text,
  add column if not exists assigned_role text,
  add column if not exists entree_selection text;

-- 3. Vendors
create table public.vendors (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null,
  category text,
  contract_status text,
  payment_status text,
  contact_person text,
  contact_info text,
  phone text,
  email text,
  notes text,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_vendors_wedding on public.vendors(wedding_id);

alter table public.vendors enable row level security;

create policy "Vendor access" on public.vendors for all
  using (public.user_can_access_wedding(wedding_id, auth.uid()))
  with check (public.user_can_access_wedding(wedding_id, auth.uid()));

-- 4. Budget
create table public.budget_items (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  item text not null,
  category text,
  budget_amount numeric(12,2) default 0,
  paid_amount numeric(12,2) default 0,
  sort_order int default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_budget_items_wedding on public.budget_items(wedding_id);

alter table public.budget_items enable row level security;

create policy "Budget item access" on public.budget_items for all
  using (public.user_can_access_wedding(wedding_id, auth.uid()))
  with check (public.user_can_access_wedding(wedding_id, auth.uid()));

-- 5. Vision board
create table public.vision_board_categories (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.vision_board_items (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid not null references public.vision_board_categories(id) on delete cascade,
  title text,
  image_path text,
  notes text,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_vision_board_categories_wedding on public.vision_board_categories(wedding_id);
create index idx_vision_board_items_category on public.vision_board_items(category_id);

alter table public.vision_board_categories enable row level security;
alter table public.vision_board_items enable row level security;

create policy "Vision board category access" on public.vision_board_categories for all
  using (public.user_can_access_wedding(wedding_id, auth.uid()))
  with check (public.user_can_access_wedding(wedding_id, auth.uid()));

create policy "Vision board item access" on public.vision_board_items for all
  using (
    exists (
      select 1 from public.vision_board_categories c
      where c.id = category_id and public.user_can_access_wedding(c.wedding_id, auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.vision_board_categories c
      where c.id = category_id and public.user_can_access_wedding(c.wedding_id, auth.uid())
    )
  );
