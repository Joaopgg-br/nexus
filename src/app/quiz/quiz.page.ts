import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import {
  Curso,
  PerguntaQuiz
} from '../services/curso';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.page.html',
  styleUrls: ['./quiz.page.scss'],
  standalone: false,
})
export class QuizPage implements OnInit {

  perguntas: PerguntaQuiz[] = [];

  perguntaAtual: number = 0;

  respostaSelecionada: number | null = null;

  respostas: number[] = [];

  quizFinalizado: boolean = false;

  acertos: number = 0;

  nota: number = 0;

  constructor(
    private router: Router,
    public curso: Curso
  ) {}

  ngOnInit() {

    // Verifica se o quiz está liberado
    if (!this.curso.quizLiberado) {

      this.router.navigate([
        '/courses'
      ]);

      return;

    }

    this.perguntas =
      this.curso.perguntasQuiz;

    this.respostas =
      new Array(this.perguntas.length).fill(-1);

  }


  // =========================
  // SELECIONAR RESPOSTA
  // =========================

  selecionarResposta(index: number): void {

    this.respostaSelecionada = index;

    this.respostas[
      this.perguntaAtual
    ] = index;

  }


  // =========================
  // AVANÇAR
  // =========================

  proximaPergunta(): void {

    if (
      this.respostaSelecionada === null
    ) {
      return;
    }

    if (
      this.perguntaAtual <
      this.perguntas.length - 1
    ) {

      this.perguntaAtual++;

      this.respostaSelecionada =
        this.respostas[
          this.perguntaAtual
        ];

    } else {

      this.finalizarQuiz();

    }

  }


  // =========================
  // VOLTAR
  // =========================

  perguntaAnterior(): void {

    if (this.perguntaAtual <= 0) {
      return;
    }

    this.perguntaAtual--;

    this.respostaSelecionada =
      this.respostas[
        this.perguntaAtual
      ];

  }


  // =========================
  // FINALIZAR
  // =========================

  finalizarQuiz(): void {

    this.acertos = 0;

    for (
      let i = 0;
      i < this.perguntas.length;
      i++
    ) {

      if (
        this.respostas[i] ===
        this.perguntas[i].respostaCorreta
      ) {

        this.acertos++;

      }

    }

    this.nota =
      Math.round(
        (
          this.acertos /
          this.perguntas.length
        ) * 100
      );

    this.curso.finalizarQuiz(
      this.nota
    );

    this.quizFinalizado = true;

  }


  // =========================
  // REFAZER
  // =========================

  refazerQuiz(): void {

    this.perguntaAtual = 0;

    this.respostaSelecionada = null;

    this.respostas =
      new Array(
        this.perguntas.length
      ).fill(-1);

    this.acertos = 0;

    this.nota = 0;

    this.quizFinalizado = false;

    this.curso.resetarQuiz();

  }


  // =========================
  // VOLTAR PARA O CURSO
  // =========================

  voltarCurso(): void {

    this.router.navigate([
      '/courses'
    ]);

  }


  // =========================
  // TEXTO DA NOTA
  // =========================

  getMensagemResultado(): string {

    if (this.nota >= 70) {

      return 'Parabéns! Você foi aprovado no quiz.';

    }

    return 'Você não atingiu a nota mínima. Tente novamente!';

  }

}