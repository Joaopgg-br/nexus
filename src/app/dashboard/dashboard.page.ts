import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface CursoResumo {

  id: number;

  titulo: string;

  categoria: string;

  imagem: string;

  duracao?: string;

  corThumb: string;

}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false,
})
export class DashboardPage {

  termoBusca: string = '';

  cursos: CursoResumo[] = [
    {
      id: 1,
      titulo: 'Introduction to Cybersecurity',
      categoria: 'Cybersecurity',
      imagem: 'assets/ciber.jpg',
      duracao: '6h',
      corThumb: 'thumb-cyber',
    }
  ];

  constructor(private router: Router) {}

  get cursosFiltrados(): CursoResumo[] {

    if (!this.termoBusca.trim()) {
      return this.cursos;
    }

    const termo = this.termoBusca.toLowerCase();

    return this.cursos.filter(c =>
      c.titulo.toLowerCase().includes(termo) ||
      c.categoria.toLowerCase().includes(termo)
    );

  }

  abrirCurso() {
    this.router.navigate(['/courses']);
  }

  irHome() {
    this.router.navigate(['/dashboard']);
  }

  abrirPerfil() {
    this.router.navigate(['/profile']);
  }

}