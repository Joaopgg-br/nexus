const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
const { pgcrypto } = require('@electric-sql/pglite/contrib/pgcrypto');

// PostgreSQL real em WASM, sem acessar ou alterar o Supabase de produção.
const db = new PGlite({ extensions: { pgcrypto } });
const alice = '10000000-0000-4000-8000-000000000001';
const bob = '10000000-0000-4000-8000-000000000002';
const course = (id, progress = null, completed = null) => ({ moodle_curso_id: id,
  titulo: `Curso ${id}`, resumo: '', url: `https://moodle.example/course/view.php?id=${id}`,
  progresso: progress, concluido: completed });
const revision = async owner => (await db.query('select revisao from public.moodle_conexoes where usuario_id = $1', [owner])).rows[0]?.revisao ?? null;
const sync = async (owner, expected, courses, moodleUser = owner === alice ? 10 : 20) => db.query(
  'select public.aplicar_sincronizacao_moodle($1, $2, $3, $4, $5, $6, $7, $8::jsonb)',
  [owner, expected, 'https://moodle.example', 'Moodle de teste', moodleUser, 'Nome de teste', 'v1.cifrado.teste', JSON.stringify(courses)]);
async function asRole(role, owner, run) {
  await db.exec(`set role ${role}`);
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [owner]);
  try { return await run(); } finally { await db.exec('reset role'); }
}
before(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;`);
  for (const file of ['20260901_create_historico.sql', '20260915_moodle_integration.sql']) {
    await db.exec(readFileSync(resolve(__dirname, '../supabase/migrations', file), 'utf8'));
  }
  await db.query('insert into auth.users(id) values ($1), ($2)', [alice, bob]);
});
after(async () => db.close());

test('SQL: snapshot persiste no PostgreSQL e progresso desconhecido permanece nulo', async () => {
  await asRole('service_role', '', () => sync(alice, null, [course(1), course(2, 50, false)]));
  await sync(bob, null, [course(3, 25, false)]);
  const { rows } = await db.query('select moodle_curso_id, progresso, concluido from cursos_externos where usuario_id = $1 order by moodle_curso_id', [alice]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].progresso, null);
  assert.equal(rows[0].concluido, null);
  assert.equal(Number(rows[1].progresso), 50);
});

test('SQL/RLS: duas contas consultam somente seus próprios cursos, conexões e histórico', async () => {
  await sync(alice, await revision(alice), [course(1, null), course(2, 100, true)]);
  for (const [owner, count] of [[alice, 2], [bob, 1]]) {
    await asRole('authenticated', owner, async () => {
      const courses = (await db.query('select * from cursos_externos')).rows;
      assert.equal(courses.length, count);
      assert.ok(courses.every(row => row.usuario_id === owner));
      const connections = (await db.query('select * from moodle_conexoes')).rows;
      assert.equal(connections.length, 1);
      assert.equal(connections[0].usuario_id, owner);
      const history = (await db.query('select * from historico')).rows;
      assert.equal(history.length, owner === alice ? 1 : 0);
    });
  }
});

test('SQL: cliente e anônimo não leem tokens nem alteram dados ou executam RPC privilegiada', async () => {
  for (const role of ['authenticated', 'anon']) {
    await asRole(role, alice, async () => {
      await assert.rejects(db.query('select * from moodle_tokens'), /permission denied/);
      await assert.rejects(db.query('delete from cursos_externos'), /permission denied/);
      await assert.rejects(db.query('update moodle_conexoes set moodle_usuario_id = 20'), /permission denied/);
      await assert.rejects(db.query('select desconectar_moodle($1, null)', [alice]), /permission denied/);
      await assert.rejects(sync(alice, null, []), /permission denied/);
      if (role === 'anon') { await assert.rejects(db.query('select * from cursos_externos'), /permission denied/); }
    });
  }
});

test('SQL: sincronizar novamente não duplica conclusão e mantém IDs dos cursos', async () => {
  const old = (await db.query('select id from cursos_externos where usuario_id = $1 order by moodle_curso_id', [alice])).rows;
  await sync(alice, await revision(alice), [course(1, 100, false), course(2, 100, true)]);
  const current = (await db.query('select id from cursos_externos where usuario_id = $1 order by moodle_curso_id', [alice])).rows;
  assert.deepEqual(current, old);
  const history = (await db.query('select * from historico where usuario_id = $1', [alice])).rows;
  assert.equal(history.length, 1);
  assert.equal(history[0].titulo, 'Conclusão importada do Moodle');
  assert.equal(history[0].curso_id, null);
});

test('SQL: falha reverte conexão, cursos e evento de conclusão na mesma transação', async () => {
  const previous = await revision(alice);
  await assert.rejects(sync(alice, previous, [course(1, -5, true)]), /check constraint/);
  assert.equal(await revision(alice), previous);
  assert.equal((await db.query('select * from cursos_externos where usuario_id = $1', [alice])).rows.length, 2);
  assert.equal((await db.query('select * from historico where usuario_id = $1', [alice])).rows.length, 1);
});

test('SQL: impede vincular a mesma conta Moodle a dois usuários Nexus', async () => {
  const previous = await revision(bob);
  await assert.rejects(sync(bob, previous, [], 10), /account_changed/);
  await db.query('select desconectar_moodle($1, $2)', [bob, previous]);
  await assert.rejects(sync(bob, null, [], 10), /unique constraint/);
  assert.equal(await revision(bob), null);
  await sync(bob, null, [course(3, 25, false)]);
});

test('SQL: lista vazia válida remove somente inscrições da conta consultada', async () => {
  await sync(alice, await revision(alice), []);
  assert.equal((await db.query('select * from cursos_externos where usuario_id = $1', [alice])).rows.length, 0);
  assert.equal((await db.query('select * from cursos_externos where usuario_id = $1', [bob])).rows.length, 1);
});

test('SQL: desconectar apaga credenciais/importações, preserva histórico e rejeita resposta antiga', async () => {
  const old = await revision(alice);
  await db.query('select desconectar_moodle($1, $2)', [alice, old]);
  assert.equal(await revision(alice), null);
  assert.equal((await db.query('select * from moodle_tokens where usuario_id = $1', [alice])).rows.length, 0);
  assert.equal((await db.query('select * from historico where usuario_id = $1', [alice])).rows.length, 1);
  await assert.rejects(sync(alice, old, [course(1, 100, true)]), /revision_conflict/);
  await sync(alice, null, [course(1, 10, false)]);
  await assert.rejects(db.query('select desconectar_moodle($1, $2)', [alice, old]), /revision_conflict/);
  assert.notEqual(await revision(alice), null);
});
