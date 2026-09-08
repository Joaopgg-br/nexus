import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { Aula, Curso } from '../services/curso';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.page.html',
  styleUrls: ['./courses.page.scss'],
  standalone: false
})
export class CoursesPage {
  carregando = true;
  mensagemErro = '';

  get rotuloContinuar(): string {
    return this.curso.quizLiberado ? 'Abrir avaliação final' : this.curso.aulas.some(a => a.concluida) ? 'Continuar curso' : 'Começar curso';
  }

  constructor(
    private readonly router: Router,
    private readonly supabase: SupabaseService,
    public readonly curso: Curso
  ) {}

  async ionViewWillEnter(): Promise<void> {
    this.carregando = true;
    this.mensagemErro = '';
    this.curso.restaurarProgresso([]);
    this.curso.resetarQuiz();
    try {
      const historico =
        await this.supabase.buscarHistorico();

      const aulasConcluidas = historico
        .filter(item =>
          item.tipo === 'aula_concluida' &&
          item.curso_id === this.curso.id &&
          typeof item.aula_indice === 'number'
        )
        .map(item => item.aula_indice as number);

      this.curso.restaurarProgresso(
        aulasConcluidas
      );
    } catch {
      this.mensagemErro = 'Não foi possível carregar seu progresso.';
    } finally {
      this.carregando = false;
    }
  }

  voltar(): void {
    void this.router.navigate(['/dashboard']);
  }

  abrirAula(aula: Aula): void {
    if (this.carregando || this.mensagemErro || aula.bloqueada) {
      return;
    }

    const index = this.curso.aulas.indexOf(aula);

    void this.router.navigate([
      '/lesson',
      index
    ]);
  }

  abrirQuiz(): void {
    if (!this.curso.quizLiberado) {
      return;
    }

    void this.router.navigate(['/quiz']);
  }

  async comecarCurso(): Promise<void> {
    if (this.carregando || this.mensagemErro) { return; }
    if (this.curso.quizLiberado) { this.abrirQuiz(); return; }
    try {
      await this.supabase.registrarAtividade({
        tipo: 'curso_iniciado',
        titulo: 'Curso iniciado',
        descricao: this.curso.nome,
        cursoId: this.curso.id
      });
    } catch (error) {
      console.error(
        'Não foi possível registrar o início do curso.',
        error
      );
    }

    const indice = this.curso.aulas.findIndex(a => !a.concluida && !a.bloqueada);
    await this.router.navigate(['/lesson', Math.max(0, indice)]);
  }
}
