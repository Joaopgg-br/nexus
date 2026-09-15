// Somente a URL definida pelo administrador recebe o token. Nunca use URL do cliente.
export class IntegrationError extends Error {
  constructor(public code: string, message: string, public status = 400) { super(message); }
}

export interface MoodleCourse {
  moodle_curso_id: number;
  titulo: string;
  resumo: string;
  url: string;
  progresso: number | null;
  concluido: boolean | null;
}

export function siteUrl(value: string): string {
  let url: URL;
  try { url = new URL(value); } catch { throw new IntegrationError('not_configured', 'A plataforma Moodle ainda não foi configurada.', 503); }
  // Configuração fixa no servidor, HTTPS e sem credenciais/redirecionamentos.
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      url.port || !url.hostname.includes('.') || /^(localhost|.*\.localhost|.*\.local)$/.test(url.hostname) ||
      /^\d+\.\d+\.\d+\.\d+$/.test(url.hostname) || url.hostname.includes(':')) {
    throw new IntegrationError('not_configured', 'O endereço do Moodle precisa ser um domínio HTTPS válido.', 503);
  }
  return url.href.replace(/\/+$/, '');
}

function text(value: unknown, limit: number): string {
  if (typeof value !== 'string') { return ''; }
  return value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim().slice(0, limit);
}

export function normalizeCourses(value: unknown, base: string): MoodleCourse[] {
  if (!Array.isArray(value) || value.length > 2000) {
    throw new IntegrationError('invalid_response', 'O Moodle retornou uma lista de cursos inválida.', 502);
  }
  const ids = new Set<number>();
  return value.map(item => {
    if (!item || !Number.isSafeInteger(item.id) || item.id < 1 || typeof item.fullname !== 'string' || !item.fullname.trim() || ids.has(item.id)) {
      throw new IntegrationError('invalid_response', 'O Moodle retornou um curso inválido. Seus dados anteriores foram preservados.', 502);
    }
    ids.add(item.id);
    const progress = item.progress;
    if (progress != null && (typeof progress !== 'number' || !Number.isFinite(progress) || progress < 0 || progress > 100)) {
      throw new IntegrationError('invalid_response', 'O Moodle retornou um progresso inválido.', 502);
    }
    if (item.completed != null && typeof item.completed !== 'boolean' && item.completed !== 0 && item.completed !== 1) {
      throw new IntegrationError('invalid_response', 'O Moodle retornou uma conclusão inválida.', 502);
    }
    return {
      moodle_curso_id: item.id,
      titulo: text(item.fullname, 300),
      resumo: text(item.summary, 1200),
      // Ignora URLs e arquivos arbitrários recebidos do Moodle (podem conter tokens).
      url: `${base}/course/view.php?id=${item.id}`,
      progresso: progress == null ? null : Math.round(progress * 100) / 100,
      // 100% de atividades não significa necessariamente conclusão oficial do curso.
      concluido: item.completed == null ? null : Boolean(item.completed)
    };
  });
}

