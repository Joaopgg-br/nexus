import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Pratica } from '../../services/praticas';

export type RespostaPratica = { escolhas: string[]; associacoes: Record<string, string>; ordem: string[] };

export function avaliarPratica(pratica: Pratica, resposta: RespostaPratica): boolean {
  if (pratica.tipo === 'associacao') {
    return !!pratica.itens?.length && pratica.itens.every(item => resposta.associacoes[item.id] === item.resposta);
  }
  const corretas = pratica.corretas ?? [];
  const recebidas = pratica.tipo === 'ordem' ? resposta.ordem : resposta.escolhas;
  return corretas.length > 0 && recebidas.length === corretas.length &&
    new Set(recebidas).size === recebidas.length &&
    (pratica.tipo === 'ordem'
      ? corretas.every((id, i) => recebidas[i] === id)
      : corretas.every(id => recebidas.includes(id)));
}

@Component({
  selector: 'app-pratica', standalone: false,
  templateUrl: './pratica.component.html', styleUrls: ['./pratica.component.scss']
})
export class PraticaComponent implements OnChanges {
  @Input({ required: true }) pratica!: Pratica;
  @Input() concluida = false;
  @Input() salvando = false;
  @Input() erro = '';
  @Output() aprovada = new EventEmitter<void>();
  resposta: RespostaPratica = { escolhas: [], associacoes: {}, ordem: [] };
  verificada = false;
  correta = false;
  private praticaId = '';

  ngOnChanges(): void {
    if (this.pratica.id !== this.praticaId) {
      this.praticaId = this.pratica.id;
      this.resetar();
    }
  }
  resetar(): void {
    this.resposta = { escolhas: [], associacoes: {}, ordem: this.pratica.opcoes.map(item => item.id) };
    this.verificada = false;
    this.correta = false;
  }
  selecionar(id: string): void {
    if (this.bloqueada) { return; }
    const lista = this.resposta.escolhas;
    this.resposta.escolhas = lista.includes(id) ? lista.filter(item => item !== id) : [...lista, id];
    this.verificada = false;
  }
  mover(index: number, delta: number): void {
    const destino = index + delta;
    if (this.bloqueada || destino < 0 || destino >= this.resposta.ordem.length) { return; }
    const ordem = this.resposta.ordem;
    [ordem[index], ordem[destino]] = [ordem[destino], ordem[index]];
    this.verificada = false;
  }
  texto(id: string): string { return this.pratica.opcoes.find(item => item.id === id)?.texto ?? ''; }
  get bloqueada(): boolean { return this.concluida || this.correta || this.salvando; }
  get respondida(): boolean {
    return this.pratica.tipo === 'multipla' ? this.resposta.escolhas.length > 0 :
      this.pratica.tipo === 'associacao' ? !!this.pratica.itens?.every(item => !!this.resposta.associacoes[item.id]) : true;
  }
  verificar(): void {
    if (!this.respondida || this.bloqueada) { return; }
    this.correta = avaliarPratica(this.pratica, this.resposta);
    this.verificada = true;
    if (this.correta) { this.aprovada.emit(); }
  }
}
