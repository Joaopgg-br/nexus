import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  DomSanitizer,
  SafeResourceUrl
} from '@angular/platform-browser';

import { Curso, Aula } from '../services/curso';

@Component({
  selector: 'app-lesson',
  templateUrl: './lesson.page.html',
  styleUrls: ['./lesson.page.scss'],
  standalone: false,
})
export class LessonPage implements OnInit {

  cursoNome: string = 'Introduction to Cybersecurity';

  aulaIndex: number = 0;

  aula: Aula | null = null;

  videoSeguro: SafeResourceUrl | null = null;

  totalAulas: number = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private curso: Curso
  ) {}

  ngOnInit() {

    this.route.paramMap.subscribe(params => {

      this.aulaIndex = Number(
        params.get('aulaIndex')
      );

      this.carregarAula();

    });

  }

  carregarAula() {

    // Quantidade total de aulas
    this.totalAulas = this.curso.aulas.length;

    // Busca a aula pelo índice
    this.aula = this.curso.getAula(
      this.aulaIndex
    );

    // Configura o vídeo
    if (this.aula) {

      this.videoSeguro =
        this.sanitizer.bypassSecurityTrustResourceUrl(
          this.aula.videoUrl
        );

    }

  }

  voltar() {

    this.router.navigate([
      '/courses'
    ]);

  }

  temAulaAnterior(): boolean {

    return this.aulaIndex > 0;

  }

  temProximaAula(): boolean {

    return (
      this.aulaIndex <
      this.totalAulas - 1
    );

  }

  aulaAnterior() {

    if (!this.temAulaAnterior()) {
      return;
    }

    this.router.navigate([
      '/lesson',
      this.aulaIndex - 1
    ]);

  }

  proximaAula() {

    if (!this.temProximaAula()) {
      return;
    }

    const proximaAula =
      this.curso.getAula(
        this.aulaIndex + 1
      );

    // Não permite entrar em aula bloqueada
    if (
      !proximaAula ||
      proximaAula.bloqueada
    ) {
      console.log('Próxima aula está bloqueada');
      return;
    }

    this.router.navigate([
      '/lesson',
      this.aulaIndex + 1
    ]);

  }

  marcarConcluida() {

    if (!this.aula) {
      return;
    }

    // Marca a aula atual como concluída
    // e desbloqueia a próxima
    this.curso.marcarAulaConcluida(
      this.aulaIndex
    );

    // Vai para a próxima aula
    if (this.temProximaAula()) {

      this.router.navigate([
        '/lesson',
        this.aulaIndex + 1
      ]);

    } else {

      // Se foi a última aula,
      // volta para a página do curso
      this.voltar();

    }

  }

}