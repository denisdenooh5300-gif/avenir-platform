create table public.avenir_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check(length(display_name) between 1 and 60),
 created_at timestamptz not null default now()
);
create function avenir_private.create_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.avenir_profiles(user_id,display_name) values(new.id,left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''),'Avenir member'),60)) on conflict do nothing;
 return new;
end $$;
revoke all on function avenir_private.create_profile() from public,anon,authenticated;
create trigger avenir_profile_created after insert on auth.users for each row execute function avenir_private.create_profile();
insert into public.avenir_profiles(user_id,display_name) select id,left(coalesce(nullif(trim(raw_user_meta_data->>'display_name'),''),'Avenir member'),60) from auth.users on conflict do nothing;
create table public.avenir_credentials (
 user_id uuid not null references auth.users(id) on delete cascade,provider text not null check(provider in ('massive','barchart','finnhub')),secret_id uuid not null,primary key(user_id,provider)
);
create table public.avenir_conversations (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,title text not null default 'New conversation',created_at timestamptz not null default now()
);
create index avenir_conversation_owner on public.avenir_conversations(user_id,created_at desc);
create table public.avenir_messages (
 id uuid primary key default gen_random_uuid(),conversation_id uuid not null references public.avenir_conversations(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in ('user','assistant')),content text not null,code text,language text,created_at timestamptz not null default now()
);
create index avenir_message_owner on public.avenir_messages(user_id,created_at desc);
create index avenir_message_conversation on public.avenir_messages(conversation_id,created_at);
create table public.avenir_jobs (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,title text not null,instructions text not null,
 interval_minutes integer not null check(interval_minutes between 5 and 1440),enabled boolean not null default false,
 next_run timestamptz not null default now(),created_at timestamptz not null default now()
);
create index avenir_job_owner on public.avenir_jobs(user_id);
create table public.avenir_job_runs (
 id uuid primary key default gen_random_uuid(),job_id uuid not null references public.avenir_jobs(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,
 status text not null check(status in ('running','completed','failed')),report text not null default '',code text,language text,created_at timestamptz not null default now(),finished_at timestamptz
);
create unique index avenir_job_single_run on public.avenir_job_runs(job_id) where status='running';
create index avenir_job_run_owner on public.avenir_job_runs(user_id,created_at desc);
create table public.avenir_posts (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,symbol text not null,direction text not null check(direction in ('Bullish','Bearish','Neutral')),title text not null check(length(title) between 3 and 90),body text not null check(length(body)<=10000),created_at timestamptz not null default now()
);
create index avenir_posts_owner on public.avenir_posts(user_id);
create table public.avenir_comments (
 id uuid primary key default gen_random_uuid(),post_id uuid not null references public.avenir_posts(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,body text not null check(length(body) between 1 and 2000),created_at timestamptz not null default now()
);
create index avenir_comment_post on public.avenir_comments(post_id);
create index avenir_comment_owner on public.avenir_comments(user_id);
create table public.avenir_likes (
 post_id uuid not null references public.avenir_posts(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,primary key(post_id,user_id)
);
create index avenir_like_owner on public.avenir_likes(user_id);
alter table public.avenir_workspace add column revision bigint not null default 1;
do $$ declare t text; begin
 foreach t in array array['avenir_profiles','avenir_credentials','avenir_conversations','avenir_messages','avenir_jobs','avenir_job_runs','avenir_posts','avenir_comments','avenir_likes'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 if t<>'avenir_credentials' then
 execute format('grant select on public.%I to authenticated',t);
 execute format('create policy owner_read on public.%I for select to authenticated using ((select auth.uid())=user_id)',t);
 end if;
 end loop;
end $$;
create function public.avenir_provider_key(p_user uuid,p_provider text,p_key text default null) returns text language plpgsql security definer set search_path='' as $$
declare sid uuid; result text;
begin
 if p_provider not in ('massive','barchart','finnhub') then raise exception 'Invalid provider'; end if;
 select secret_id into sid from public.avenir_credentials where user_id=p_user and provider=p_provider;
 if p_key is not null then
 if sid is null then select vault.create_secret(p_key) into sid; else perform vault.update_secret(sid,p_key); end if;
 insert into public.avenir_credentials values(p_user,p_provider,sid) on conflict(user_id,provider) do update set secret_id=excluded.secret_id;
 return 'saved';
 end if;
 select decrypted_secret into result from vault.decrypted_secrets where id=sid;return result;
end $$;
create function public.avenir_claim_jobs() returns setof public.avenir_jobs language sql security definer set search_path='' as $$
 update public.avenir_jobs set next_run=now()+make_interval(mins=>interval_minutes) where id in (select id from public.avenir_jobs where enabled and next_run<=now() order by next_run for update skip locked limit 5) returning *;
$$;
revoke all on function public.avenir_provider_key(uuid,text,text),public.avenir_claim_jobs() from public,anon,authenticated;
grant execute on function public.avenir_provider_key(uuid,text,text),public.avenir_claim_jobs() to service_role;
create function avenir_private.dispatch_workspace() returns bigint language sql security definer set search_path='' as $$
 select net.http_post(url:='https://czwdcfyaangzvdbusljo.supabase.co/functions/v1/avenir-workspace?action=worker',headers:=jsonb_build_object('Content-Type','application/json','x-avenir-worker',(select decrypted_secret from vault.decrypted_secrets where name='avenir_worker_token')),body:='{}'::jsonb,timeout_milliseconds:=60000)
 where exists(select 1 from public.avenir_jobs where enabled and next_run<=now());
$$;
revoke all on function avenir_private.dispatch_workspace() from public,anon,authenticated;
select cron.schedule('avenir-workspace-jobs','* * * * *','select avenir_private.dispatch_workspace()');
