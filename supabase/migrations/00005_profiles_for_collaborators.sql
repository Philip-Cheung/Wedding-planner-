-- Allow users to view profiles of others who share a wedding with them
create or replace function public.users_share_wedding(user_a uuid, user_b uuid)
returns boolean as $$
  select exists (
    select 1 from public.weddings w
    where (w.owner_user_id = user_a or w.co_planner_user_id = user_a or
           exists (select 1 from public.wedding_collaborators wc where wc.wedding_id = w.id and wc.user_id = user_a))
    and (w.owner_user_id = user_b or w.co_planner_user_id = user_b or
         exists (select 1 from public.wedding_collaborators wc where wc.wedding_id = w.id and wc.user_id = user_b))
  );
$$ language sql security definer;

create policy "Users can view profiles in same wedding" on public.profiles for select
  using (id = auth.uid() or public.users_share_wedding(auth.uid(), id));
