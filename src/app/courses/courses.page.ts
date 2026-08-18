import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.page.html',
  styleUrls: ['./courses.page.scss'],
  standalone: false,
})
export class CoursesPage {

  constructor(private router: Router) {}

  voltar() {
    this.router.navigate(['/dashboard']);
  }

  salvarCurso() {
    console.log('Curso salvo: Introduction to Cybersecurity');
    // TODO: persistir em serviço/storage
  }

  abrirAula(tituloAula: string) {
    console.log('Abrindo aula:', tituloAula);
    // TODO: navegar pra tela do player
  }

  comecarCurso() {
    console.log('Iniciando curso: Introduction to Cybersecurity');
    // TODO: navegar pra primeira aula
  }
}