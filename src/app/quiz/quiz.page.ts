import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import {
  Curso,
  PerguntaQuiz
} from '../services/curso';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.page.html',
  styleUrls: ['./quiz.page.scss'],
  standalone: false
})
export class QuizPage implements OnInit {

  perguntas: PerguntaQuiz[] = [];
  perguntaAtual = 0;
  respostaSelecionada: number | null = null;
  respostas: number[] = [];
  quizFinalizado = false;
  acertos = 0;
  nota = 0;
  erroRegistro = '';

  constructor(
    private readonly router: Router,
    private readonly supabase: SupabaseService,
    public readonly curso: Curso
  ) {}

  async ngOnInit(): Promise<void> {
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
        'Não foi possível verificar o progresso.',
        error
      );
    }

    if (!this.curso.quizLiberado) {
      await this.router.navigate(['/courses']);
      return;
    }

    this.perguntas = this.curso.perguntasQuiz;
    this.respostas =
      new Array(this.perguntas.length).fill(-1);
  }

  selecionarResposta(index: number): void {
    this.respostaSelecionada = index;
    this.respostas[this.perguntaAtual] = index;
  }

  async proximaPergunta(): Promise<void> {
    if (this.respostaSelecionada === null) {
      return;
    }

    if (
      this.perguntaAtual <
      this.perguntas.length - 1
    ) {
      this.perguntaAtual++;
      this.respostaSelecionada =
        this.respostas[this.perguntaAtual];
      return;
    }

    await this.finalizarQuiz();
  }

  perguntaAnterior(): void {
    if (this.perguntaAtual <= 0) {
      return;
    }

    this.perguntaAtual--;
    this.respostaSelecionada =
      this.respostas[this.perguntaAtual];
  }

  private async finalizarQuiz(): Promise<void> {
    this.acertos = this.perguntas.reduce(
      (total, pergunta, index) =>
        total + (
          this.respostas[index] ===
          pergunta.respostaCorreta
            ? 1
            : 0
        ),
      0
    );

    this.nota = Math.round(
      (this.acertos / this.perguntas.length) * 100
    );

    this.curso.finalizarQuiz(this.nota);
    this.quizFinalizado = true;
    this.erroRegistro = '';

    try {
      await this.supabase.registrarAtividade({
        tipo: 'quiz_concluido',
        titulo: 'Quiz concluído',
        descricao: `${this.curso.nome}: ${this.nota}%`,
        cursoId: this.curso.id
      });

      if (this.curso.foiAprovado()) {
        await this.supabase.registrarAtividade({
          tipo: 'curso_concluido',
          titulo: 'Curso concluído',
          descricao: this.curso.nome,
          cursoId: this.curso.id
        });
      }
    } catch {
      this.erroRegistro =
        'O resultado foi calculado, mas não foi possível registrá-lo no histórico.';
    }
  }

  refazerQuiz(): void {
    this.perguntaAtual = 0;
    this.respostaSelecionada = null;
    this.respostas =
      new Array(this.perguntas.length).fill(-1);
    this.acertos = 0;
    this.nota = 0;
    this.quizFinalizado = false;
    this.erroRegistro = '';
    this.curso.resetarQuiz();
  }

  voltarCurso(): void {
    void this.router.navigate(['/courses']);
  }

  getMensagemResultado(): string {
    return this.nota >= 70
      ? 'Parabéns! Você foi aprovado no quiz.'
      : 'Você não atingiu a nota mínima. Tente novamente!';
  }
}
