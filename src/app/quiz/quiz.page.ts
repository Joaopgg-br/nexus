import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { Curso, PerguntaQuiz } from '../services/curso';
import { NovaAtividade, SupabaseService } from '../services/supabase.service';

@Component({ selector: 'app-quiz', templateUrl: './quiz.page.html', styleUrls: ['./quiz.page.scss'], standalone: false })
export class QuizPage {
  @ViewChild(IonContent) content?: IonContent;
  perguntas: PerguntaQuiz[] = [];
  perguntaAtual = 0;
  respostaSelecionada: number | null = null;
  respostas: number[] = [];
  quizFinalizado = false;
  acertos = 0;
  nota = 0;
  erroRegistro = '';
  carregando = true;
  erroCarregamento = '';
  salvando = false;
  registroSalvo = false;
  private versao = 0;

  constructor(private readonly router: Router, private readonly supabase: SupabaseService, public readonly curso: Curso) {}

  async ionViewWillEnter(): Promise<void> {
    const versao = ++this.versao;
    this.carregando = true;
    this.erroCarregamento = '';
    this.perguntas = [];
    this.refazerQuiz();
    this.curso.restaurarProgresso([]);
    try {
      const historico = await this.supabase.buscarHistorico();
      if (versao !== this.versao) { return; }
      this.curso.restaurarProgresso(historico.filter(item => item.tipo === 'aula_concluida' && item.curso_id === this.curso.id && typeof item.aula_indice === 'number').map(item => item.aula_indice as number));
      if (!this.curso.quizLiberado) { await this.router.navigate(['/courses']); return; }
      this.perguntas = this.curso.perguntasQuiz;
      this.respostas = new Array(this.perguntas.length).fill(-1);
    } catch {
      if (versao === this.versao) { this.erroCarregamento = 'Não foi possível verificar seu progresso.'; }
    } finally {
      if (versao === this.versao) { this.carregando = false; }
    }
  }
  ionViewWillLeave(): void { this.versao++; this.perguntas = []; this.respostas = []; this.salvando = false; }

  selecionarResposta(index: number): void {
    const pergunta = this.perguntas[this.perguntaAtual];
    if (this.quizFinalizado || this.salvando || !pergunta || !Number.isInteger(index) || index < 0 || index >= pergunta.opcoes.length) { return; }
    this.respostaSelecionada = index;
    this.respostas[this.perguntaAtual] = index;
  }
  async proximaPergunta(): Promise<void> {
    if (this.salvando || this.quizFinalizado || this.respostaSelecionada === null || this.respostaSelecionada < 0) { return; }
    if (this.perguntaAtual < this.perguntas.length - 1) {
      this.perguntaAtual++;
      this.restaurarSelecao();
      return;
    }
    if (this.perguntas.length === 0 || this.respostas.length !== this.perguntas.length || this.respostas.some((resposta, i) => resposta < 0 || resposta >= this.perguntas[i].opcoes.length)) { return; }
    this.acertos = this.perguntas.reduce((total, pergunta, i) => total + Number(this.respostas[i] === pergunta.respostaCorreta), 0);
    this.nota = Math.round(this.acertos / this.perguntas.length * 100);
    this.quizFinalizado = true;
    void this.content?.scrollToTop(0);
    await this.salvarResultado();
  }
  perguntaAnterior(): void {
    if (this.perguntaAtual <= 0 || this.quizFinalizado || this.salvando) { return; }
    this.perguntaAtual--;
    this.restaurarSelecao();
  }
  private restaurarSelecao(): void {
    const resposta = this.respostas[this.perguntaAtual];
    this.respostaSelecionada = resposta >= 0 ? resposta : null;
    void this.content?.scrollToTop(0);
  }
  async salvarResultado(): Promise<void> {
    if (!this.quizFinalizado || this.salvando || this.registroSalvo) { return; }
    const versao = this.versao;
    this.salvando = true;
    this.erroRegistro = '';
    const atividades: NovaAtividade[] = [{ tipo: 'quiz_concluido', titulo: 'Avaliação final concluída', descricao: `${this.curso.nome}: ${this.nota}% (${this.acertos}/${this.perguntas.length})`, cursoId: this.curso.id }];
    if (this.nota >= 70) { atividades.push({ tipo: 'curso_concluido', titulo: 'Curso concluído', descricao: this.curso.nome, cursoId: this.curso.id }); }
    try {
      // Um único INSERT evita salvar só metade do resultado da avaliação.
      await this.supabase.registrarAtividades(atividades);
      if (versao === this.versao) { this.registroSalvo = true; this.curso.finalizarQuiz(this.nota); }
    } catch {
      if (versao === this.versao) { this.erroRegistro = 'O resultado foi calculado, mas ainda não foi salvo no histórico.'; }
    } finally {
      if (versao === this.versao) { this.salvando = false; }
    }
  }
  refazerQuiz(): void {
    if (this.salvando) { return; }
    this.perguntaAtual = 0;
    this.respostaSelecionada = null;
    this.respostas = new Array(this.perguntas.length).fill(-1);
    this.acertos = 0;
    this.nota = 0;
    this.quizFinalizado = false;
    this.erroRegistro = '';
    this.registroSalvo = false;
    this.curso.resetarQuiz();
    void this.content?.scrollToTop(0);
  }
  voltarCurso(): void { void this.router.navigate(['/courses']); }
  getMensagemResultado(): string { return this.nota >= 70 ? 'Parabéns! Você foi aprovado na avaliação.' : 'Revise as explicações e tente novamente.'; }
}
