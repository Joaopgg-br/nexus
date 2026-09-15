-- Cursos importados são somente leitura para o app; apenas a Edge Function grava.
create table public.moodle_conexoes (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  site_url text not null,
  site_nome text not null,
  moodle_usuario_id bigint not null check (moodle_usuario_id > 0),
  moodle_nome text not null,
  revisao uuid not null default gen_random_uuid(),
  sincronizado_em timestamptz not null default now(),
  unique (site_url, moodle_usuario_id)
);
create table public.moodle_tokens (
  usuario_id uuid primary key references public.moodle_conexoes(usuario_id) on delete cascade,
  token_cifrado text not null
);
create table public.cursos_externos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.moodle_conexoes(usuario_id) on delete cascade,
  moodle_curso_id bigint not null check (moodle_curso_id > 0),
  titulo text not null,
  resumo text not null default '',
  url text not null,
  progresso numeric check (progresso between 0 and 100),
  concluido boolean,
  sincronizado_em timestamptz not null default now(),
  unique (usuario_id, moodle_curso_id)
);
alter table public.moodle_conexoes enable row level security;
alter table public.moodle_tokens enable row level security;
alter table public.cursos_externos enable row level security;
revoke all on public.moodle_conexoes, public.moodle_tokens, public.cursos_externos from public, anon, authenticated;
grant select on public.moodle_conexoes, public.cursos_externos to authenticated;
grant all on public.moodle_conexoes, public.moodle_tokens, public.cursos_externos to service_role;
create policy "Ler propria conexao Moodle" on public.moodle_conexoes for select to authenticated using ((select auth.uid()) = usuario_id);
create policy "Ler proprios cursos externos" on public.cursos_externos for select to authenticated using ((select auth.uid()) = usuario_id);
-- moodle_tokens propositalmente não possui políticas para clientes.

create function public.aplicar_sincronizacao_moodle(
  p_usuario uuid, p_revisao uuid, p_site_url text, p_site_nome text,
  p_moodle_usuario bigint, p_moodle_nome text, p_token_cifrado text, p_cursos jsonb
) returns void language plpgsql security definer set search_path = '' as $$
declare
  atual public.moodle_conexoes%rowtype;
  momento timestamptz := now();
begin
  if p_usuario is null or jsonb_typeof(p_cursos) is distinct from 'array' then
    raise exception 'invalid_snapshot';
  end if;
  -- Serializa operações da conta e rejeita uma resposta antiga após desconectar/reconectar.
  perform pg_advisory_xact_lock(hashtextextended(p_usuario::text, 9152026));
  select * into atual from public.moodle_conexoes where usuario_id = p_usuario;
  if atual.revisao is distinct from p_revisao then raise exception 'revision_conflict'; end if;
  if atual.usuario_id is not null and (atual.site_url <> p_site_url or atual.moodle_usuario_id <> p_moodle_usuario) then
    raise exception 'account_changed';
  end if;
  insert into public.moodle_conexoes (usuario_id, site_url, site_nome, moodle_usuario_id, moodle_nome, sincronizado_em)
  values (p_usuario, p_site_url, p_site_nome, p_moodle_usuario, p_moodle_nome, momento)
  on conflict (usuario_id) do update set site_nome = excluded.site_nome, moodle_nome = excluded.moodle_nome,
    sincronizado_em = momento, revisao = gen_random_uuid();
  insert into public.moodle_tokens (usuario_id, token_cifrado) values (p_usuario, p_token_cifrado)
  on conflict (usuario_id) do update set token_cifrado = excluded.token_cifrado;

  -- Registra apenas a transição de conclusão, na mesma transação do progresso.
  -- Datas representam o momento da importação, não uma data de conclusão inventada.
  insert into public.historico (usuario_id, tipo, titulo, descricao)
  select p_usuario, 'curso_concluido', 'Conclusão importada do Moodle',
    left(p_site_nome || ' · ' || curso.titulo, 600)
  from jsonb_to_recordset(p_cursos) as curso(moodle_curso_id bigint, titulo text, concluido boolean)
  left join public.cursos_externos salvo on salvo.usuario_id = p_usuario and salvo.moodle_curso_id = curso.moodle_curso_id
  where curso.concluido is true and salvo.concluido is distinct from true;

  insert into public.cursos_externos (usuario_id, moodle_curso_id, titulo, resumo, url, progresso, concluido, sincronizado_em)
  select p_usuario, curso.moodle_curso_id, curso.titulo, curso.resumo, curso.url, curso.progresso, curso.concluido, momento
  from jsonb_to_recordset(p_cursos) as curso(moodle_curso_id bigint, titulo text, resumo text, url text, progresso numeric, concluido boolean)
  on conflict (usuario_id, moodle_curso_id) do update set titulo = excluded.titulo, resumo = excluded.resumo,
    url = excluded.url, progresso = excluded.progresso, concluido = excluded.concluido, sincronizado_em = momento;

  -- Uma lista completa e validada remove inscrições que já não existem na origem.
  delete from public.cursos_externos where usuario_id = p_usuario
    and moodle_curso_id not in (select (item->>'moodle_curso_id')::bigint from jsonb_array_elements(p_cursos) item);
end;
$$;
create function public.desconectar_moodle(p_usuario uuid, p_revisao uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare revisao_atual uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_usuario::text, 9152026));
  select revisao into revisao_atual from public.moodle_conexoes where usuario_id = p_usuario;
  if revisao_atual is distinct from p_revisao then raise exception 'revision_conflict'; end if;
  delete from public.moodle_conexoes where usuario_id = p_usuario;
end;
$$;
revoke all on function public.aplicar_sincronizacao_moodle(uuid, uuid, text, text, bigint, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.desconectar_moodle(uuid, uuid) from public, anon, authenticated;
grant execute on function public.aplicar_sincronizacao_moodle(uuid, uuid, text, text, bigint, text, text, jsonb) to service_role;
grant execute on function public.desconectar_moodle(uuid, uuid) to service_role;
