import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false
})
export class ProfilePage {

  nome = '';
  email = '';
  avatarUrl = '';
  fotoPerfil = 'assets/perfil.png';
  statusConta = '';
  carregando = true;
  salvando = false;
  mensagem = '';
  mensagemErro = '';

  constructor(
    private readonly router: Router,
    private readonly supabase: SupabaseService
  ) {}

  async ionViewWillEnter(): Promise<void> {
    await this.carregarPerfil();
  }

  private async carregarPerfil(): Promise<void> {
    this.carregando = true;
    this.mensagemErro = '';

    const { data, error } =
      await this.supabase.usuarioAtual();

    if (error || !data.user) {
      await this.router.navigateByUrl(
        '/home',
        { replaceUrl: true }
      );
      return;
    }

    const metadata = data.user.user_metadata;

    this.nome =
      metadata?.['full_name'] ??
      metadata?.['name'] ??
      '';
    this.email = data.user.email ?? '';
    this.avatarUrl =
      metadata?.['avatar_url'] ??
      metadata?.['picture'] ??
      '';
    this.fotoPerfil =
      this.avatarUrl || 'assets/perfil.png';
    this.statusConta =
      data.user.email_confirmed_at
        ? 'E-mail confirmado'
        : 'Confirmação de e-mail pendente';
    this.carregando = false;
  }

  async salvarPerfil(): Promise<void> {
    this.salvando = true;
    this.mensagem = '';
    this.mensagemErro = '';

    const { data, error } =
      await this.supabase.atualizarPerfil(
        this.nome,
        this.avatarUrl
      );

    if (error) {
      this.mensagemErro =
        'Não foi possível salvar o perfil.';
      this.salvando = false;
      return;
    }

    const metadata = data.user.user_metadata;

    this.nome =
      metadata?.['full_name'] ?? '';
    this.avatarUrl =
      metadata?.['avatar_url'] ?? '';
    this.fotoPerfil =
      this.avatarUrl || 'assets/perfil.png';
    this.mensagem = 'Perfil atualizado.';
    this.salvando = false;
  }

  async sair(): Promise<void> {
    this.mensagemErro = '';

    const { error } = await this.supabase.logout();

    if (error) {
      this.mensagemErro =
        'Não foi possível encerrar a sessão.';
      return;
    }

    await this.router.navigateByUrl(
      '/home',
      { replaceUrl: true }
    );
  }

  usarAvatarPadrao(): void {
    this.fotoPerfil = 'assets/perfil.png';
  }
}
