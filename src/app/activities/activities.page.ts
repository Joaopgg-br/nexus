import { Component } from '@angular/core';

interface AtividadeHistorico {
  titulo: string;
  descricao: string;
  data: string;
  icone: string;
}

@Component({
  selector: 'app-activities',
  templateUrl: './activities.page.html',
  styleUrls: ['./activities.page.scss'],
  standalone: false,
})
export class ActivitiesPage {

  historico: AtividadeHistorico[] = [
    {
      titulo: 'Aula concluída',
      descricao: 'Introduction to Cybersecurity',
      data: 'Hoje',
      icone: 'checkmark-circle-outline',
    },
    {
      titulo: 'Quiz respondido',
      descricao: 'Quiz Final de Cibersegurança',
      data: 'Ontem',
      icone: 'document-text-outline',
    },
  ];

}