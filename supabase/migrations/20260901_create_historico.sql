create extension if not exists pgcrypto;

create table public.historico (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null
    references auth.users(id)
    on delete cascade,
  tipo text not null
    check (
      tipo in (
        'curso_acessado',
        'curso_iniciado',
        'aula_acessada',
        'aula_concluida',
        'quiz_concluido',
        'curso_concluido'
      )
    ),
  titulo text not null,
  descricao text,
  curso_id integer,
  aula_indice integer,
  criado_em timestamptz not null default now()
);

create index historico_usuario_data_idx
  on public.historico (
    usuario_id,
    criado_em desc
  );

alter table public.historico
  enable row level security;

revoke all
  on table public.historico
  from anon;

grant select, insert
  on table public.historico
  to authenticated;

create policy "usuario_le_proprio_historico"
  on public.historico
  for select
  to authenticated
  using (auth.uid() = usuario_id);

create policy "usuario_cria_proprio_historico"
  on public.historico
  for insert
  to authenticated
  with check (auth.uid() = usuario_id);
