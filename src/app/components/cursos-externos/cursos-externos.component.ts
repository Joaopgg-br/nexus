import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CursoExterno } from '../../models/moodle';
import { MoodleService } from '../../services/moodle.service';

@Component({
  selector: 'app-cursos-externos', standalone: true,
  imports: [CommonModule, RouterModule, IonicModule],
  templateUrl: './cursos-externos.component.html', styleUrls: ['./cursos-externos.component.scss']
})
export class CursosExternosComponent {
  @Input() busca = '';
  @Input() gerenciar = true;
  constructor(public readonly moodle: MoodleService) {}
  filtrar(cursos: CursoExterno[]): CursoExterno[] {
    const termo = this.busca.trim().toLocaleLowerCase('pt-BR');
    return cursos.filter(curso => curso.titulo.toLocaleLowerCase('pt-BR').includes(termo) || 'moodle'.includes(termo));
  }
  status(curso: CursoExterno): string {
    if (curso.concluido === true) { return 'Concluído no Moodle'; }
    if (curso.progresso === null) { return 'Progresso não informado pelo Moodle'; }
    if (curso.progresso === 100) { return '100% das atividades · conclusão ainda não confirmada'; }
    return `${curso.progresso}% das atividades`;
  }
}
