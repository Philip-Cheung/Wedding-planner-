-- Only owner can remove collaborators
drop policy if exists "Collaborator access" on public.wedding_collaborators;

create policy "Collaborators select" on public.wedding_collaborators for select
  using (public.user_can_access_wedding(wedding_id, auth.uid()));

create policy "Collaborators insert" on public.wedding_collaborators for insert
  with check (public.user_can_invite_to_wedding(wedding_id, auth.uid()));

create policy "Collaborators update" on public.wedding_collaborators for update
  using (public.user_can_access_wedding(wedding_id, auth.uid()))
  with check (public.user_can_access_wedding(wedding_id, auth.uid()));

create policy "Collaborators delete owner only" on public.wedding_collaborators for delete
  using (public.user_is_wedding_owner(wedding_id, auth.uid()));
