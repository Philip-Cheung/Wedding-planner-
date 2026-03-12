-- Wedding Planner V1 Initial Schema
-- Run with: supabase db push (or supabase migration up)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (populated via Supabase Auth trigger)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz default now()
);

-- Weddings
create type planning_status as enum ('draft', 'in_progress', 'complete');

create table public.weddings (
  id uuid primary key default uuid_generate_v4(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  co_planner_user_id uuid references auth.users(id) on delete set null,
  partner_name text,
  wedding_name text,
  wedding_date date,
  location_city text,
  estimated_guest_count int,
  planning_status planning_status default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Onboarding progress
create table public.onboarding_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wedding_id uuid references public.weddings(id) on delete cascade,
  current_step int default 0,
  status text default 'in_progress' check (status in ('in_progress', 'complete')),
  data_json jsonb default '{}',
  updated_at timestamptz default now()
);

-- Milestones
create table public.milestones (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  title text not null,
  description text,
  sort_order int default 0
);

-- Tasks
create type task_status as enum ('todo', 'in_progress', 'done');
create type assignee_type as enum ('owner', 'co_planner', 'both', 'vendor', 'other');

create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  milestone_id uuid references public.milestones(id) on delete set null,
  title text not null,
  description text,
  status task_status default 'todo',
  due_date date,
  start_date date,
  sort_order int default 0,
  assignee_type assignee_type,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Guests
create type guest_side as enum ('bride', 'groom', 'both', 'other');
create type invite_status as enum ('not_invited', 'invited', 'reminded');
create type rsvp_status as enum ('pending', 'yes', 'no', 'maybe');

create table public.guests (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  first_name text,
  last_name text,
  email text,
  phone text,
  household_name text,
  group_label text,
  side guest_side,
  invite_status invite_status default 'not_invited',
  rsvp_status rsvp_status default 'pending',
  plus_one_allowed boolean default false,
  meal_choice text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Guest tags
create table public.guest_tags (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  label text not null
);

create table public.guest_tag_assignments (
  id uuid primary key default uuid_generate_v4(),
  guest_id uuid not null references public.guests(id) on delete cascade,
  tag_id uuid not null references public.guest_tags(id) on delete cascade,
  unique(guest_id, tag_id)
);

-- Message templates
create table public.message_templates (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null,
  subject text,
  body_html text,
  body_text text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Messages
create type message_status as enum ('draft', 'queued', 'sent', 'delivered', 'failed', 'bounced');

create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  template_id uuid references public.message_templates(id) on delete set null,
  subject text,
  body_html text,
  body_text text,
  status message_status default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.message_recipients (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid not null references public.messages(id) on delete cascade,
  guest_id uuid references public.guests(id) on delete set null,
  email text not null,
  delivery_status text default 'pending',
  provider_message_id text,
  failure_reason text,
  updated_at timestamptz default now()
);

-- Website
create table public.website_themes (
  id uuid primary key default uuid_generate_v4(),
  key text not null unique,
  name text not null,
  description text
);

create table public.website_pages (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  slug text not null,
  title text not null,
  is_published boolean default false,
  sort_order int default 0,
  unique(wedding_id, slug)
);

create table public.website_sections (
  id uuid primary key default uuid_generate_v4(),
  page_id uuid not null references public.website_pages(id) on delete cascade,
  type text not null,
  sort_order int default 0,
  content_json jsonb default '{}',
  style_json jsonb default '{}'
);

create table public.website_assets (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  path text not null,
  alt_text text,
  created_at timestamptz default now()
);

-- Indexes
create index idx_weddings_owner on public.weddings(owner_user_id);
create index idx_weddings_co_planner on public.weddings(co_planner_user_id);
create index idx_tasks_wedding on public.tasks(wedding_id);
create index idx_tasks_milestone on public.tasks(milestone_id);
create index idx_guests_wedding on public.guests(wedding_id);
create index idx_messages_wedding on public.messages(wedding_id);

-- RLS: Wedding access when user is owner or co-planner
create or replace function public.user_can_access_wedding(wedding_id uuid, user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.weddings w
    where w.id = wedding_id
    and (w.owner_user_id = user_id or w.co_planner_user_id = user_id)
  );
$$ language sql security definer;

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.weddings enable row level security;
alter table public.onboarding_progress enable row level security;
alter table public.milestones enable row level security;
alter table public.tasks enable row level security;
alter table public.guests enable row level security;
alter table public.guest_tags enable row level security;
alter table public.guest_tag_assignments enable row level security;
alter table public.message_templates enable row level security;
alter table public.messages enable row level security;
alter table public.message_recipients enable row level security;
alter table public.website_themes enable row level security;
alter table public.website_pages enable row level security;
alter table public.website_sections enable row level security;
alter table public.website_assets enable row level security;

-- Profiles: users can read/update own profile
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Weddings: owner and co-planner have full access
create policy "Wedding access" on public.weddings for all
  using (owner_user_id = auth.uid() or co_planner_user_id = auth.uid());

-- Profiles trigger: create on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
