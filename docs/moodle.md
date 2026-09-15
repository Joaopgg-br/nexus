# Integração Nexus e Moodle

O Nexus consulta os cursos em que a conta Moodle conectada está inscrita e salva
uma cópia do progresso no Supabase. A biblioteca (`/library`) reúne o curso próprio
do Nexus e os cursos externos. O painel também mostra os cursos importados. O perfil
tem um acesso à página de conexão (`/integrations`).

As aulas externas são abertas no próprio Moodle, em outra aba. A sessão do Nexus
não substitui o login do Moodle. Esta versão não inclui SSO, emissão de certificados
externos, inscrição automática, sincronização agendada ou painel de gestores.

## O que precisa existir para ativar

1. Um Moodle acessível por HTTPS, administrado pela escola, equipe ou empresa,
   com autorização para usar seus serviços web.
2. O projeto Supabase já utilizado pelo Nexus, com a tabela `public.historico`.
3. Os novos objetos de banco, a Edge Function e os dois segredos descritos abaixo.
4. Uma chave pessoal de serviço web de uma conta Moodle com cursos inscritos.

Sem essa configuração, não há cursos de demonstração ou percentuais simulados.
Adicionar apenas links de cursos não realiza a importação de progresso.

## 1. Preparar o Moodle

No painel administrativo do Moodle, habilite os serviços web e o protocolo REST.
Crie um serviço externo habilitado contendo somente estas funções:

- `core_webservice_get_site_info`
- `core_enrol_get_users_courses`

Autorize as contas que poderão usar o serviço e gere um token pessoal para cada
uma delas, com as capacidades exigidas pelo Moodle para executar essas funções.
Use uma conta de aluno para validar o fluxo. Não distribua um token administrativo
compartilhado: o Nexus identifica a conta pelo token e importa somente suas inscrições.
A disponibilidade de geração de tokens pelo próprio aluno depende da configuração
do Moodle; o administrador pode precisar emitir a chave.

Configure acompanhamento de atividades e critérios de conclusão nos cursos quando
quiser importar esses dados. O Nexus preserva valores desconhecidos como nulos.
Ter 100% de atividades não é tratado como conclusão oficial: esta depende do campo
`completed` informado pelo Moodle.

O contrato foi conferido no código oficial do Moodle 4.5. A instância utilizada
precisa expor as duas funções. Confirme sua compatibilidade com os testes manuais
ao final deste documento antes de apresentar a integração como ativa.

## 2. Preparar o Supabase

Execute `supabase/migrations/20260915_moodle_integration.sql` no SQL Editor do projeto.
O script deve ser aplicado uma única vez. Se `public.historico` ainda não existir,
aplique antes `20260901_create_historico.sql`. Não reaplique scripts que já foram
executados manualmente. Em projetos geridos pela CLI, confira o histórico de
migrations antes de usar `supabase db push`.

| Objeto | Finalidade | Acesso pelo aplicativo |
| --- | --- | --- |
| `moodle_conexoes` | Identidade Moodle, plataforma, revisão e última atualização | Somente leitura da própria conta, com RLS |
| `cursos_externos` | Cursos inscritos, progresso e conclusão importados | Somente leitura da própria conta, com RLS |
| `moodle_tokens` | Token cifrado com AES-GCM | Sem acesso para `anon` ou `authenticated` |
| `aplicar_sincronizacao_moodle` | Atualização atômica de conexão, cursos e histórico | Somente `service_role` |
| `desconectar_moodle` | Remoção da conexão, token e cursos importados | Somente `service_role` |

A Edge Function verifica o JWT com `auth.getUser()` e usa exclusivamente o ID
confirmado por essa chamada. Um `usuario_id` enviado pelo cliente não é utilizado.
O `verify_jwt = false` de `supabase/config.toml` permite essa verificação dentro da
função, inclusive para projetos que usam chaves de assinatura assimétricas;
nenhuma operação de dados é aceita sem autenticação válida.

## 3. Configurar os segredos e publicar a função

Instale a CLI oficial do Supabase e autentique-se no projeto correto:

