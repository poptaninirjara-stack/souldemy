-- SoulDemy: accounts, synced progress, published content, feedback and audio recordings.
-- Run once in the Supabase dashboard (SQL Editor → New query → paste → Run),
-- or with the Supabase CLI: supabase db push.
--
-- Who can do what (enforced by row-level security below):
--   student  reads and writes only their own progress, feedback and recordings.
--   teacher  reads everyone's profiles, progress, feedback and recordings, and writes
--            feedback on recordings. For now teachers see all students; classes exist
--            so they can be assigned later.
--   admin    same as teacher, plus password requests. Creates accounts and sets passwords
--            through the admin-users Edge Function (or scripts/import-users.ts), which
--            use the secret key server-side. Nobody can sign themselves up.
--   anyone   reads published content and may send feedback without signing in.

-- ---------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9][a-z0-9._-]{1,39}$'),
  full_name text not null default '',
  role text not null default 'student' check (role in ('student', 'teacher', 'admin')),
  class_id uuid references public.classes (id) on delete set null,
  -- Set when the admin gives out a password; the app asks the user to choose their own.
  must_change_password boolean not null default true,
  created_at timestamptz not null default now()
);

-- Which classes a teacher looks after. Not used for access yet (teachers see everyone).
create table public.teacher_classes (
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  primary key (teacher_id, class_id)
);

-- True for teachers and admins. security definer so policies can call it without
-- recursing through the profiles policies.
create function public.is_staff() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('teacher', 'admin')
  );
$$;

