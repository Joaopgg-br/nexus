import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Curso, Aula } from '../services/curso';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.page.html',
  styleUrls: ['./courses.page.scss'],
  standalone: false,
})
export class CoursesPage implements OnInit {

  constructor(
    private router: Router,
    public curso: Curso
  ) {}

  ngOnInit() {
  }

  ionViewWillEnter() {
    // Atualiza a página quando voltar de uma aula.
    // Como o curso é compartilhado pelo service,
    // os cadeados já estarão com o estado atualizado.
  }

  voltar() {
    this.router.navigate(['/dashboard']);
  }

  salvarCurso() {
    console.log('Curso salvo');
  }

  abrirAula(aula: Aula) {

  if (aula.bloqueada) {

    console.log(
      'Aula bloqueada:',
      aula.titulo
    );

    return;
  }

  const index =
    this.curso.aulas.indexOf(aula);

  this.router.navigate([
    '/lesson',
    index
  ]);

}


abrirQuiz(): void {

  if (!this.curso.quizLiberado) {
    return;
  }

  this.router.navigate([
    '/quiz'
  ]);

}
  comecarCurso() {

    // Começa pela primeira aula
    this.router.navigate([
      '/lesson',
      0
    ]);
  }
}