// Executa a lógica real dos componentes sem navegador; serviços externos são simulados.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const ts = require('typescript');
const cache = new Map();
const decorator = () => () => {};
class EventEmitter { constructor() { this.events = []; } emit(value) { this.events.push(value); } }
function load(file) {
  file = path.resolve(__dirname, '..', file);
  if (cache.has(file)) return cache.get(file);
  const module = { exports: {} };
  const requireMock = name => {
    if (name === '@angular/core') return { Component: decorator, Injectable: decorator, Input: decorator, Output: decorator, ViewChild: decorator, EventEmitter };
    if (name.startsWith('@angular/') || name === '@ionic/angular' || name === 'rxjs') return {};
    if (name === '@supabase/supabase-js') return { createClient: () => ({}) };
    if (name.includes('environments/environment')) return { environment: {} };
    if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name + '.ts'));
    throw new Error('Unexpected dependency: ' + name);
  };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, experimentalDecorators: true } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: requireMock, console, setTimeout, clearTimeout });
  cache.set(file, module.exports);
  return module.exports;
}
const { PRATICAS } = load('src/app/services/praticas.ts');
const { avaliarPratica, PraticaComponent } = load('src/app/components/pratica/pratica.component.ts');
const { Curso } = load('src/app/services/curso.ts');
const { LessonPage } = load('src/app/lesson/lesson.page.ts');
const { QuizPage } = load('src/app/quiz/quiz.page.ts');
const { SupabaseService } = load('src/app/services/supabase.service.ts');
const router = () => ({ paths: [], async navigate(path) { this.paths.push(path); return true; } });
const history = indices => indices.map(aula_indice => ({ tipo: 'aula_concluida', curso_id: 1, aula_indice }));
const answer = pratica => ({ escolhas: [...(pratica.corretas ?? [])], ordem: [...(pratica.corretas ?? [])], associacoes: Object.fromEntries((pratica.itens ?? []).map(item => [item.id, item.resposta])) });

