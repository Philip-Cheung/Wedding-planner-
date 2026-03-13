-- RPCs for accepting invites and share links (called when user is authenticated)

create or replace function public.accept_invite_by_token(p_token text)
returns jsonb as $$
declare
  v_invite record;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'not_authenticated');
  end if;

  select * into v_invite from public.wedding_invites
  where token = p_token and status = 'pending' and expires_at > now();

  if found then
    insert into public.wedding_collaborators (wedding_id, user_id, role, invited_by)
    values (v_invite.wedding_id, v_user_id, v_invite.role, v_invite.invited_by)
    on conflict (wedding_id, user_id) do nothing;

    update public.wedding_invites set status = 'accepted', accepted_at = now() where id = v_invite.id;

    return jsonb_build_object('success', true, 'wedding_id', v_invite.wedding_id);
  end if;

  return jsonb_build_object('success', false, 'error', 'invalid_or_expired');
end;
$$ language plpgsql security definer;

create or replace function public.accept_share_link_by_token(p_token text)
returns jsonb as $$
declare
  v_link record;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'not_authenticated');
  end if;

  select * into v_link from public.wedding_share_links
  where token = p_token and revoked_at is null and expires_at > now();

  if found then
    insert into public.wedding_collaborators (wedding_id, user_id, role)
    values (v_link.wedding_id, v_user_id, 'collaborator')
    on conflict (wedding_id, user_id) do nothing;

    return jsonb_build_object('success', true, 'wedding_id', v_link.wedding_id);
  end if;

  return jsonb_build_object('success', false, 'error', 'invalid_or_expired');
end;
$$ language plpgsql security definer;
