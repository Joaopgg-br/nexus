import { Component } from '@angular/core';

import {
  AtividadeHistorico,
  SupabaseService,
  TipoAtividade
} from '../services/supabase.service';

@Component({
  selector: 'app-activities',
  templateUrl: './activities.page.html',
  styleUrls: ['./activities.page.scss'],
  standalone: false
})
export class ActivitiesPage {

  historico: AtividadeHistorico[] = [];
  carregando = true;
  mensagemErro = '';

  constructor(
    private readonly supabase: SupabaseService
  ) {}

  async ionViewWillEnter(): Promise<void> {
    await this.carregarHistorico();
  }

  async carregarHistorico(): Promise<void> {
    this.carregando = true;
    this.mensagemErro = '';

    try {
      this.historico =
        await this.supabase.buscarHistorico();
    } catch {
      this.historico = [];
      this.mensagemErro =
        'Não foi possível carregar o histórico.';
    } finally {
      this.carregando = false;
    }
  }

  iconePara(tipo: TipoAtividade): string {
    const icones: Record<TipoAtividade, string> = {
      curso_acessado: 'book-outline',
      curso_iniciado: 'play-circle-outline',
      aula_acessada: 'eye-outline',
      aula_concluida: 'checkmark-circle-outline',
      quiz_concluido: 'document-text-outline',
      curso_concluido: 'trophy-outline'
    };

    return icones[tipo];
  }

  rotuloPara(tipo: TipoAtividade): string {
    const rotulos: Record<TipoAtividade, string> = {
      curso_acessado: 'Curso',
      curso_iniciado: 'Início',
      aula_acessada: 'Aula',
      aula_concluida: 'Conclusão',
      quiz_concluido: 'Quiz',
      curso_concluido: 'Curso concluído'
    };

    return rotulos[tipo];
  }
}
