-- =============================================================================
-- Liaison kiné ↔ patient + messagerie
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: care_links
-- Un lien de soin « officiel » entre un kiné et un patient.
-- Créé lorsqu'un patient utilise un code d'invitation émis par un kiné.
-- -----------------------------------------------------------------------------
create table public.care_links (
  id uuid primary key default gen_random_uuid(),
  kine_id uuid not null references public.profiles(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active','revoked')),
  created_at timestamptz not null default now(),
  unique (kine_id, patient_id)
);

create index care_links_kine_idx on public.care_links(kine_id);
create index care_links_patient_idx on public.care_links(patient_id);

alter table public.care_links enable row level security;

-- Chacun voit ses liens (en tant que kiné ou en tant que patient)
create policy "care_links: read own"
  on public.care_links for select
  to authenticated
  using (auth.uid() = kine_id or auth.uid() = patient_id);

-- Chaque partie peut révoquer un lien (update status -> revoked)
create policy "care_links: participant can update"
  on public.care_links for update
  to authenticated
  using (auth.uid() = kine_id or auth.uid() = patient_id);

-- Chaque partie peut supprimer un lien
create policy "care_links: participant can delete"
  on public.care_links for delete
  to authenticated
  using (auth.uid() = kine_id or auth.uid() = patient_id);

-- Insertion : bloquée directement, passe par la fonction redeem_invitation_code

-- -----------------------------------------------------------------------------
-- Table: invitation_codes
-- Codes courts générés par les kinés pour inviter leurs patients.
-- -----------------------------------------------------------------------------
create table public.invitation_codes (
  code text primary key,
  kine_id uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_by uuid references public.profiles(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index invitation_codes_kine_idx on public.invitation_codes(kine_id);

alter table public.invitation_codes enable row level security;

-- Les kinés voient leurs propres codes
create policy "invitation_codes: kine reads own"
  on public.invitation_codes for select
  to authenticated
  using (auth.uid() = kine_id);

-- Les kinés peuvent révoquer (supprimer) leurs codes
create policy "invitation_codes: kine deletes own"
  on public.invitation_codes for delete
  to authenticated
  using (auth.uid() = kine_id);

-- Insertion via la fonction generate_invitation_code (security definer)

-- -----------------------------------------------------------------------------
-- Table: messages
-- Messagerie simple attachée à un care_link (chat kiné ↔ patient).
-- -----------------------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  care_link_id uuid not null references public.care_links(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(trim(body)) > 0 and length(body) <= 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index messages_care_link_created_idx on public.messages(care_link_id, created_at);

alter table public.messages enable row level security;

-- Lecture : uniquement les participants du lien
create policy "messages: participants can read"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.care_links cl
      where cl.id = care_link_id
        and cl.status = 'active'
        and (cl.kine_id = auth.uid() or cl.patient_id = auth.uid())
    )
  );

-- Envoi : un participant peut envoyer, le sender doit être lui-même
create policy "messages: participants can insert"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.care_links cl
      where cl.id = care_link_id
        and cl.status = 'active'
        and (cl.kine_id = auth.uid() or cl.patient_id = auth.uid())
    )
  );

-- Marquage comme lu : le destinataire peut mettre à jour read_at
create policy "messages: recipient can update read_at"
  on public.messages for update
  to authenticated
  using (
    sender_id <> auth.uid()
    and exists (
      select 1 from public.care_links cl
      where cl.id = care_link_id
        and cl.status = 'active'
        and (cl.kine_id = auth.uid() or cl.patient_id = auth.uid())
    )
  );

-- -----------------------------------------------------------------------------
-- Policy additionnelle sur profiles : kiné et patient liés peuvent se lire
-- (en plus de la policy « self can select » existante, qui est cumulative OR).
-- -----------------------------------------------------------------------------
create policy "profiles: linked parties can read"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.care_links cl
      where cl.status = 'active'
        and (
          (cl.kine_id = auth.uid() and cl.patient_id = profiles.id)
          or (cl.patient_id = auth.uid() and cl.kine_id = profiles.id)
        )
    )
  );

-- -----------------------------------------------------------------------------
-- Policy additionnelle sur program_sessions : le kiné lié voit les séances
-- terminées de son patient (utile pour suivre l'évolution).
-- -----------------------------------------------------------------------------
create policy "program_sessions: linked kine can read"
  on public.program_sessions for select
  to authenticated
  using (
    exists (
      select 1 from public.care_links cl
      where cl.status = 'active'
        and cl.patient_id = program_sessions.patient_id
        and cl.kine_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- RPC: generate_invitation_code()
-- Le kiné appelle cette fonction pour obtenir un code unique à partager.
-- Code de 6 caractères alphanumériques sans confusion I/O/0/1.
-- Valide 7 jours.
-- -----------------------------------------------------------------------------
create or replace function public.generate_invitation_code()
  returns text
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_code text;
  v_kine uuid := auth.uid();
  v_tries int := 0;
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if v_kine is null then
    raise exception 'not_authenticated';
  end if;
  if not public.is_kine(v_kine) then
    raise exception 'only_kine_can_invite';
  end if;

  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_alphabet, floor(random() * length(v_alphabet))::int + 1, 1);
    end loop;

    begin
      insert into public.invitation_codes (code, kine_id) values (v_code, v_kine);
      return v_code;
    exception when unique_violation then
      v_tries := v_tries + 1;
      if v_tries > 20 then
        raise exception 'could_not_generate_unique_code';
      end if;
    end;
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: redeem_invitation_code(code)
-- Le patient saisit le code reçu → crée/réactive le care_link.
-- -----------------------------------------------------------------------------
create or replace function public.redeem_invitation_code(p_code text)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_kine uuid;
  v_patient uuid := auth.uid();
  v_link_id uuid;
  v_code_norm text := upper(trim(p_code));
begin
  if v_patient is null then
    raise exception 'not_authenticated';
  end if;

  select kine_id into v_kine
  from public.invitation_codes
  where code = v_code_norm
    and used_by is null
    and expires_at > now();

  if v_kine is null then
    raise exception 'invalid_or_expired_code';
  end if;

  if v_kine = v_patient then
    raise exception 'cannot_link_to_self';
  end if;

  -- Crée ou réactive un lien existant
  insert into public.care_links (kine_id, patient_id, status)
  values (v_kine, v_patient, 'active')
  on conflict (kine_id, patient_id) do update
    set status = 'active'
  returning id into v_link_id;

  -- Marque le code comme consommé
  update public.invitation_codes
    set used_by = v_patient, used_at = now()
    where code = v_code_norm;

  return v_link_id;
end;
$$;

grant execute on function public.generate_invitation_code() to authenticated;
grant execute on function public.redeem_invitation_code(text) to authenticated;
