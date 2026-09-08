# Práticas e layout

As sete práticas são conteúdo autoral do Nexus, distribuído pelos cinco capítulos. Incluem associação de impactos, menor privilégio, análise de phishing, triagem, configuração de conta, regras de firewall e ordenação da resposta a incidentes. São cenários simulados com correção; não configuram uma rede real nem concedem certificação Cisco.

- Os dados estão em `src/app/services/praticas.ts`; `PraticaComponent` corrige os três formatos.
- Uma prática correta só aparece como salva depois da confirmação do Supabase. Em erro, é possível repetir o salvamento.
- A tabela `historico` existente registra cada prática como `quiz_concluido`, com curso, índice da aula e título estável `Prática: <título>`. Preserve os títulos ao editar o texto: eles identificam as conclusões já gravadas.
- Não é necessária nova migração. Mantêm-se o filtro por usuário autenticado e as políticas RLS da migração já existente. Não use chave service-role no aplicativo.
- A aula é liberada para conclusão depois que todas as suas práticas são salvas. Conclusões anteriores à atualização são preservadas.
- A avaliação final exige resposta em todas as questões, mostra explicações e salva resultado e eventual conclusão do curso em um único INSERT. Nota mínima: 70%.
- A correção acontece no cliente para aprendizagem. Não é um mecanismo inviolável de avaliação ou emissão de certificados.

O espaço abaixo do conteúdo e a altura da barra usam as mesmas variáveis CSS, incluindo a área segura do aparelho. O layout adapta chips, histórico, botões e largura de leitura em telas estreitas e grandes.

## Verificação

`npm run build` compila os templates Angular e os estilos.

`node scripts/test-learning.cjs` executa nove testes da lógica real, com autenticação/banco simulados: correção, bloqueios, retomada, falhas, novo salvamento e filtro pelo usuário. Não substitui teste de RLS com contas reais. A prévia do navegador remoto não acessou o servidor local neste ambiente.

Para conferir no aparelho: abrir o curso, rolar até o último botão e verificar que ele fica acima da barra; repetir com 320 px de largura e em paisagem. Resolver uma prática, sair e voltar; concluir a aula; fazer a avaliação e consultar o histórico. Conferir também perfil e teclado aberto.

Referência de formato de aprendizagem: [Cisco Networking Academy](https://www.netacad.com/courses/introduction-to-cybersecurity). Os enunciados e respostas do Nexus são próprios.
