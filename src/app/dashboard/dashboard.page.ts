import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { Curso } from '../services/curso';
import { SupabaseService } from '../services/supabase.service';

interface CursoResumo {
  id: number;
  titulo: string;
  categoria: string;
  imagem: string;
  duracao?: string;
  corThumb: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false
})
export class DashboardPage {

  termoBusca = '';
  nomeUsuario = '';
  fotoPerfil = 'assets/perfil.png';
  cursos: CursoResumo[] = [];

  constructor(
    private readonly router: Router,
    private readonly supabase: SupabaseService,
    curso: Curso
  ) {
    this.cursos = [{
      id: curso.id,
      titulo: curso.nome,
      categoria: curso.categoria,
      imagem: curso.imagem,
      duracao: curso.cargaHoraria,
      corThumb: 'thumb-cyber'
    }];
  }

  async ionViewWillEnter(): Promise<void> {
    const { data } = await this.supabase.usuarioAtual();
    const metadata = data.user?.user_metadata;

    this.nomeUsuario =
      metadata?.['full_name'] ??
      metadata?.['name'] ??
      '';

    this.fotoPerfil =
      metadata?.['avatar_url'] ??
      metadata?.['picture'] ??
      'assets/perfil.png';
  }

  get cursosFiltrados(): CursoResumo[] {
    const termo = this.termoBusca
      .trim()
      .toLowerCase();

    if (!termo) {
      return this.cursos;
    }

    return this.cursos.filter(curso =>
      curso.titulo.toLowerCase().includes(termo) ||
      curso.categoria.toLowerCase().includes(termo)
    );
  }

  async abrirCurso(curso: CursoResumo): Promise<void> {
    try {
      await this.supabase.registrarAtividade({
        tipo: 'curso_acessado',
        titulo: 'Curso acessado',
        descricao: curso.titulo,
        cursoId: curso.id
      });
    } catch (error) {
      console.error(
        'Não foi possível registrar o acesso ao curso.',
        error
      );
    }

    await this.router.navigate(['/courses']);
  }

  abrirPerfil(): void {
    void this.router.navigate(['/profile']);
  }

  usarAvatarPadrao(): void {
    this.fotoPerfil = 'assets/perfil.png';
  }
}
