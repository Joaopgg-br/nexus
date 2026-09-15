// Testes de contrato e de isolamento. Moodle e Supabase externos são simulados.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const ts = require('typescript');
const { BehaviorSubject } = require('rxjs');
function load(relative, extra = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', relative), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, experimentalDecorators: true }
  }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, crypto, atob, btoa, TextEncoder, TextDecoder,
    Uint8Array, URL, URLSearchParams, Request, Response, AbortSignal, fetch, console, Date,
    require: name => name === '@angular/core' ? { Injectable: () => () => {} } : name === 'rxjs' ? { BehaviorSubject } : {}, ...extra });
  return module.exports;
}
const core = load('supabase/functions/moodle-sync/moodle.ts');
const base = 'https://moodle.example.edu';
const token = 'a'.repeat(32);
const site = { userid: 42, fullname: 'Aluno de teste', sitename: 'Moodle teste', siteurl: base, functions: [{ name: 'core_enrol_get_users_courses' }] };
const raw = [{ id: 7, fullname: 'Redes', summary: '<p>Conteúdo</p>', progress: 100, completed: false }];
const json = value => new Response(JSON.stringify(value));

test('Moodle: consulta apenas o ID confirmado pelo token, por POST, sem credenciais na URL', async () => {
  const requests = [];
  const transport = async (url, options) => {
    requests.push({ url, options });
    return json(requests.length === 1 ? site : raw);
  };
  const value = await core.loadMoodle(base, token, undefined, transport);
  assert.equal(value.userId, 42);
  assert.equal(requests.length, 2);
  for (const { url, options } of requests) {
    assert.equal(url, base + '/webservice/rest/server.php'); assert.equal(url.includes(token), false);
    assert.equal(options.method, 'POST'); assert.equal(options.redirect, 'error');
  }
  assert.equal(requests[1].options.body.get('userid'), '42');
  assert.equal(requests[1].options.body.get('returnusercount'), '0');
  assert.equal(value.courses[0].concluido, false);
});
test('progresso ausente não vira zero; 100% não inventa certificado ou conclusão', () => {
  const result = core.normalizeCourses([...raw, { id: 8, fullname: 'Sem rastreamento', progress: null, completed: null }], base);
  assert.equal(result[0].concluido, false); assert.equal(result[1].progresso, null); assert.equal(result[1].concluido, null);
  assert.equal(result[0].url, base + '/course/view.php?id=7');
});
test('resposta parcial, inválida ou duplicada é rejeitada inteira', () => {
  for (const courses of [{}, null, [raw[0], { id: 8 }], [raw[0], raw[0]], [{ ...raw[0], progress: 101 }], [{ ...raw[0], completed: 'false' }]]) {
    assert.throws(() => core.normalizeCourses(courses, base));
  }
  assert.equal(core.normalizeCourses([], base).length, 0);
});
test('conta trocada, origem diferente, token revogado e função sem permissão não são aceitos', async () => {
  await assert.rejects(core.loadMoodle(base, token, 3, async () => json(site)), error => error.code === 'account_changed');
  await assert.rejects(core.loadMoodle(base, token, undefined, async () => json({ ...site, siteurl: 'https://other.example.edu' })), error => error.code === 'invalid_identity');
  await assert.rejects(core.loadMoodle(base, token, undefined, async () => json({ ...site, functions: [] })), error => error.code === 'missing_permission');
  await assert.rejects(core.loadMoodle(base, token, undefined, async () => json({ errorcode: 'invalidtoken', message: token })), error => error.code === 'invalid_token' && !error.message.includes(token));
});
test('falhas HTTP, HTML e rede retornam erro seguro', async () => {
  for (const transport of [async () => new Response('offline', { status: 500 }), async () => new Response('<html>login</html>'), async () => { throw new Error(token); }]) {
    await assert.rejects(core.moodleRequest(base, token, 'function', {}, transport), error => !error.message.includes(token));
  }
  for (const url of ['http://moodle.example.edu', 'https://127.0.0.1', 'https://localhost', 'https://user:pass@moodle.example.edu', base + '?token=abc']) { assert.throws(() => core.siteUrl(url)); }
});
test('token é criptografado com nonce único e associado à conta e plataforma', async () => {
  const key = await core.tokenKey(Buffer.alloc(32, 7).toString('base64'));
  const a = await core.encryptToken(token, key, 'conta-a|' + base);
  const b = await core.encryptToken(token, key, 'conta-a|' + base);
  assert.notEqual(a, b); assert.equal(a.includes(token), false);
  assert.equal(await core.decryptToken(a, key, 'conta-a|' + base), token);
  await assert.rejects(core.decryptToken(a, key, 'conta-b|' + base));
  await assert.rejects(core.tokenKey('invalid'));
});

