import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { environment } from '../../environments/environment';

export type TipoAtividade =
  | 'curso_acessado'
  | 'curso_iniciado'
  | 'aula_acessada'
  | 'aula_concluida'
  | 'quiz_concluido'
  | 'curso_concluido';

export interface AtividadeHistorico {
  id: string;
  usuario_id: string;
  tipo: TipoAtividade;
  titulo: string;
  descricao: string | null;
  curso_id: number | null;
  aula_indice: number | null;
  criado_em: string;
}

export interface NovaAtividade {
  tipo: TipoAtividade;
  titulo: string;
  descricao?: string;
  cursoId?: number;
  aulaIndice?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  private readonly supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  login(email: string, senha: string) {
    return this.supabase.auth.signInWithPassword({
      email,
      password: senha
    });
  }

  cadastrar(email: string, senha: string, nome: string) {
    return this.supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          full_name: nome.trim()
        }
      }
    });
  }

  logout() {
    return this.supabase.auth.signOut();
  }

  usuarioAtual() {
    return this.supabase.auth.getUser();
  }

  sessaoAtual() {
    return this.supabase.auth.getSession();
  }

  atualizarPerfil(nome: string, avatarUrl: string) {
    return this.supabase.auth.updateUser({
      data: {
        full_name: nome.trim() || null,
        avatar_url: avatarUrl.trim() || null
      }
    });
  }

  async registrarAtividade(atividade: NovaAtividade): Promise<void> {
    const { data, error } = await this.usuarioAtual();

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('Usuário não autenticado.');
    }

    const { error: insertError } = await this.supabase
      .from('historico')
      .insert({
        usuario_id: data.user.id,
        tipo: atividade.tipo,
        titulo: atividade.titulo,
        descricao: atividade.descricao ?? null,
        curso_id: atividade.cursoId ?? null,
        aula_indice: atividade.aulaIndice ?? null
      });

    if (insertError) {
      throw insertError;
    }
  }

  async buscarHistorico(): Promise<AtividadeHistorico[]> {
    const { data: usuario, error: userError } =
      await this.usuarioAtual();

    if (userError) {
      throw userError;
    }

    if (!usuario.user) {
      throw new Error('Usuário não autenticado.');
    }

    const { data, error } = await this.supabase
      .from('historico')
      .select(
        'id, usuario_id, tipo, titulo, descricao, curso_id, aula_indice, criado_em'
      )
      .eq('usuario_id', usuario.user.id)
      .order('criado_em', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []) as AtividadeHistorico[];
  }
}
