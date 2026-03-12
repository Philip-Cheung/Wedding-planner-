-- RLS policies for wedding-related tables
-- Uses user_can_access_wedding() from 00001

-- Onboarding: users access own progress only
create policy "Users access own onboarding" on public.onboarding_progress for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Milestones: owner/co-planner of wedding
create policy "Milestone access" on public.milestones for all
  using (public.user_can_access_wedding(wedding_id, auth.uid()))
  with check (public.user_can_access_wedding(wedding_id, auth.uid()));

-- Tasks: owner/co-planner of wedding
create policy "Task access" on public.tasks for all
  using (public.user_can_access_wedding(wedding_id, auth.uid()))
  with check (public.user_can_access_wedding(wedding_id, auth.uid()));

-- Guests: owner/co-planner of wedding
create policy "Guest access" on public.guests for all
  using (public.user_can_access_wedding(wedding_id, auth.uid()))
  with check (public.user_can_access_wedding(wedding_id, auth.uid()));

-- Guest tags: owner/co-planner of wedding
create policy "Guest tag access" on public.guest_tags for all
  using (public.user_can_access_wedding(wedding_id, auth.uid()))
  with check (public.user_can_access_wedding(wedding_id, auth.uid()));

-- Guest tag assignments: via guest's wedding
create policy "Guest tag assignment access" on public.guest_tag_assignments for all
  using (
    exists (
      select 1 from public.guests g
      where g.id = guest_id and public.user_can_access_wedding(g.wedding_id, auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.guests g
      where g.id = guest_id and public.user_can_access_wedding(g.wedding_id, auth.uid())
    )
  );

-- Message templates: owner/co-planner of wedding
create policy "Message template access" on public.message_templates for all
  using (public.user_can_access_wedding(wedding_id, auth.uid()))
  with check (public.user_can_access_wedding(wedding_id, auth.uid()));

-- Messages: owner/co-planner of wedding
create policy "Message access" on public.messages for all
  using (public.user_can_access_wedding(wedding_id, auth.uid()))
  with check (public.user_can_access_wedding(wedding_id, auth.uid()));

-- Message recipients: via message's wedding
create policy "Message recipient access" on public.message_recipients for all
  using (
    exists (
      select 1 from public.messages m
      where m.id = message_id and public.user_can_access_wedding(m.wedding_id, auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.messages m
      where m.id = message_id and public.user_can_access_wedding(m.wedding_id, auth.uid())
    )
  );

-- Website themes: read-only for all (shared reference data)
create policy "Website theme read" on public.website_themes for select using (true);

-- Website pages: owner/co-planner of wedding
create policy "Website page access" on public.website_pages for all
  using (public.user_can_access_wedding(wedding_id, auth.uid()))
  with check (public.user_can_access_wedding(wedding_id, auth.uid()));

-- Website sections: via page's wedding
create policy "Website section access" on public.website_sections for all
  using (
    exists (
      select 1 from public.website_pages p
      where p.id = page_id and public.user_can_access_wedding(p.wedding_id, auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.website_pages p
      where p.id = page_id and public.user_can_access_wedding(p.wedding_id, auth.uid())
    )
  );

-- Website assets: owner/co-planner of wedding
create policy "Website asset access" on public.website_assets for all
  using (public.user_can_access_wedding(wedding_id, auth.uid()))
  with check (public.user_can_access_wedding(wedding_id, auth.uid()));
