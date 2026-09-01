import { Component, OnInit } from '@angular/core';
import {
  ActivatedRoute,
  Router
} from '@angular/router';
import {
  DomSanitizer,
  SafeResourceUrl
} from '@angular/platform-browser';

import { Aula, Curso } from '../services/curso';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-lesson',
  templateUrl: './lesson.page.html',
  styleUrls: ['./lesson.page.scss'],
  standalone: false
})
export class LessonPage implements OnInit {

  aulaIndex = 0;
  aula: Aula | null = null;
  videoSeguro: SafeResourceUrl | null = null;
  totalAulas = 0;
  carregando = true;
  mensagemErro = '';

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly sanitizer: DomSanitizer,
    private readonly supabase: SupabaseService,
    public readonly curso: Curso
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.aulaIndex = Number(
        params.get('aulaIndex')
      );

      void this.carregarAula();
    });
  }

  private async carregarAula(): Promise<void> {
    this.carregando = true;
    this.mensagemErro = '';

    try {
      const historico =
        await this.supabase.buscarHistorico();

      const concluidas = historico
        .filter(item =>
          item.tipo === 'aula_concluida' &&
          item.curso_id === this.curso.id &&
          typeof item.aula_indice === 'number'
        )
        .map(item => item.aula_indice as number);

      this.curso.restaurarProgresso(concluidas);
    } catch (error) {
      console.error(
        'Não foi possível restaurar o progresso.',
        error
      );
    }

    this.totalAulas = this.curso.aulas.length;
    const aula = this.curso.getAula(this.aulaIndex);

    if (!aula || aula.bloqueada) {
      this.aula = null;
      this.videoSeguro = null;
      this.carregando = false;
      return;
    }

    this.aula = aula;
    this.videoSeguro = aula.videoUrl
      ? this.sanitizer.bypassSecurityTrustResourceUrl(
          aula.videoUrl
        )
      : null;

    try {
      await this.supabase.registrarAtividade({
        tipo: 'aula_acessada',
        titulo: 'Aula acessada',
        descricao: aula.titulo,
        cursoId: this.curso.id,
        aulaIndice: this.aulaIndex
      });
    } catch (error) {
      console.error(
        'Não foi possível registrar o acesso à aula.',
        error
      );
    } finally {
      this.carregando = false;
    }
  }

  voltar(): void {
    void this.router.navigate(['/courses']);
  }

  temAulaAnterior(): boolean {
    return this.aulaIndex > 0;
  }

  temProximaAula(): boolean {
    const proxima =
      this.curso.getAula(this.aulaIndex + 1);

    return !!proxima && !proxima.bloqueada;
  }

  aulaAnterior(): void {
    if (!this.temAulaAnterior()) {
      return;
    }

    void this.router.navigate([
      '/lesson',
      this.aulaIndex - 1
    ]);
  }

  proximaAula(): void {
    if (!this.temProximaAula()) {
      return;
    }

    void this.router.navigate([
      '/lesson',
      this.aulaIndex + 1
    ]);
  }

  async marcarConcluida(): Promise<void> {
    if (!this.aula || this.aula.concluida) {
      return;
    }

    this.mensagemErro = '';

    try {
      await this.supabase.registrarAtividade({
        tipo: 'aula_concluida',
        titulo: 'Aula concluída',
        descricao: this.aula.titulo,
        cursoId: this.curso.id,
        aulaIndice: this.aulaIndex
      });
    } catch {
      this.mensagemErro =
        'Não foi possível salvar a conclusão. Tente novamente.';
      return;
    }

    this.curso.marcarAulaConcluida(
      this.aulaIndex
    );

    if (this.temProximaAula()) {
      await this.router.navigate([
        '/lesson',
        this.aulaIndex + 1
      ]);
      return;
    }

    await this.router.navigate(['/courses']);
  }
}