const { MoodleService } = load('src/app/services/moodle.service.ts');
const empty = { configured: true, siteUrl: base, connection: null, courses: [] };
function fixture() {
  let user = 'conta-a'; let changed;
  const api = { observarUsuario: fn => { changed = fn; fn(user); }, sessaoAtual: async () => ({ data: { session: user ? { user: { id: user } } : null }, error: null }), consultarMoodle: async () => empty };
  const service = new MoodleService(api);
  return { service, api, switch: id => { user = id; changed(id); } };
}
test('logout limpa dados e descarta resposta pendente da conta anterior', async () => {
  const f = fixture(); let resolve;
  f.api.consultarMoodle = () => new Promise(r => { resolve = r; });
  const pending = f.service.executar('status'); await new Promise(r => setImmediate(r));
  f.switch(null);
  resolve({ ...empty, connection: { usuario_id: 'conta-a' }, courses: [{ id: 'privado-a' }] });
  assert.equal(await pending, false); assert.equal(f.service.estado.value.courses.length, 0);
  f.switch('conta-b'); assert.equal(f.service.estado.value.connection, null);
});
test('falha na sincronização preserva cursos anteriores sem mostrar sucesso', async () => {
  const f = fixture(); f.api.consultarMoodle = async () => ({ ...empty, connection: { usuario_id: 'conta-a', site_url: base }, courses: [{ id: 'a', progresso: 35 }] });
  await f.service.executar('status');
  f.api.consultarMoodle = async () => { throw new Error('Moodle indisponível'); };
  assert.equal(await f.service.executar('sync'), false);
  assert.equal(f.service.estado.value.courses[0].progresso, 35); assert.equal(f.service.estado.value.mensagem, '');
  assert.equal(f.service.estado.value.carregando, false);
});
test('interface rejeita conexão de outra conta e URL perigosa', async () => {
  const f = fixture(); f.api.consultarMoodle = async () => ({ ...empty, connection: { usuario_id: 'conta-b' }, courses: [{ id: 'b' }] });
  assert.equal(await f.service.executar('status'), false); assert.equal(f.service.estado.value.courses.length, 0);
  f.service.estado.next({ ...f.service.estado.value, connection: { site_url: 'javascript:alert(1)' } });
  assert.equal(f.service.urlCurso({ moodle_curso_id: 7 }), null);
});

test('acesso a curso externo não registra dados de uma sessão anterior', async () => {
  const f = fixture(); const calls = [];
  const course = { id: 'curso-a', titulo: 'Curso privado A' };
  f.api.consultarMoodle = async () => ({ ...empty, connection: { usuario_id: 'conta-a', site_nome: 'Moodle' }, courses: [course] });
  f.api.registrarAtividade = async (activity, owner) => { calls.push({ activity, owner }); };
  await f.service.executar('status');
  await f.service.registrarAcesso(course);
  assert.equal(calls[0].owner, 'conta-a');
  f.switch('conta-b');
  await f.service.registrarAcesso(course);
  assert.equal(calls.length, 1);
  const { SupabaseService } = load('src/app/services/supabase.service.ts');
  const api = Object.create(SupabaseService.prototype);
  api.usuarioAtual = async () => ({ data: { user: { id: 'conta-b' } }, error: null });
  api.supabase = { from: () => { throw new Error('INSERT não deveria acontecer'); } };
  await assert.rejects(api.registrarAtividade(calls[0].activity, 'conta-a'), /A conta mudou/);
});

function handler(api, env = {}) {
  let serve;
  load('supabase/functions/moodle-sync/index.ts', {
    Deno: { env: { get: key => ({ SUPABASE_URL: 'https://supabase.example.edu', SUPABASE_SERVICE_ROLE_KEY: 'server-key', ...env })[key] }, serve: fn => { serve = fn; } },
    require: name => name.startsWith('npm:') ? { createClient: () => api } : core
  });
  return serve;
}
const request = (body, auth = true) => new Request('https://edge.example.edu/moodle-sync', { method: 'POST', headers: auth ? { Authorization: 'Bearer session' } : {}, body: JSON.stringify(body) });
function fakeDb() {
  const filters = []; const calls = [];
  return { filters, calls,
    auth: { getUser: async () => ({ data: { user: { id: 'conta-a' } }, error: null }) },
    from(table) {
      const q = { select: () => q, eq: (field, value) => { filters.push({ table, field, value }); return q; }, maybeSingle: async () => ({ data: null, error: null }), order: async () => ({ data: [], error: null }) }; return q;
    },
    rpc: async (name, params) => { calls.push({ name, params }); return { error: null }; }
  };
}
test('Edge Function exige sessão válida antes de consultar o banco', async () => {
  const db = fakeDb(); const serve = handler(db);
  assert.equal((await serve(request({ action: 'status' }, false))).status, 401); assert.equal(db.filters.length, 0);
  db.auth.getUser = async () => ({ data: { user: null }, error: new Error('expired') });
  assert.equal((await serve(request({ action: 'status' }))).status, 401); assert.equal(db.filters.length, 0);
});
test('Edge Function ignora usuario_id recebido e filtra todas as consultas pelo usuário autenticado', async () => {
  const db = fakeDb(); const response = await handler(db)(request({ action: 'status', usuario_id: 'conta-b' }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).configured, false);
  assert.equal(db.filters.length, 2);
  assert.equal(db.filters.every(f => f.field === 'usuario_id' && f.value === 'conta-a'), true);
});
test('desconexão usa ID da sessão e revisão; não depende de Moodle acessível', async () => {
  const db = fakeDb(); const response = await handler(db)(request({ action: 'disconnect', usuario_id: 'conta-b' }));
  assert.equal(response.status, 200); assert.equal(db.calls[0].params.p_usuario, 'conta-a');
  assert.equal(db.calls[0].params.p_revisao, null);
});
