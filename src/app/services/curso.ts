import { Injectable } from '@angular/core';

export interface Aula {
  titulo: string;
  capitulo: string;
  duracao: string;
  bloqueada: boolean;
  concluida: boolean;
  videoUrl: string;
  textoConteudo: string;
}

export interface PerguntaQuiz {
  pergunta: string;
  opcoes: string[];
  respostaCorreta: number;
}

@Injectable({
  providedIn: 'root'
})
export class Curso {

  // =========================
  // INFORMAÇÕES DO CURSO
  // =========================

  id: number = 1;

  nome: string = 'Introduction to Cybersecurity';

  categoria: string = 'Cybersecurity';

  imagem: string = 'assets/ciber.jpg';

  descricao: string =
    'Explore o empolgante campo da cibersegurança e entenda por que ela é uma carreira à prova de futuro.';

  nota: number = 4.8;

  avaliacoes: string = '10.142.339';

  corTema: string = 'tema-azul';

  gratis: boolean = true;

  cargaHoraria: string = '6 Horas';

  nivel: string = 'Iniciante';

  laboratorios: number = 7;


  // =========================
  // AULAS
  // =========================

  aulas: Aula[] = [

    {
      titulo: 'A necessidade da cibersegurança',
      capitulo: 'Capítulo 1',
      duracao: '25 min',
      bloqueada: false,
      concluida: false,
      videoUrl: 'https://www.youtube.com/embed/SEU_VIDEO_1',
      textoConteudo:
        'Nesta aula você vai entender por que a cibersegurança se tornou essencial em um mundo cada vez mais conectado, e quais são os riscos que empresas e pessoas enfrentam diariamente.'
    },

    {
      titulo: 'Ataques, conceitos e técnicas',
      capitulo: 'Capítulo 2',
      duracao: '40 min',
      bloqueada: true,
      concluida: false,
      videoUrl: 'https://www.youtube.com/embed/SEU_VIDEO_2',
      textoConteudo:
        'Vamos explorar os principais tipos de ataques cibernéticos, como phishing, malware e engenharia social, e as técnicas usadas para se proteger deles.'
    },

    {
      titulo: 'Protegendo seus dados e privacidade',
      capitulo: 'Capítulo 3',
      duracao: '35 min',
      bloqueada: true,
      concluida: false,
      videoUrl: 'https://www.youtube.com/embed/SEU_VIDEO_3',
      textoConteudo:
        'Aprenda boas práticas para proteger dados pessoais e corporativos, incluindo criptografia, autenticação forte e políticas de privacidade.'
    },

    {
      titulo: 'Protegendo a organização',
      capitulo: 'Capítulo 4',
      duracao: '50 min',
      bloqueada: true,
      concluida: false,
      videoUrl: 'https://www.youtube.com/embed/SEU_VIDEO_4',
      textoConteudo:
        'Como estruturar uma política de segurança organizacional, incluindo firewalls, backups e treinamento de equipe.'
    },

    {
      titulo: 'Estado da cibersegurança',
      capitulo: 'Capítulo 5',
      duracao: '30 min',
      bloqueada: true,
      concluida: false,
      videoUrl: 'https://www.youtube.com/embed/SEU_VIDEO_5',
      textoConteudo:
        'Um panorama do cenário atual da cibersegurança no mundo e as tendências para os próximos anos.'
    }

  ];


  // =========================
  // QUIZ FINAL
  // =========================

  quizLiberado: boolean = false;

  quizConcluido: boolean = false;

  notaQuiz: number = 0;

  perguntasQuiz: PerguntaQuiz[] = [

    {
      pergunta: 'O que é phishing?',
      opcoes: [
        'Um tipo de backup automático',
        'Uma técnica de fraude para obter informações',
        'Um sistema de criptografia',
        'Um antivírus para computadores'
      ],
      respostaCorreta: 1
    },

    {
      pergunta: 'Qual destas é uma boa prática de segurança?',
      opcoes: [
        'Usar a mesma senha em todos os sites',
        'Compartilhar sua senha com colegas',
        'Ativar a autenticação de dois fatores',
        'Desativar atualizações do sistema'
      ],
      respostaCorreta: 2
    },

    {
      pergunta: 'O que é malware?',
      opcoes: [
        'Um software desenvolvido para causar danos ou realizar ações maliciosas',
        'Um equipamento usado para proteger redes',
        'Um tipo de senha segura',
        'Um protocolo utilizado para enviar e-mails'
      ],
      respostaCorreta: 0
    },

    {
      pergunta: 'Qual é uma das principais funções de um firewall?',
      opcoes: [
        'Aumentar a velocidade do processador',
        'Controlar o tráfego de rede com base em regras',
        'Criar senhas automaticamente',
        'Armazenar arquivos pessoais'
      ],
      respostaCorreta: 1
    },

    {
      pergunta: 'Qual atitude ajuda a proteger dados pessoais?',
      opcoes: [
        'Clicar em qualquer link recebido',
        'Usar senhas fortes e autenticação adicional',
        'Desativar o antivírus',
        'Publicar informações pessoais em sites desconhecidos'
      ],
      respostaCorreta: 1
    }

  ];


  // =========================
  // PEGAR UMA AULA
  // =========================

  getAula(index: number): Aula | null {

    return this.aulas[index] ?? null;

  }


  // =========================
  // CONCLUIR AULA
  // =========================

  marcarAulaConcluida(index: number): void {

    const aulaAtual = this.aulas[index];

    if (!aulaAtual) {
      return;
    }

    // Marca a aula atual como concluída
    aulaAtual.concluida = true;

    // Desbloqueia a próxima aula
    const proximaAula = this.aulas[index + 1];

    if (proximaAula) {

      proximaAula.bloqueada = false;

    } else {

      // Se não existe próxima aula,
      // significa que a última foi concluída.
      this.quizLiberado = true;

    }

  }


  // =========================
  // FINALIZAR QUIZ
  // =========================

  finalizarQuiz(nota: number): void {

    this.notaQuiz = nota;

    this.quizConcluido = true;

  }


  // =========================
  // VERIFICAR APROVAÇÃO
  // =========================

  foiAprovado(): boolean {

    return this.notaQuiz >= 70;

  }


  // =========================
  // RESETAR QUIZ
  // =========================

  resetarQuiz(): void {

    this.notaQuiz = 0;

    this.quizConcluido = false;

  }

}