-- True only for admins (account management, password requests).
create function public.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Called by the app after a user has chosen their own password.
create function public.password_changed() returns void
language sql security definer set search_path = ''
as $$
  update public.profiles set must_change_password = false where id = (select auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Forgot password. Logins are usernames, not real email addresses, so resets go
-- through the admin: the sign-in page files a request, and the admin sets a new
-- password from the Admin page (supabase/functions/admin-users).
-- ---------------------------------------------------------------------------

create table public.password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  note text check (char_length(note) <= 500),
  status text not null default 'open' check (status in ('open', 'done', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index on public.password_reset_requests (status, created_at desc);

-- Anyone can ask, by username. It always succeeds, so it does not reveal which usernames
-- exist, and repeated requests for the same user within an hour are ignored.
create function public.request_password_reset(p_username text, p_note text default null) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid;
begin
  select id into uid from public.profiles where username = lower(trim(p_username));
  if uid is null then
    return;
  end if;
  if exists (
    select 1 from public.password_reset_requests
    where user_id = uid and status = 'open' and created_at > now() - interval '1 hour'
  ) then
    return;
  end if;
  insert into public.password_reset_requests (user_id, note) values (uid, left(nullif(trim(p_note), ''), 500));
end;
$$;

revoke execute on function public.password_changed() from public, anon;
grant execute on function public.password_changed() to authenticated;
grant execute on function public.request_password_reset(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Progress: one row per storage key (visited, attempts, quiz, xp, deck, …),
-- mirroring the app's localStorage keys so the sync layer stays generic.
-- ---------------------------------------------------------------------------

create table public.progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  key text not null check (char_length(key) <= 64),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- ---------------------------------------------------------------------------
-- Published content. scripts/publish-content.ts adds one version per publish;
-- the app reads the newest. Old versions are kept so a publish can be rolled back
-- (delete the bad version row; the previous one becomes the newest).
-- ---------------------------------------------------------------------------

create table public.content_versions (
  id bigint generated always as identity primary key,
  hash text not null,
  git_sha text,
  catalog jsonb not null,
  games jsonb not null,
  -- Every lesson, section, exercise and quiz ID in this version (for the stable-ID check).
  ids text[] not null default '{}',
  published_at timestamptz not null default now()
);

create table public.content_modules (
  version_id bigint not null references public.content_versions (id) on delete cascade,
  module_id text not null,
  data jsonb not null,
  primary key (version_id, module_id)
);

-- ---------------------------------------------------------------------------
-- Feedback and content problem reports
-- ---------------------------------------------------------------------------

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  kind text not null default 'general' check (kind in ('general', 'content', 'bug')),
  page text check (char_length(page) <= 200),
  message text not null check (char_length(message) between 1 and 4000),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Audio recordings (communicative track) and teacher feedback on them.
-- Files live in the private "recordings" bucket under <user_id>/<file>.
-- ---------------------------------------------------------------------------

create table public.recordings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  module_id text not null,
  task_id text not null,
  storage_path text not null unique,
  duration_seconds numeric,
  created_at timestamptz not null default now()
);

create table public.recording_feedback (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid not null references public.recordings (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  comment text not null check (char_length(comment) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index on public.progress (updated_at desc);
create index on public.recordings (user_id, created_at desc);
create index on public.recording_feedback (recording_id);
create index on public.feedback (created_at desc);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.classes enable row level security;
alter table public.profiles enable row level security;
alter table public.teacher_classes enable row level security;
alter table public.progress enable row level security;
alter table public.content_versions enable row level security;
alter table public.content_modules enable row level security;
alter table public.feedback enable row level security;
alter table public.recordings enable row level security;
alter table public.recording_feedback enable row level security;
alter table public.password_reset_requests enable row level security;

-- Password requests: only the admin sees and closes them. Filed through request_password_reset().
create policy "password_reset_requests: admin read" on public.password_reset_requests for select to authenticated
  using (public.is_admin());
create policy "password_reset_requests: admin update" on public.password_reset_requests for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Classes and profiles: you see your own; staff see all. Nobody edits them from the app.
create policy "classes: signed-in read" on public.classes for select to authenticated using (true);
create policy "profiles: own or staff" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_staff());
create policy "teacher_classes: own or staff" on public.teacher_classes for select to authenticated
  using (teacher_id = (select auth.uid()) or public.is_staff());

-- Progress: students write only their own rows; staff read all.
create policy "progress: own or staff read" on public.progress for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());
create policy "progress: own insert" on public.progress for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "progress: own update" on public.progress for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "progress: own delete" on public.progress for delete to authenticated
  using (user_id = (select auth.uid()));

-- Content: public read. Only the publish script (service role) writes.
create policy "content_versions: public read" on public.content_versions for select to anon, authenticated using (true);
create policy "content_modules: public read" on public.content_modules for select to anon, authenticated using (true);

-- Feedback: anyone may send (signed-in users only as themselves); staff read and resolve.
create policy "feedback: send" on public.feedback for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));
create policy "feedback: own or staff read" on public.feedback for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());
create policy "feedback: staff resolve" on public.feedback for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Recordings: students add, see and delete their own; staff see all.
create policy "recordings: own or staff read" on public.recordings for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());
create policy "recordings: own insert" on public.recordings for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "recordings: own delete" on public.recordings for delete to authenticated
  using (user_id = (select auth.uid()));

-- Feedback on recordings: the student who made the recording and staff can read it; staff write it.
create policy "recording_feedback: owner or staff read" on public.recording_feedback for select to authenticated
  using (
    public.is_staff()
    or exists (select 1 from public.recordings r where r.id = recording_id and r.user_id = (select auth.uid()))
  );
create policy "recording_feedback: staff write" on public.recording_feedback for insert to authenticated
  with check (public.is_staff() and teacher_id = (select auth.uid()));
create policy "recording_feedback: author edit" on public.recording_feedback for update to authenticated
  using (teacher_id = (select auth.uid())) with check (teacher_id = (select auth.uid()));
create policy "recording_feedback: author delete" on public.recording_feedback for delete to authenticated
  using (teacher_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Storage bucket for recordings (private; 10 MB per file; audio only)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recordings', 'recordings', false, 10485760, array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav'])
on conflict (id) do nothing;

create policy "recordings bucket: own upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'recordings' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "recordings bucket: own or staff read" on storage.objects for select to authenticated
  using (bucket_id = 'recordings' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_staff()));
create policy "recordings bucket: own delete" on storage.objects for delete to authenticated
  using (bucket_id = 'recordings' and (storage.foldername(name))[1] = (select auth.uid())::text);
