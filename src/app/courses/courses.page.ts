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

  constructor(
    private readonly router: Router,
    private readonly supabase: SupabaseService,
    public readonly curso: Curso
  ) {}

  async ionViewWillEnter(): Promise<void> {
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
    } catch (error) {
      console.error(
        'Não foi possível restaurar o progresso.',
        error
      );
    }
  }

  voltar(): void {
    void this.router.navigate(['/dashboard']);
  }

  abrirAula(aula: Aula): void {
    if (aula.bloqueada) {
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

    await this.router.navigate(['/lesson', 0]);
  }
}