```sh
supabase login
supabase link --project-ref SEU_PROJECT_REF
```

Copie `supabase/functions/.env.example` para `supabase/functions/.env` e preencha:

- `MOODLE_BASE_URL`: URL base HTTPS do Moodle, incluindo o subdiretório se existir,
  sem `/webservice/rest/server.php`, parâmetros ou credenciais.
- `MOODLE_TOKEN_KEY`: 32 bytes aleatórios codificados em Base64. Gere a chave uma
  única vez, por exemplo com `openssl rand -base64 32`, e guarde-a com os demais
  segredos do projeto. Trocar essa chave exige reconectar as contas existentes.

O arquivo `.env` é ignorado pelo Git. Não coloque esses segredos nos arquivos
`environment.ts` do Angular. As variáveis `SUPABASE_URL` e
`SUPABASE_SERVICE_ROLE_KEY` são fornecidas pelo ambiente hospedado das Edge Functions.

```sh
supabase secrets set --env-file supabase/functions/.env
supabase functions deploy moodle-sync
```

O token pessoal de cada aluno é informado na interface após entrar no Nexus. Ele
trafega no corpo da requisição HTTPS e é salvo cifrado no servidor, associado ao
usuário e à plataforma. Não é colocado em URLs, logs ou armazenamento local do app.
O domínio de destino é definido pelo responsável no servidor, nunca pelo aluno.

## 4. Usar no aplicativo

1. Entrar no Nexus e abrir **Perfil → Plataformas conectadas**, ou a biblioteca.
2. Abrir a conexão Moodle e informar a chave pessoal da própria conta.
3. Conferir os cursos importados e abrir **Estudar no Moodle**.
4. Realizar uma atividade no Moodle, voltar ao Nexus e selecionar
   **Atualizar progresso**. Há um intervalo mínimo de 15 segundos após uma
   sincronização bem-sucedida.
5. Conferir no histórico os acessos e as conclusões importadas. A data da conclusão
   representa o momento da importação, e não uma data de conclusão inferida.

Em caso de falha de rede ou resposta inválida, o último estado salvo permanece
disponível com sua data de atualização. Uma lista vazia válida remove as inscrições
da cópia local dessa conta. Desconectar remove a conexão, a chave e os cursos
importados, preservando os eventos anteriores e os dados na plataforma de origem.

## Verificação

```sh
npm ci
npm run test:learning
npm run test:moodle
npm run build
deno check --node-modules-dir=manual --config supabase/functions/deno.json supabase/functions/moodle-sync/index.ts
```

Os testes do conector usam respostas controladas da API para validar identificação,
erros, criptografia, isolamento de sessão e autenticação da Edge Function. Os testes
SQL executam as migrations em PostgreSQL via PGlite, com duas contas e papéis de
banco, verificando RLS, permissões, transações e conflitos de revisão. Não acessam
o Supabase de produção e não substituem a validação com uma instância Moodle real.

Antes de demonstrar em produção, valide com duas contas próprias de teste:

- Conta A importa somente suas inscrições; conta B não vê os cursos ou histórico de A.
- Avançar uma atividade no Moodle altera o progresso após sincronizar no Nexus.
- Token inválido ou revogado exibe erro e não apaga o último progresso.
- Um curso sem acompanhamento exibe progresso não informado.
- Repetir a sincronização não duplica a conclusão registrada.
- Logout, novo login e recarregamento preservam apenas os dados do usuário correto.
- Desconexão remove a cópia importada e permite uma nova conexão.

## Referências técnicas

- [Moodle: utilização de serviços web](https://docs.moodle.org/en/Using_web_services)
- [Moodle 4.5: consulta de inscrições e progresso](https://github.com/moodle/moodle/blob/MOODLE_405_STABLE/enrol/externallib.php)
- [Moodle 4.5: identificação da conta do serviço web](https://github.com/moodle/moodle/blob/MOODLE_405_STABLE/webservice/externallib.php)
- [Supabase: autenticação em Edge Functions](https://supabase.com/docs/guides/functions/auth)
- [Supabase: segredos de Edge Functions](https://supabase.com/docs/guides/functions/secrets)
