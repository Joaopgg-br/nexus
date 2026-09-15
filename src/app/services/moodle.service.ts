import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AcaoMoodle, CursoExterno, EstadoMoodle } from '../models/moodle';
import { SupabaseService } from './supabase.service';

interface TelaMoodle extends EstadoMoodle {
  carregando: boolean;
  erro: string;
  mensagem: string;
}
const vazio = (): TelaMoodle => ({ configured: false, siteUrl: null, connection: null, courses: [], carregando: false, erro: '', mensagem: '' });

@Injectable({ providedIn: 'root' })
export class MoodleService {
  readonly estado = new BehaviorSubject<TelaMoodle>(vazio());
  private usuarioId: string | null = null;
  private operacao = 0;

  constructor(private readonly supabase: SupabaseService) {
    this.supabase.observarUsuario(id => this.trocarUsuario(id));
  }

  private trocarUsuario(id: string | null): void {
    if (id === this.usuarioId) { return; }
    this.usuarioId = id;
    this.operacao++;
    this.estado.next(vazio());
  }

  async executar(action: AcaoMoodle, token?: string): Promise<boolean> {
    const { data, error } = await this.supabase.sessaoAtual();
    const id = data.session?.user.id ?? null;
    this.trocarUsuario(id);
    if (error || !id) { this.estado.next({ ...vazio(), erro: 'Entre na sua conta Nexus para continuar.' }); return false; }
    if (this.estado.value.carregando) { return false; }
    const operacao = ++this.operacao;
    this.estado.next({ ...this.estado.value, carregando: true, erro: '', mensagem: '' });
    try {
      const result = await this.supabase.consultarMoodle(action, token);
      if (operacao !== this.operacao || id !== this.usuarioId) { return false; }
      if (result.connection && result.connection.usuario_id !== id) { throw new Error('Não foi possível confirmar a conta vinculada.'); }
      this.estado.next({ ...result, carregando: false, erro: '', mensagem:
        action === 'connect' ? 'Conta conectada e cursos atualizados.' :
        action === 'sync' ? 'Progresso atualizado com os dados do Moodle.' :
        action === 'disconnect' ? 'Conta desconectada do Nexus.' : '' });
      return true;
    } catch (failure) {
      if (operacao !== this.operacao || id !== this.usuarioId) { return false; }
      this.estado.next({ ...this.estado.value, carregando: false, mensagem: '', erro:
        failure instanceof Error ? failure.message : 'Não foi possível atualizar o Moodle.' });
      return false;
    }
  }

  urlCurso(curso: CursoExterno): string | null {
    const connection = this.estado.value.connection;
    if (!connection || !Number.isSafeInteger(curso.moodle_curso_id) || curso.moodle_curso_id < 1) { return null; }
    try {
      const base = new URL(connection.site_url);
      if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) { return null; }
      // Reconstrói a URL a partir da origem vinculada; nunca usa javascript: ou URLs com tokens.
      return `${base.href.replace(/\/+$/, '')}/course/view.php?id=${curso.moodle_curso_id}`;
    } catch { return null; }
  }

  async registrarAcesso(curso: CursoExterno): Promise<void> {
    const owner = this.usuarioId;
    const estado = this.estado.value;
    if (!owner || estado.connection?.usuario_id !== owner || !estado.courses.some(item => item.id === curso.id)) { return; }
    try {
      await this.supabase.registrarAtividade({ tipo: 'curso_acessado', titulo: 'Curso aberto no Moodle',
        descricao: `${estado.connection.site_nome} · ${curso.titulo}` }, owner);
    } catch {
      if (owner !== this.usuarioId) { return; }
      this.estado.next({ ...this.estado.value, erro: 'O curso foi aberto, mas não foi possível registrar o acesso no histórico.' });
    }
  }
}
