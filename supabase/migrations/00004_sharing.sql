-- Sharing: collaborators, invites, share links
-- Roles: owner (weddings.owner_user_id), partner, collaborator
-- Owner + partner can invite. Only owner can delete wedding and remove others.

create type collaborator_role as enum ('owner', 'partner', 'collaborator');

create table public.wedding_collaborators (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role collaborator_role not null check (role != 'owner'),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  unique(wedding_id, user_id)
);

create index idx_wedding_collaborators_wedding on public.wedding_collaborators(wedding_id);
create index idx_wedding_collaborators_user on public.wedding_collaborators(user_id);

create table public.wedding_invites (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  email text not null,
  role collaborator_role not null check (role != 'owner'),
  token text not null unique,
  invited_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  accepted_at timestamptz
);

create index idx_wedding_invites_wedding on public.wedding_invites(wedding_id);
create index idx_wedding_invites_token on public.wedding_invites(token);
create index idx_wedding_invites_email on public.wedding_invites(email);

create table public.wedding_share_links (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  token text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz default now(),
  unique(wedding_id)
);

create index idx_wedding_share_links_wedding on public.wedding_share_links(wedding_id);
create index idx_wedding_share_links_token on public.wedding_share_links(token);

-- Migrate existing co_planner to wedding_collaborators as partner
insert into public.wedding_collaborators (wedding_id, user_id, role)
select id, co_planner_user_id, 'partner'::collaborator_role
from public.weddings
where co_planner_user_id is not null
on conflict (wedding_id, user_id) do nothing;

-- Update access function to include collaborators
create or replace function public.user_can_access_wedding(wedding_id uuid, user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.weddings w
    where w.id = wedding_id and w.owner_user_id = user_id
  ) or exists (
    select 1 from public.wedding_collaborators wc
    where wc.wedding_id = wedding_id and wc.user_id = user_id
  ) or exists (
    select 1 from public.weddings w
    where w.id = wedding_id and w.co_planner_user_id = user_id
  );
$$ language sql security definer;

-- Helper: can user invite others? (owner or partner)
create or replace function public.user_can_invite_to_wedding(wedding_id uuid, user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.weddings w
    where w.id = wedding_id and w.owner_user_id = user_id
  ) or exists (
    select 1 from public.wedding_collaborators wc
    where wc.wedding_id = wedding_id and wc.user_id = user_id and wc.role = 'partner'
  ) or exists (
    select 1 from public.weddings w
    where w.id = wedding_id and w.co_planner_user_id = user_id
  );
$$ language sql security definer;

-- Helper: is user the owner?
create or replace function public.user_is_wedding_owner(wedding_id uuid, user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.weddings w
    where w.id = wedding_id and w.owner_user_id = user_id
  );
$$ language sql security definer;

alter table public.wedding_collaborators enable row level security;
alter table public.wedding_invites enable row level security;
alter table public.wedding_share_links enable row level security;

-- Collaborators: accessible if user can access wedding
create policy "Collaborator access" on public.wedding_collaborators for all
  using (public.user_can_access_wedding(wedding_id, auth.uid()))
  with check (public.user_can_access_wedding(wedding_id, auth.uid()));

-- Invites: accessible if user can invite
create policy "Invite access" on public.wedding_invites for all
  using (public.user_can_invite_to_wedding(wedding_id, auth.uid()))
  with check (public.user_can_invite_to_wedding(wedding_id, auth.uid()));

-- Share links: accessible if user can invite (owner or partner)
create policy "Share link access" on public.wedding_share_links for all
  using (public.user_can_invite_to_wedding(wedding_id, auth.uid()))
  with check (public.user_can_invite_to_wedding(wedding_id, auth.uid()));

-- RPC: get primary wedding for user (includes collaborators)
create or replace function public.get_primary_wedding_for_user(p_user_id uuid)
returns setof public.weddings as $$
  select w.* from public.weddings w
  where w.id in (
    select id from public.weddings where owner_user_id = p_user_id or co_planner_user_id = p_user_id
    union
    select wedding_id from public.wedding_collaborators where user_id = p_user_id
  )
  limit 1
$$ language sql security definer;