export async function moodleRequest(base: string, token: string, name: string, params: Record<string, string> = {}, transport: typeof fetch = fetch): Promise<unknown> {
  const body = new URLSearchParams({ wstoken: token, wsfunction: name, moodlewsrestformat: 'json', ...params });
  let response: Response;
  try {
    response = await transport(`${base}/webservice/rest/server.php`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body, redirect: 'error', signal: AbortSignal.timeout(20000)
    });
  } catch { throw new IntegrationError('moodle_unavailable', 'Não foi possível acessar o Moodle. Tente novamente em alguns instantes.', 502); }
  if (!response.ok) { throw new IntegrationError('moodle_unavailable', 'O Moodle está indisponível ou recusou a conexão.', 502); }
  const reader = response.body?.getReader();
  if (!reader) { throw new IntegrationError('invalid_response', 'O Moodle retornou uma resposta vazia.', 502); }
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) { break; }
      length += value.length;
      if (length > 8 * 1024 * 1024) { await reader.cancel(); throw new IntegrationError('invalid_response', 'A resposta do Moodle excedeu o tamanho permitido.', 502); }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof IntegrationError) { throw error; }
    throw new IntegrationError('moodle_unavailable', 'A transferência do Moodle foi interrompida. Tente novamente.', 502);
  }
  const bytes = new Uint8Array(length); let position = 0;
  for (const chunk of chunks) { bytes.set(chunk, position); position += chunk.length; }
  let data;
  try { data = JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new IntegrationError('invalid_response', 'O Moodle não retornou dados válidos.', 502); }
  if (data && !Array.isArray(data) && (data.exception || data.errorcode)) {
    const code = data.errorcode;
    if (code === 'invalidtoken' || code === 'accessexception') {
      throw new IntegrationError('invalid_token', 'A chave do Moodle expirou, foi revogada ou não tem permissão. Conecte novamente.', 400);
    }
    throw new IntegrationError('moodle_error', 'O Moodle não permitiu a consulta. Verifique as permissões do serviço.', 502);
  }
  return data;
}

export async function loadMoodle(base: string, token: string, expectedUser?: number, transport: typeof fetch = fetch) {
  if (!/^[a-f0-9]{32}$/i.test(token)) { throw new IntegrationError('invalid_token', 'Informe uma chave pessoal válida do Moodle (32 caracteres).'); }
  const site = await moodleRequest(base, token, 'core_webservice_get_site_info', {}, transport) as Record<string, unknown>;
  if (!site || !Number.isSafeInteger(site['userid']) || Number(site['userid']) < 1 || typeof site['siteurl'] !== 'string' || siteUrl(site['siteurl']) !== base) {
    throw new IntegrationError('invalid_identity', 'Não foi possível confirmar a conta e a origem do Moodle.', 502);
  }
  const userId = Number(site['userid']);
  if (expectedUser !== undefined && userId !== expectedUser) { throw new IntegrationError('account_changed', 'A chave pertence a outra conta. Desconecte o Moodle antes de trocar de conta.', 409); }
  const functions = site['functions'];
  if (!Array.isArray(functions) || !functions.some(item => item?.name === 'core_enrol_get_users_courses')) {
    throw new IntegrationError('missing_permission', 'A chave não permite consultar os cursos. Solicite ao administrador a permissão de leitura dos seus cursos.');
  }
  const data = await moodleRequest(base, token, 'core_enrol_get_users_courses', { userid: String(userId), returnusercount: '0' }, transport);
  return { userId, userName: text(site['fullname'], 200), siteName: text(site['sitename'], 200) || 'Moodle', courses: normalizeCourses(data, base) };
}

function fromBase64(input: string): Uint8Array<ArrayBuffer> { return Uint8Array.from(atob(input), char => char.charCodeAt(0)); }
function toBase64(input: Uint8Array): string { return btoa(String.fromCharCode(...input)); }
export async function tokenKey(secret: string): Promise<CryptoKey> {
  try {
    const bytes = fromBase64(secret);
    if (bytes.length !== 32) { throw new Error(); }
    return await crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
  } catch { throw new IntegrationError('not_configured', 'A integração Moodle precisa ser configurada pelo responsável pelo aplicativo.', 503); }
}
export async function encryptToken(token: string, key: CryptoKey, owner: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(owner) }, key, new TextEncoder().encode(token));
  return `v1.${toBase64(iv)}.${toBase64(new Uint8Array(encrypted))}`;
}
export async function decryptToken(encrypted: string, key: CryptoKey, owner: string): Promise<string> {
  try {
    const [version, iv, payload] = encrypted.split('.');
    if (version !== 'v1') { throw new Error(); }
    const value = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(iv), additionalData: new TextEncoder().encode(owner) }, key, fromBase64(payload));
    return new TextDecoder().decode(value);
  } catch { throw new IntegrationError('reconnect_required', 'Conecte novamente sua conta do Moodle para atualizar os cursos.', 400); }
}
