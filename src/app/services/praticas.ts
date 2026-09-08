export interface OpcaoPratica { id: string; texto: string; }
export interface ItemPratica { id: string; texto: string; resposta: string; explicacao: string; }
export interface Pratica {
  id: string;
  titulo: string;
  objetivo: string;
  cenario: string;
  evidencia?: string;
  tipo: 'multipla' | 'associacao' | 'ordem';
  instrucao: string;
  opcoes: OpcaoPratica[];
  corretas?: string[];
  itens?: ItemPratica[];
  explicacao: string;
}

// Conteúdo autoral. IDs e títulos são estáveis para restaurar as conclusões do histórico.
export const PRATICAS: Pratica[][] = [
  [
    {
      id: 'impactos', titulo: 'Classificar impactos de um incidente', tipo: 'associacao',
      objetivo: 'Distinguir confidencialidade, integridade e disponibilidade.',
      cenario: 'Você atende o suporte de uma escola. Três ocorrências chegaram na mesma manhã. Identifique a propriedade afetada diretamente em cada caso.',
      instrucao: 'Associe cada ocorrência ao impacto principal.',
      opcoes: [{ id: 'c', texto: 'Confidencialidade' }, { id: 'i', texto: 'Integridade' }, { id: 'd', texto: 'Disponibilidade' }],
      itens: [
        { id: 'notas', texto: 'As notas foram alteradas sem autorização.', resposta: 'i', explicacao: 'A integridade protege os dados contra alterações indevidas.' },
        { id: 'portal', texto: 'O portal de matrícula ficou inacessível durante um ataque.', resposta: 'd', explicacao: 'A disponibilidade permite acessar o serviço quando necessário.' },
        { id: 'lista', texto: 'Uma lista com dados dos alunos foi publicada sem permissão.', resposta: 'c', explicacao: 'A confidencialidade restringe quem pode consultar os dados.' }
      ],
      explicacao: 'Um incidente pode afetar mais de uma propriedade. Aqui classificamos o efeito descrito diretamente em cada ocorrência.'
    },
    {
      id: 'acessos', titulo: 'Aplicar o menor privilégio', tipo: 'multipla',
      objetivo: 'Conceder apenas os acessos necessários para uma tarefa.',
      cenario: 'Uma pessoa foi contratada por duas semanas para revisar os textos públicos de um site. Ela não precisa consultar dados de clientes nem administrar servidores.',
      instrucao: 'Selecione todas as medidas adequadas para esse trabalho.',
      opcoes: [
        { id: 'editor', texto: 'Criar uma conta individual com permissão de edição apenas nos textos.' },
        { id: 'admin', texto: 'Compartilhar a senha da conta administradora para agilizar.' },
        { id: 'prazo', texto: 'Definir prazo e revisar ou remover o acesso ao final do contrato.' },
        { id: 'clientes', texto: 'Liberar exportação da base de clientes por precaução.' }
      ], corretas: ['editor', 'prazo'],
      explicacao: 'Conta individual permite rastrear ações. Permissões limitadas e com prazo reduzem exposição. Compartilhar a conta administradora ou liberar dados desnecessários amplia o risco.'
    }
  ],
  [
    {
      id: 'phishing', titulo: 'Investigar um e-mail suspeito', tipo: 'multipla',
      objetivo: 'Analisar evidências e decidir como agir diante de possível phishing.',
      cenario: 'A empresa fictícia usa o domínio escola.example. Você recebe a mensagem abaixo sem ter solicitado uma alteração de conta.',
      evidencia: 'De: suporte@escola-validacao.example\nAssunto: Sua conta será bloqueada em 10 minutos\n\nConfirme sua senha e seu código de autenticação agora.\nDestino exibido: https://escola-validacao.example/validar',
      instrucao: 'Selecione todas as ações seguras. Não é necessário abrir links.',
      opcoes: [
        { id: 'responder', texto: 'Responder com o código de autenticação, sem enviar a senha.' },
        { id: 'reportar', texto: 'Reportar a mensagem pelo canal oficial de segurança.' },
        { id: 'https', texto: 'Informar os dados porque o endereço começa com HTTPS.' },
        { id: 'verificar', texto: 'Verificar o aviso pelo portal conhecido ou contato oficial, sem usar o link.' }
      ], corretas: ['reportar', 'verificar'],
      explicacao: 'Domínio diferente, urgência e pedido de senha/código são sinais de alerta. HTTPS protege a conexão, mas não garante que o destinatário seja legítimo. Nunca compartilhe códigos de autenticação.'
    },
    {
      id: 'triagem', titulo: 'Fazer a triagem de alertas', tipo: 'associacao',
      objetivo: 'Relacionar evidências a hipóteses de ataque.',
      cenario: 'Você está no primeiro turno de uma central de monitoramento. Classifique cada alerta para encaminhar a investigação.',
      evidencia: '09:10 — 480 falhas de autenticação em 2 minutos na conta financeiro.\n09:14 — Arquivos renomeados e mensagem exigindo pagamento para recuperá-los.\n09:18 — Ligação solicitando código MFA, alegando ser do suporte.',
      instrucao: 'Associe o indício à hipótese mais provável. Um alerta ainda exige investigação.',
      opcoes: [{ id: 'forca', texto: 'Tentativa automatizada de adivinhar senha' }, { id: 'ransom', texto: 'Ransomware' }, { id: 'social', texto: 'Engenharia social por telefone' }],
      itens: [
        { id: 'login', texto: 'Muitas falhas de autenticação em pouco tempo.', resposta: 'forca', explicacao: 'A repetição rápida é um indício de tentativas automatizadas de acesso.' },
        { id: 'arquivos', texto: 'Arquivos inacessíveis acompanhados de cobrança.', resposta: 'ransom', explicacao: 'Criptografia ou bloqueio com extorsão é característico de ransomware.' },
        { id: 'ligacao', texto: 'Suposto suporte pede um código de autenticação.', resposta: 'social', explicacao: 'A pessoa tenta explorar confiança para obter um segredo.' }
      ], explicacao: 'Classificar não é comprovar a causa. Preserve registros e encaminhe os indícios para investigação antes de concluir o diagnóstico.'
    }
  ],
  [
    {
      id: 'conta', titulo: 'Configurar a proteção de uma conta', tipo: 'multipla',
      objetivo: 'Escolher controles complementares de proteção e recuperação.',
      cenario: 'Você está configurando uma conta de estudos usada em um notebook pessoal. Escolha as configurações seguras para o cenário; não digite uma senha real.',
      instrucao: 'Ative todas as configurações recomendadas abaixo.',
      opcoes: [
        { id: 'unica', texto: 'Senha longa e exclusiva, guardada em gerenciador de senhas.' },
        { id: 'reuso', texto: 'Reutilizar a senha do e-mail para facilitar a memorização.' },
        { id: 'mfa', texto: 'Autenticação multifator e códigos de recuperação guardados com segurança.' },
        { id: 'atualizar', texto: 'Atualizações automáticas do sistema e navegador.' },
        { id: 'publico', texto: 'Publicar os códigos de recuperação no perfil para não perdê-los.' }
      ], corretas: ['unica', 'mfa', 'atualizar'],
      explicacao: 'Senha exclusiva reduz o impacto de vazamentos em outros serviços. MFA acrescenta proteção, recuperação segura evita perda de acesso e atualizações corrigem vulnerabilidades. Códigos de recuperação são secretos.'
    }
  ],
  [
    {
      id: 'firewall', titulo: 'Revisar regras de firewall', tipo: 'associacao',
      objetivo: 'Permitir tráfego necessário e bloquear exposição desnecessária.',
      cenario: 'Um servidor publica somente um portal HTTPS. A administração por SSH só pode vir da rede de gestão 10.20.0.0/24, acessível por VPN. A rede de visitantes não administra servidores.',
      evidencia: 'Servidor: 10.10.0.10\nPortal público: TCP 443\nAdministração: TCP 22\nPolítica: negar por padrão; permitir apenas os fluxos necessários.\nConsidere cada fluxo individualmente; não há regras anteriores.',
      instrucao: 'Decida a ação da regra para cada fluxo.',
      opcoes: [{ id: 'permitir', texto: 'Permitir' }, { id: 'bloquear', texto: 'Bloquear' }],
      itens: [
        { id: 'web', texto: 'Internet → servidor, TCP 443.', resposta: 'permitir', explicacao: 'O portal deve receber conexões HTTPS públicas.' },
        { id: 'ssh', texto: 'Internet → servidor, TCP 22.', resposta: 'bloquear', explicacao: 'A administração não deve ficar aberta diretamente à Internet.' },
        { id: 'gestao', texto: 'Rede de gestão 10.20.0.0/24 → servidor, TCP 22.', resposta: 'permitir', explicacao: 'Esse é o caminho de administração autorizado no cenário.' },
        { id: 'visitante', texto: 'Rede de visitantes → servidor, TCP 22.', resposta: 'bloquear', explicacao: 'Visitantes não têm necessidade de administrar o servidor.' }
      ], explicacao: 'Firewall aplica política de tráfego; ele não substitui autenticação, atualizações ou proteção da aplicação. Esta prática avalia decisões em um cenário simulado, sem alterar uma rede real.'
    }
  ],
  [
    {
      id: 'incidente', titulo: 'Organizar a resposta a um incidente', tipo: 'ordem',
      objetivo: 'Priorizar contenção, investigação e recuperação segura.',
      cenario: 'Um notebook corporativo está criptografando arquivos. Neste exercício, você foi autorizado pelo procedimento interno a isolar a rede e acionar imediatamente a equipe de segurança, que conduzirá as etapas seguintes.',
      instrucao: 'Use as setas para ordenar as etapas do procedimento deste cenário.',
      opcoes: [
        { id: 'recuperar', texto: 'Após remover a causa, restaurar backup validado e monitorar o retorno.' },
        { id: 'revisar', texto: 'Revisar o incidente e melhorar controles e treinamento.' },
        { id: 'conter', texto: 'Isolar o notebook da rede e acionar a equipe de segurança.' },
        { id: 'investigar', texto: 'A equipe preserva evidências, identifica o alcance e remove a causa.' }
      ], corretas: ['conter', 'investigar', 'recuperar', 'revisar'],
      explicacao: 'Neste procedimento, a prioridade é limitar a propagação e avisar a equipe. Ela preserva evidências e trata a causa antes da restauração. A revisão reduz a chance de recorrência. Em situações reais, siga o plano da organização.'
    }
  ]
];
