-- =============================================================================
-- Trigger : création automatique du profil à l'inscription.
-- Le client passe le rôle et le nom via options.data lors du supabase.auth.signUp().
-- Cela évite le problème RLS lorsque l'email confirm est activée (pas de session
-- immédiate après signUp donc auth.uid() est NULL côté client).
-- =============================================================================

create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_role text;
  v_name text;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'patient');
  if v_role not in ('patient', 'kine') then
    v_role := 'patient';
  end if;

  v_name := nullif(new.raw_user_meta_data->>'display_name', '');

  insert into public.profiles (id, role, display_name, interests)
  values (new.id, v_role, v_name, '[]'::jsonb)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