test('sete práticas: respostas corretas aprovam; vazias, parciais e ordem invertida não', () => {
  assert.equal(PRATICAS.flat().length, 7);
  for (const pratica of PRATICAS.flat()) {
    assert.equal(avaliarPratica(pratica, answer(pratica)), true, pratica.id);
    assert.equal(avaliarPratica(pratica, { escolhas: [], ordem: [], associacoes: {} }), false, pratica.id);
    const errado = answer(pratica);
    if (pratica.tipo === 'multipla') errado.escolhas = pratica.opcoes.map(o => o.id);
    if (pratica.tipo === 'ordem') errado.ordem.reverse();
    if (pratica.tipo === 'associacao') delete errado.associacoes[pratica.itens[0].id];
    assert.equal(avaliarPratica(pratica, errado), false, pratica.id);
  }
});
test('componente não emite aprovação para resposta errada nem duplica aprovação', () => {
  const c = new PraticaComponent(); c.pratica = PRATICAS[0][1]; c.ngOnChanges();
  c.selecionar('admin'); c.verificar(); assert.equal(c.aprovada.events.length, 0);
  c.resposta = answer(c.pratica); c.verificar(); c.verificar();
  assert.equal(c.aprovada.events.length, 1); assert.equal(c.bloqueada, true);
});
test('progresso restaura revisões, bloqueia salto de aula e limpa ao trocar usuário', () => {
  const curso = new Curso(); assert.equal(curso.marcarAulaConcluida(3), false);
  curso.restaurarProgresso([0, 1]); assert.equal(curso.getAula(1).bloqueada, false); assert.equal(curso.getAula(2).bloqueada, false); assert.equal(curso.getAula(3).bloqueada, true);
  curso.restaurarProgresso([]); assert.equal(curso.getAula(1).bloqueada, true); assert.equal(curso.getAula(0).concluida, false);
});
test('prática só desbloqueia conclusão após salvar; erro permite tentar novamente; restaura pelo curso/aula', async () => {
  const curso = new Curso(); const rows = []; let fail = true;
  const service = { buscarHistorico: async () => rows, registrarAtividade: async item => {
    if (item.tipo === 'quiz_concluido' && fail) throw Error('offline');
    rows.push({ ...item, curso_id: item.cursoId, aula_indice: item.aulaIndice });
  } };
  const page = new LessonPage(router(), {}, service, curso); await page.carregarAula();
  assert.equal(page.podeConcluir, false);
  await page.marcarConcluida(); assert.equal(rows.some(r => r.tipo === 'aula_concluida'), false);
  await page.salvarPratica(page.praticas[0]); assert.equal(page.concluidas.size, 0); assert.ok(page.errosPraticas[page.praticas[0].id]);
  fail = false;
  for (const pratica of page.praticas) await page.salvarPratica(pratica);
  assert.equal(page.podeConcluir, true);
  const refreshed = new LessonPage(router(), {}, service, new Curso()); await refreshed.carregarAula(); assert.equal(refreshed.concluidas.size, 2);
  await refreshed.marcarConcluida(); assert.equal(refreshed.curso.getAula(0).concluida, true);
  const other = new LessonPage(router(), {}, { ...service, buscarHistorico: async () => [] }, new Curso()); await other.carregarAula(); assert.equal(other.concluidas.size, 0);
});
test('aula não reaproveita progresso quando o banco falha', async () => {
  const curso = new Curso(); curso.restaurarProgresso([0, 1, 2, 3, 4]);
  const page = new LessonPage(router(), {}, { buscarHistorico: async () => { throw Error('offline'); } }, curso);
  await page.carregarAula(); assert.equal(page.aula, null); assert.equal(curso.quizLiberado, false); assert.ok(page.mensagemErro);
});
test('quiz exige resposta em cada pergunta e preserva seleção ao voltar', async () => {
  const page = new QuizPage(router(), { buscarHistorico: async () => history([0,1,2,3,4]) }, new Curso());
  await page.ionViewWillEnter(); await page.proximaPergunta(); assert.equal(page.perguntaAtual, 0);
  page.selecionarResposta(1); await page.proximaPergunta(); assert.equal(page.perguntaAtual, 1); assert.equal(page.respostaSelecionada, null);
  await page.proximaPergunta(); assert.equal(page.perguntaAtual, 1);
  page.perguntaAnterior(); assert.equal(page.respostaSelecionada, 1);
});
test('resultado só é confirmado após INSERT em lote; falha pode ser repetida sem refazer quiz', async () => {
  let fail = true; const writes = [];
  const service = { buscarHistorico: async () => history([0,1,2,3,4]), registrarAtividades: async rows => { writes.push(rows); if (fail) throw Error('offline'); } };
  const page = new QuizPage(router(), service, new Curso()); await page.ionViewWillEnter();
  for (const pergunta of page.perguntas) { page.selecionarResposta(pergunta.respostaCorreta); await page.proximaPergunta(); }
  assert.equal(page.nota, 100); assert.equal(page.registroSalvo, false); assert.equal(page.curso.quizConcluido, false); assert.ok(page.erroRegistro);
  assert.equal(writes[0].length, 2); fail = false; await page.salvarResultado(); assert.equal(page.registroSalvo, true); assert.equal(page.curso.quizConcluido, true);
  await page.salvarResultado(); assert.equal(writes.length, 2);
});
test('quiz não registra curso concluído com nota insuficiente e bloqueia entrada sem progresso', async () => {
  const r = router(); const blocked = new QuizPage(r, { buscarHistorico: async () => [] }, new Curso()); await blocked.ionViewWillEnter(); assert.equal(r.paths[0][0], '/courses');
  let written; const page = new QuizPage(router(), { buscarHistorico: async () => history([0,1,2,3,4]), registrarAtividades: async rows => { written = rows; } }, new Curso());
  await page.ionViewWillEnter(); for (const pergunta of page.perguntas) { page.selecionarResposta((pergunta.respostaCorreta + 1) % pergunta.opcoes.length); await page.proximaPergunta(); }
  assert.equal(page.nota, 0); assert.equal(written.length, 1); assert.equal(written[0].tipo, 'quiz_concluido');
});
test('serviço filtra pelo usuário autenticado e atribui o mesmo ID a todos os registros do lote', async () => {
  const service = new SupabaseService(); let filter; let inserted;
  service.supabase = { auth: { getUser: async () => ({ data: { user: { id: 'usuario-teste' } }, error: null }) }, from: table => {
    assert.equal(table, 'historico');
    return { insert: async rows => { inserted = rows; return { error: null }; }, select: () => ({ eq: (column, value) => { filter = [column, value]; return { order: async () => ({ data: [], error: null }) }; } }) };
  } };
  await service.buscarHistorico(); assert.deepEqual(filter, ['usuario_id', 'usuario-teste']);
  await service.registrarAtividades([{ tipo: 'quiz_concluido', titulo: 'Avaliação' }, { tipo: 'curso_concluido', titulo: 'Curso' }]);
  assert.equal(inserted.length, 2); assert.ok(inserted.every(row => row.usuario_id === 'usuario-teste'));
  service.supabase.auth.getUser = async () => ({ data: { user: null }, error: null });
  await assert.rejects(service.registrarAtividade({ tipo: 'quiz_concluido', titulo: 'Teste' }), /não autenticado/);
});
