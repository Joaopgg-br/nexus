import { Injectable } from '@angular/core';
import { PRATICAS, Pratica } from './praticas';

export interface Aula {
  titulo: string;
  capitulo: string;
  duracao: string;
  bloqueada: boolean;
  concluida: boolean;
  videoUrl?: string;
  textoConteudo: string;
}

export interface PerguntaQuiz {
  pergunta: string;
  opcoes: string[];
  respostaCorreta: number;
  explicacao: string;
}

@Injectable({
  providedIn: 'root'
})
export class Curso {

  id = 1;
  nome = 'Introdução à Cibersegurança';
  categoria = 'Cibersegurança';
  imagem = 'assets/ciber.jpg';
  descricao =
    'Aprenda a analisar ameaças e proteger dados em cinco capítulos com sete práticas guiadas e uma avaliação final. Conteúdo autoral do Nexus.';
  corTema = 'tema-azul';
  gratis = true;
  cargaHoraria = '60–90 min';
  nivel = 'Iniciante';
  get laboratorios(): number { return PRATICAS.reduce((total, praticas) => total + praticas.length, 0); }

  praticasDaAula(index: number): Pratica[] { return PRATICAS[index] ?? []; }

  tituloRegistroPratica(pratica: Pratica): string { return `Prática: ${pratica.titulo}`; }

  aulas: Aula[] = [
    {
      titulo: 'A necessidade da cibersegurança',
      capitulo: 'Capítulo 1',
      duracao: '12–18 min',
      bloqueada: false,
      concluida: false,
      textoConteudo:
        'Cibersegurança protege dados e serviços. Confidencialidade significa limitar quem pode consultar uma informação; integridade, impedir ou detectar alterações indevidas; disponibilidade, manter o acesso quando necessário. Um vazamento de prontuários afeta a confidencialidade, uma nota adulterada afeta a integridade e um portal fora do ar afeta a disponibilidade. Um mesmo incidente pode atingir várias propriedades. O princípio do menor privilégio concede apenas o acesso necessário para cada tarefa. Contas individuais, revisão de permissões e remoção de acessos antigos reduzem a exposição. Nas práticas, analise os efeitos dos incidentes e escolha permissões proporcionais ao trabalho.'
    },
    {
      titulo: 'Ataques, conceitos e técnicas',
      capitulo: 'Capítulo 2',
      duracao: '12–18 min',
      bloqueada: true,
      concluida: false,
      textoConteudo:
        'Phishing usa mensagens enganosas para induzir uma pessoa a entregar dados, abrir arquivos ou realizar pagamentos. Engenharia social também pode acontecer por telefone. Analise o domínio completo, pedidos inesperados e tentativas de criar urgência; um erro de português sozinho não comprova fraude. HTTPS protege o transporte dos dados, mas também pode existir em sites fraudulentos. Confirme pedidos por um canal oficial que você já conhece. Não informe senhas nem códigos MFA. Malware é software malicioso; ransomware pode bloquear ou criptografar dados e exigir pagamento. Alertas como muitas falhas de autenticação são indícios, não provas isoladas. Preserve registros e investigue o contexto.'
    },
    {
      titulo: 'Protegendo seus dados e privacidade',
      capitulo: 'Capítulo 3',
      duracao: '12–18 min',
      bloqueada: true,
      concluida: false,
      textoConteudo:
        'Use uma senha longa e exclusiva para cada serviço e um gerenciador de senhas confiável para guardá-la. Ative autenticação multifator quando disponível e mantenha os meios de recuperação protegidos. MFA reduz riscos, mas códigos também podem ser roubados por engenharia social; não os compartilhe. Atualizações corrigem vulnerabilidades conhecidas. Revise permissões de aplicativos e compartilhe somente os dados necessários. Criptografia protege dados contra leitura indevida, mas não resolve todos os riscos de uma conta já comprometida. Tenha cópias de segurança separadas e teste a restauração. Nesta prática, escolha uma combinação de controles; não use suas credenciais reais.'
    },
    {
      titulo: 'Protegendo a organização',
      capitulo: 'Capítulo 4',
      duracao: '12–18 min',
      bloqueada: true,
      concluida: false,
      textoConteudo:
        'Uma organização precisa combinar pessoas, processos e tecnologia. Firewalls permitem ou negam tráfego segundo regras; a política de negar por padrão libera somente os fluxos necessários. HTTPS costuma usar TCP 443 e SSH, TCP 22. Publicar um portal não exige expor a administração para toda a Internet. Separar redes de visitantes, usuários e gestão reduz movimentos indevidos. A administração remota pode ser limitada a uma rede de gestão acessada por VPN, com autenticação forte. Firewalls não substituem correções de vulnerabilidades nem validação da aplicação. Backups separados, testes de restauração e treinamento também fazem parte da proteção. Revise as regras do cenário a seguir.'
    },
    {
      titulo: 'Estado da cibersegurança',
      capitulo: 'Capítulo 5',
      duracao: '12–18 min',
      bloqueada: true,
      concluida: false,
      textoConteudo:
        'A segurança exige acompanhamento contínuo: inventário de ativos, análise de alertas, correções e revisão de acessos. Uma equipe de resposta a incidentes usa um procedimento para conter danos, preservar evidências, investigar a causa e recuperar serviços com segurança. Não apague registros nem restaure sistemas sem coordenação: isso pode destruir evidências ou reiniciar o problema. A ordem detalhada depende do incidente e do plano da organização. Neste cenário, o procedimento autoriza isolar a rede e avisar a equipe imediatamente. Depois, a equipe investiga e trata a causa antes de validar a recuperação. A revisão final transforma o que foi aprendido em melhorias. Na avaliação final, justifique suas decisões usando os conceitos das aulas.'
    }
  ];

