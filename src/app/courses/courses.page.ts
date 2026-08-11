import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

interface Aula {
  titulo: string;
  capitulo: string;
  duracao: string;
  bloqueada: boolean;
}

interface Curso {
  id: string;
  nome: string;
  categoria: string;
  imagem: string;
  corTema: string;
  nota: number;
  avaliacoes: number;
  descricao: string;
  aulas: Aula[];
}

@Component({
  selector: 'app-courses',
  templateUrl: './courses.page.html',
  styleUrls: ['./courses.page.scss'],
  standalone: false
})
export class CoursesPage implements OnInit {

  curso: Curso | null = null;

  // depois isso vem do backend — por enquanto mockado
  private cursos: { [key: string]: Curso } = {
    design: {
      id: 'design',
      nome: 'Design Gráfico e UI/UX',
      categoria: 'Ui/Ux',
      imagem: 'assets/design.jpg',
      corTema: 'orange',
      nota: 4.8,
      avaliacoes: 26,
      descricao: 'Aprenda os fundamentos do design digital, teoria, tipografia e a criação de interfaces modernas com aplicativos e programas.',
      aulas: [
        { titulo: 'Introdução ao Design', capitulo: 'Ui/Ux', duracao: '18 Min', bloqueada: false },
        { titulo: 'Princípios de design', capitulo: 'Criação de Interfaces', duracao: '22 Min', bloqueada: true },
      ]
    },
    logica: {
      id: 'logica',
      nome: 'Lógica de Programação',
      categoria: 'Lógica',
      imagem: 'assets/programacao.jpg',
      corTema: 'blue',
      nota: 4.8,
      avaliacoes: 26,
      descricao: 'Desenvolva o raciocínio lógico e aprenda a base da programação para criar soluções e algoritmos.',
      aulas: [
        { titulo: 'Introdução à Lógica', capitulo: 'Lógica', duracao: '18 Min', bloqueada: false },
        { titulo: 'Estruturas condicionais', capitulo: 'Laços de repetição', duracao: '20 Min', bloqueada: true },
      ]
    },
    js: {
      id: 'js',
      nome: 'JavaScript para Iniciantes',
      categoria: 'Js',
      imagem: 'assets/javascript.png',
      corTema: 'yellow',
      nota: 4.8,
      avaliacoes: 26,
      descricao: 'Aprenda a linguagem JavaScript e crie interatividade em páginas web de forma prática.',
      aulas: [
        { titulo: 'Primeiros passos no JS', capitulo: 'JavaScript', duracao: '18 Min', bloqueada: false },
        { titulo: 'Variáveis e funções', capitulo: 'Manipulação do DOM', duracao: '20 Min', bloqueada: true },
      ]
    },
    php: {
      id: 'php',
      nome: 'PHP para Web',
      categoria: 'Php',
      imagem: 'assets/php.png',
      corTema: 'dark',
      nota: 4.8,
      avaliacoes: 26,
      descricao: 'Aprenda a desenvolver sistemas web dinâmicos utilizando PHP e integração com banco de dados.',
      aulas: [
        { titulo: 'Introdução ao PHP', capitulo: 'Php', duracao: '18 Min', bloqueada: false },
        { titulo: 'Conexão com banco', capitulo: 'CRUD básico', duracao: '20 Min', bloqueada: true },
      ]
    },
    java: {
      id: 'java',
      nome: 'Programação em Java',
      categoria: 'Java',
      imagem: 'assets/java.png',
      corTema: 'dark',
      nota: 4.8,
      avaliacoes: 26,
      descricao: 'Aprenda programação orientada a objetos com Java e desenvolva sistemas robustos.',
      aulas: [
        { titulo: 'Introdução ao Java', capitulo: 'Java', duracao: '18 Min', bloqueada: false },
        { titulo: 'Classes e objetos', capitulo: 'Herança', duracao: '20 Min', bloqueada: true },
      ]
    },
    python: {
      id: 'python',
      nome: 'Python do Zero',
      categoria: 'Python',
      imagem: 'assets/python.png',
      corTema: 'green',
      nota: 4.8,
      avaliacoes: 26,
      descricao: 'Aprenda Python de forma simples e prática, ideal para iniciantes e automação de tarefas.',
      aulas: [
        { titulo: 'Primeiros passos no Python', capitulo: 'Python', duracao: '18 Min', bloqueada: false },
        { titulo: 'Estruturas de dados', capitulo: 'Automação simples', duracao: '20 Min', bloqueada: true },
      ]
    },
  };

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') || 'design';
    this.curso = this.cursos[id] || null;
  }

  voltar() { this.router.navigate(['/dashboard']); }
  salvarCurso() { console.log('Curso salvo:', this.curso?.nome); }
  abrirAula(aula: Aula) {
    if (aula.bloqueada) {
      console.log('Aula bloqueada:', aula.titulo);
      return;
    }
    console.log('Abrindo aula:', aula.titulo);
  }
  comecarCurso() { console.log('Começando curso:', this.curso?.nome); }
}