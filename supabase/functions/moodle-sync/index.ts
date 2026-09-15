import { createClient } from 'npm:@supabase/supabase-js@2.109.0';
import { IntegrationError, siteUrl, loadMoodle, tokenKey, encryptToken, decryptToken } from './moodle.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store'
};
const fields = 'usuario_id, site_url, site_nome, moodle_usuario_id, moodle_nome, revisao, sincronizado_em';
const courseFields = 'id, moodle_curso_id, titulo, resumo, url, progresso, concluido, sincronizado_em';
function reply(body: unknown, status = 200): Response { return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } }); }
function databaseError(error: { code?: string; message?: string }): never {
  if (error.code === '23505') { throw new IntegrationError('already_connected', 'Esta conta Moodle já está vinculada a outra conta Nexus.', 409); }
  if (error.message?.includes('revision_conflict')) { throw new IntegrationError('conflict', 'A conexão mudou durante a operação. Atualize a página e tente novamente.', 409); }
  if (error.message?.includes('account_changed')) { throw new IntegrationError('account_changed', 'Desconecte a conta atual antes de vincular outra conta Moodle.', 409); }
  throw new IntegrationError('storage_error', 'Não foi possível salvar ou consultar a integração. Tente novamente.', 503);
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') { return new Response(null, { headers: cors }); }
  if (request.method !== 'POST') { return reply({ code: 'method', message: 'Método não permitido.' }, 405); }
  try {
    const authorization = request.headers.get('Authorization') ?? '';
    if (!/^Bearer \S+$/i.test(authorization)) { throw new IntegrationError('unauthorized', 'Entre na sua conta Nexus para continuar.', 401); }
    const url = Deno.env.get('SUPABASE_URL') ?? '';
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!url || !key) { throw new IntegrationError('not_configured', 'A integração ainda não está disponível.', 503); }
    const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    // Nunca aceita usuario_id enviado pelo cliente nem confia em JWT apenas decodificado.
    const { data: auth, error: authError } = await admin.auth.getUser(authorization.slice(7));
    if (authError || !auth.user) { throw new IntegrationError('unauthorized', 'Sua sessão expirou. Entre novamente.', 401); }
    const owner = auth.user.id;
    if (Number(request.headers.get('content-length')) > 2048) { throw new IntegrationError('invalid_request', 'Solicitação muito grande.'); }
    const raw = await request.text();
    if (raw.length > 2048) { throw new IntegrationError('invalid_request', 'Solicitação muito grande.'); }
    let input;
    try { input = JSON.parse(raw); } catch { throw new IntegrationError('invalid_request', 'Solicitação inválida.'); }
    if (!input || !['status', 'connect', 'sync', 'disconnect'].includes(input.action)) { throw new IntegrationError('invalid_request', 'Ação inválida.'); }

    const configuredUrl = Deno.env.get('MOODLE_BASE_URL') ?? '';
    const secret = Deno.env.get('MOODLE_TOKEN_KEY') ?? '';
    let base = ''; let encryption: CryptoKey | undefined;
    try { base = siteUrl(configuredUrl); encryption = await tokenKey(secret); } catch { /* Estado não configurado é exibido sem cursos inventados. */ }
    const { data: connection, error: connectionError } = await admin.from('moodle_conexoes').select(fields).eq('usuario_id', owner).maybeSingle();
    if (connectionError) { databaseError(connectionError); }
    const { data: courses, error: coursesError } = await admin.from('cursos_externos').select(courseFields).eq('usuario_id', owner).order('titulo');
    if (coursesError) { databaseError(coursesError); }
    const configuration = { configured: Boolean(base && encryption), siteUrl: base || null };
    if (input.action === 'status') { return reply({ ...configuration, connection, courses: courses ?? [] }); }
    if (input.action === 'disconnect') {
      const { error } = await admin.rpc('desconectar_moodle', { p_usuario: owner, p_revisao: connection?.revisao ?? null });
      if (error) { databaseError(error); }
      return reply({ ...configuration, connection: null, courses: [] });
    }
    if (!base || !encryption) { throw new IntegrationError('not_configured', 'O Moodle ainda não foi configurado pelo responsável pelo aplicativo.', 503); }
    if (connection && connection.site_url !== base) { throw new IntegrationError('site_changed', 'A plataforma configurada mudou. Desconecte e conecte novamente.', 409); }
    if (input.action === 'sync' && !connection) { throw new IntegrationError('not_connected', 'Conecte sua conta Moodle primeiro.'); }
    if (input.action === 'sync' && connection && Date.now() - new Date(connection.sincronizado_em).getTime() < 15000) {
      throw new IntegrationError('rate_limit', 'Aguarde alguns segundos antes de atualizar novamente.', 429);
    }
    const aad = `${owner}|${base}`;
    let token: string;
    if (input.action === 'connect') {
      token = typeof input.token === 'string' ? input.token.trim() : '';
    } else {
      const { data: saved, error } = await admin.from('moodle_tokens').select('token_cifrado').eq('usuario_id', owner).single();
      if (error || !saved) { throw new IntegrationError('reconnect_required', 'Conecte novamente sua conta Moodle.'); }
      token = await decryptToken(saved.token_cifrado, encryption, aad);
    }
    const snapshot = await loadMoodle(base, token, connection?.moodle_usuario_id);
    const encrypted = await encryptToken(token, encryption, aad);
    token = '';
    const { error } = await admin.rpc('aplicar_sincronizacao_moodle', {
      p_usuario: owner, p_revisao: connection?.revisao ?? null, p_site_url: base,
      p_site_nome: snapshot.siteName, p_moodle_usuario: snapshot.userId, p_moodle_nome: snapshot.userName,
      p_token_cifrado: encrypted, p_cursos: snapshot.courses
    });
    if (error) { databaseError(error); }
    const { data: updatedConnection, error: readConnection } = await admin.from('moodle_conexoes').select(fields).eq('usuario_id', owner).single();
    const { data: updatedCourses, error: readCourses } = await admin.from('cursos_externos').select(courseFields).eq('usuario_id', owner).order('titulo');
    if (readConnection || readCourses) { databaseError(readConnection ?? readCourses!); }
    return reply({ ...configuration, connection: updatedConnection, courses: updatedCourses ?? [] });
  } catch (error) {
    // Não registra token, conteúdo da requisição ou mensagens cruas do provedor.
    if (error instanceof IntegrationError) { return reply({ code: error.code, message: error.message }, error.status); }
    return reply({ code: 'internal_error', message: 'Não foi possível concluir a integração. Tente novamente.' }, 500);
  }
});