  quizLiberado = false;
  quizConcluido = false;
  notaQuiz = 0;

  perguntasQuiz: PerguntaQuiz[] = [
    {
      pergunta: 'Você recebe um aviso urgente pedindo senha e código MFA em um domínio diferente do portal conhecido. Qual é a melhor ação?',
      opcoes: ['Enviar apenas o código MFA.', 'Validar pelo portal oficial e reportar a mensagem.', 'Confiar porque o link usa HTTPS.', 'Encaminhar para todos clicarem e verificarem.'],
      respostaCorreta: 1,
      explicacao: 'Confirme o pedido por um canal conhecido. Domínio divergente, urgência e pedido de segredos são indícios de phishing; HTTPS não comprova legitimidade.'
    },
    {
      pergunta: 'Uma funcionária precisa somente consultar relatórios. Qual permissão atende ao menor privilégio?',
      opcoes: ['Administradora do sistema.', 'Conta compartilhada da equipe.', 'Conta individual com leitura dos relatórios necessários.', 'Exportação de toda a base de clientes.'],
      respostaCorreta: 2,
      explicacao: 'Acesso individual e restrito à leitura necessária reduz exposição e permite rastrear ações.'
    },
    {
      pergunta: 'As notas de uma turma foram alteradas sem autorização, mas o portal continua online. Qual propriedade foi diretamente afetada?',
      opcoes: ['Integridade.', 'Disponibilidade apenas.', 'Velocidade da rede.', 'Nenhuma, pois o portal continua online.'],
      respostaCorreta: 0,
      explicacao: 'Integridade trata da exatidão dos dados e da proteção contra modificações indevidas.'
    },
    {
      pergunta: 'Um servidor oferece apenas um portal HTTPS. SSH é permitido somente pela rede de gestão via VPN. Qual regra deve ser bloqueada?',
      opcoes: ['Internet → TCP 443.', 'Rede de gestão → TCP 22.', 'Retorno das conexões HTTPS autorizadas.', 'Internet → TCP 22.'],
      respostaCorreta: 3,
      explicacao: 'A administração por SSH deve seguir o caminho autorizado da rede de gestão, sem exposição direta à Internet.'
    },
    {
      pergunta: 'Um notebook começou a criptografar arquivos. O procedimento interno autoriza isolar a rede e avisar a equipe. O que fazer primeiro?',
      opcoes: ['Restaurar o backup enquanto ele permanece conectado.', 'Isolar da rede e acionar a equipe para conter e investigar.', 'Apagar todos os registros.', 'Publicar os arquivos afetados em uma rede social.'],
      respostaCorreta: 1,
      explicacao: 'Nesse cenário, contenção e aviso imediato limitam danos. Investigação e tratamento da causa precedem a restauração validada.'
    },
    {
      pergunta: 'Uma senha vazou em outro site. Que configuração reduz a chance de esse vazamento dar acesso à sua conta de estudos?',
      opcoes: ['A mesma senha com uma letra maiúscula.', 'Desativar atualizações.', 'Senha exclusiva e autenticação multifator.', 'Compartilhar códigos de recuperação com colegas.'],
      respostaCorreta: 2,
      explicacao: 'Senhas exclusivas evitam reutilização de credenciais vazadas; MFA acrescenta uma camada de proteção.'
    },
    {
      pergunta: 'Um painel registrou centenas de falhas de autenticação, sem nenhum sucesso confirmado. O que essa evidência permite afirmar?',
      opcoes: ['Existe um indício de tentativa de acesso que precisa de investigação.', 'Os dados foram necessariamente roubados.', 'É seguro apagar os registros.', 'A conta deve ser divulgada publicamente.'],
      respostaCorreta: 0,
      explicacao: 'Falhas repetidas são indícios; não comprovam acesso bem-sucedido nem vazamento. Preserve registros e investigue o contexto.'
    }
  ];

  getAula(index: number): Aula | null {
    return this.aulas[index] ?? null;
  }

  marcarAulaConcluida(index: number): boolean {
    const aulaAtual = this.aulas[index];

    if (!aulaAtual || aulaAtual.bloqueada || aulaAtual.concluida) {
      return false;
    }

    aulaAtual.concluida = true;

    const proximaAula = this.aulas[index + 1];

    if (proximaAula) {
      proximaAula.bloqueada = false;
    }

    this.quizLiberado =
      this.aulas.every(aula => aula.concluida);

    return true;
  }

  restaurarProgresso(indices: number[]): void {
    const concluidas = new Set(indices);

    this.aulas.forEach((aula, index) => {
      aula.concluida = concluidas.has(index);
      aula.bloqueada = index !== 0 && !aula.concluida;
    });

    this.aulas.forEach((aula, index) => {
      if (aula.concluida) {
        const proxima = this.aulas[index + 1];

        if (proxima) {
          proxima.bloqueada = false;
        }
      }
    });

    this.quizLiberado =
      this.aulas.every(aula => aula.concluida);
  }

  finalizarQuiz(nota: number): void {
    this.notaQuiz = nota;
    this.quizConcluido = true;
  }

  foiAprovado(): boolean {
    return this.notaQuiz >= 70;
  }

  resetarQuiz(): void {
    this.notaQuiz = 0;
    this.quizConcluido = false;
  }
}
