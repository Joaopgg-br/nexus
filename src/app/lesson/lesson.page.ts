import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { IonContent } from '@ionic/angular';
import { Aula, Curso } from '../services/curso';
import { Pratica } from '../services/praticas';
import { SupabaseService } from '../services/supabase.service';

@Component({ selector: 'app-lesson', templateUrl: './lesson.page.html', styleUrls: ['./lesson.page.scss'], standalone: false })
export class LessonPage implements OnInit, OnDestroy {
  @ViewChild(IonContent) content?: IonContent;
  aulaIndex = 0;
  aula: Aula | null = null;
  praticas: Pratica[] = [];
  concluidas = new Set<string>();
  salvandoPraticas = new Set<string>();
  errosPraticas: Record<string, string> = {};
  carregando = true;
  salvando = false;
  mensagemErro = '';
  private ativa = false;
  private versao = 0;
  private subscription?: Subscription;

  constructor(private readonly router: Router, private readonly route: ActivatedRoute,
    private readonly supabase: SupabaseService, public readonly curso: Curso) {}

  ngOnInit(): void {
    this.subscription = this.route.paramMap.subscribe(params => {
      this.aulaIndex = Number(params.get('aulaIndex'));
      if (this.ativa) { void this.carregarAula(); }
    });
  }
  ionViewWillEnter(): void { this.ativa = true; void this.carregarAula(); }
  ionViewWillLeave(): void {
    this.ativa = false;
    this.versao++;
    this.aula = null;
    this.concluidas.clear();
  }
  ngOnDestroy(): void { this.ionViewWillLeave(); this.subscription?.unsubscribe(); }

  async carregarAula(): Promise<void> {
    const versao = ++this.versao;
    this.carregando = true;
    this.aula = null;
    this.mensagemErro = '';
    this.concluidas = new Set();
    this.errosPraticas = {};
    this.salvandoPraticas = new Set();
    this.salvando = false;
    this.curso.restaurarProgresso([]);
    try {
      const historico = await this.supabase.buscarHistorico();
      if (versao !== this.versao) { return; }
      this.curso.restaurarProgresso(historico.filter(item => item.tipo === 'aula_concluida' && item.curso_id === this.curso.id && typeof item.aula_indice === 'number').map(item => item.aula_indice as number));
      const aula = Number.isInteger(this.aulaIndex) ? this.curso.getAula(this.aulaIndex) : null;
      if (!aula || aula.bloqueada) { this.mensagemErro = 'Aula não encontrada ou ainda bloqueada.'; return; }
      this.aula = aula;
      this.praticas = this.curso.praticasDaAula(this.aulaIndex);
      this.concluidas = new Set(this.praticas.filter(pratica => historico.some(item =>
        item.tipo === 'quiz_concluido' && item.curso_id === this.curso.id && item.aula_indice === this.aulaIndex && item.titulo === this.curso.tituloRegistroPratica(pratica)
      )).map(pratica => pratica.id));
      void this.content?.scrollToTop(0);
      try {
        await this.supabase.registrarAtividade({ tipo: 'aula_acessada', titulo: 'Aula acessada', descricao: aula.titulo, cursoId: this.curso.id, aulaIndice: this.aulaIndex });
      } catch {
        if (versao === this.versao) { this.mensagemErro = 'Não foi possível registrar o acesso. Você pode estudar e tentar salvar suas práticas.'; }
      }
    } catch {
      if (versao === this.versao) { this.mensagemErro = 'Não foi possível carregar seu progresso. Tente novamente.'; }
    } finally {
      if (versao === this.versao) { this.carregando = false; }
    }
  }

  async salvarPratica(pratica: Pratica): Promise<void> {
    if (!this.aula || !this.praticas.includes(pratica) || this.concluidas.has(pratica.id) || this.salvandoPraticas.has(pratica.id)) { return; }
    const versao = this.versao;
    this.salvandoPraticas.add(pratica.id);
    this.errosPraticas[pratica.id] = '';
    try {
      await this.supabase.registrarAtividade({ tipo: 'quiz_concluido', titulo: this.curso.tituloRegistroPratica(pratica), descricao: `${pratica.objetivo} Todas as decisões corretas.`, cursoId: this.curso.id, aulaIndice: this.aulaIndex });
      if (versao === this.versao) { this.concluidas.add(pratica.id); }
    } catch {
      if (versao === this.versao) { this.errosPraticas[pratica.id] = 'Sua resposta está correta, mas o resultado não foi salvo. Tente novamente.'; }
    } finally {
      if (versao === this.versao) { this.salvandoPraticas.delete(pratica.id); }
    }
  }
  get podeConcluir(): boolean { return !!this.aula && !this.carregando && !this.salvando && this.praticas.length > 0 && this.praticas.every(p => this.concluidas.has(p.id)); }
  voltar(): void { void this.router.navigate(['/courses']); }
  temAulaAnterior(): boolean { return this.aulaIndex > 0 && !this.curso.getAula(this.aulaIndex - 1)?.bloqueada; }
  temProximaAula(): boolean { const aula = this.curso.getAula(this.aulaIndex + 1); return !!aula && !aula.bloqueada; }
  aulaAnterior(): void { if (this.temAulaAnterior()) { void this.router.navigate(['/lesson', this.aulaIndex - 1]); } }
  proximaAula(): void { if (this.temProximaAula()) { void this.router.navigate(['/lesson', this.aulaIndex + 1]); } }

  async marcarConcluida(): Promise<void> {
    if (!this.podeConcluir || !this.aula || this.aula.concluida) { return; }
    const versao = this.versao;
    this.salvando = true;
    this.mensagemErro = '';
    try {
      await this.supabase.registrarAtividade({ tipo: 'aula_concluida', titulo: 'Aula concluída', descricao: `${this.aula.titulo} · ${this.praticas.length} prática(s) concluída(s).`, cursoId: this.curso.id, aulaIndice: this.aulaIndex });
      if (versao !== this.versao) { return; }
      this.curso.marcarAulaConcluida(this.aulaIndex);
      await this.router.navigate(this.temProximaAula() ? ['/lesson', this.aulaIndex + 1] : ['/courses']);
    } catch {
      if (versao === this.versao) { this.mensagemErro = 'Não foi possível salvar a conclusão. Tente novamente.'; }
    } finally {
      if (versao === this.versao) { this.salvando = false; }
    }
  }
}
