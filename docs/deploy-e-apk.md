# Publicar o Nexus e gerar o APK

## 1. Preparar o projeto

Use Node.js 22 ou superior. Na pasta do repositório:

```sh
npm ci
npm run test:learning
npm run build
```

O Angular gera a versão web em `www/`. A configuração de produção está em `src/environments/environment.prod.ts`. Use a URL e a chave pública/anon do seu projeto Supabase. Nunca coloque uma chave `service_role` no aplicativo.

No Supabase, confira a tabela e as políticas da migração `supabase/migrations/20260901_create_historico.sql`. Valide com duas contas que uma não consegue ler nem gravar histórico em nome da outra.

## 2. Deploy pela Vercel

1. Envie as alterações do projeto para o GitHub e escolha a branch que será publicada.
2. Na Vercel, selecione **Add New → Project** e importe o repositório `Joaopgg-br/nexus`.
3. Use a raiz do repositório como Root Directory. O `vercel.json` já define `npm run build` e a saída `www`.
4. Configure Node.js 22 e publique. A Vercel mostrará a URL real ao concluir o deploy.
5. No Supabase, em **Authentication → URL Configuration**, configure o domínio publicado como Site URL e adicione os redirecionamentos usados no seu fluxo. Se a confirmação de e-mail estiver ativa, teste a abertura do e-mail no navegador.
6. Abra diretamente `/courses` e atualize a página. Sem sessão, o guard deve levar ao login. Com sessão, deve carregar o curso. A regra de rewrite mantém as rotas da SPA funcionando ao atualizar a página.

O deploy não foi executado por este guia. Não há uma URL de produção inventada no código. Atualizações web publicam pela branch configurada na Vercel.

Referências: [Vercel e rotas SPA](https://vercel.com/kb/guide/why-is-my-deployed-project-giving-404), [configuração de URLs no Supabase](https://supabase.com/docs/guides/auth/redirect-urls).

## 3. Gerar um APK de teste no Windows

A pasta `android/` já existe no projeto. **Não execute `cap add android` novamente.**

Requisitos do Capacitor 8: Node.js 22+, Android Studio 2025.2.1 ou superior e o SDK Android correspondente ao projeto. Este projeto usa `compileSdkVersion = 36` e `targetSdkVersion = 36`, em `android/variables.gradle`. Use o JDK 21 do Android Studio e deixe o Gradle resolver as ferramentas de build exigidas. O SDK Manager permite instalar os componentes ausentes.

```sh
npm ci
npm run android:sync
npm run android:open
```

O primeiro comando de sincronização compila o frontend, copia `www/` para o projeto nativo, atualiza os plugins e aplica os ícones. No Android Studio, espere a sincronização do Gradle concluir. Escolha **Build → Generate App Bundles or APKs → Generate APKs**. Os nomes do menu podem variar com a versão.

O APK de depuração fica normalmente em:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Alternativa no PowerShell, depois da sincronização:

```powershell
cd android
.\gradlew.bat assembleDebug
```

Se o Java não estiver configurado, nesta janela do PowerShell ajuste antes:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
```

O Android Studio normalmente cria `android/local.properties` com o caminho do SDK. Esse arquivo fica fora do Git porque depende do computador. Para instalar o APK manualmente no aparelho, transfira o arquivo e siga a confirmação de instalação do Android. Teste em um dispositivo real.

O debug APK serve para testes. Para distribuir uma versão final, use **Build → Generate Signed App Bundle / APK**, escolha **APK** e crie ou selecione sua chave de assinatura. Guarde a chave e a senha fora do Git. Para a Play Store, gere um **AAB** assinado e confira os requisitos atuais da loja. O identificador configurado é `br.com.nexus.aprendizado`; escolha o identificador definitivo antes da primeira publicação.

Referências: [ambiente Capacitor 8](https://capacitorjs.com/docs/getting-started/environment-setup), [projeto Android](https://capacitorjs.com/docs/android), [geração e assinatura](https://developer.android.com/studio/publish/app-signing).

## 4. Logo e tela de abertura

A marca é um N de conexões, em branco, ciano e violeta sobre azul escuro.

- `src/assets/brand/nexus-mark.svg`: original vetorial editável.
- `src/assets/brand/nexus-icon-512.png`: prévia do ícone.
- `resources/icon-only.png`: marca completa, 1024 × 1024.
- `resources/icon-foreground.png`: camada frontal transparente.
- `resources/icon-background.png`: fundo opaco.
- `resources/android/`: imagens prontas nas densidades Android.

`node scripts/android-brand.cjs` aplica os ícones ao projeto. `npm run android:sync` já faz isso. O Android recorta os ícones adaptativos conforme o launcher. Em Android 12+, a abertura nativa usa um ícone sobre um fundo; depois a splash animada do Nexus aparece na camada web.

Se substituir a marca, regenere as imagens nas mesmas dimensões e atualize `resources/android/` antes de sincronizar. Também pode usar a ferramenta oficial `@capacitor/assets`, apontando para `resources/`, conforme a [documentação de ícones](https://capacitorjs.com/docs/guides/splash-screens-and-icons). Ela pode substituir recursos nativos, então confira o resultado antes de publicar.

## 5. Conferência no celular

- Em 320, 390 e 430 px, confira que não há rolagem horizontal.
- Abra login e cadastro com o teclado visível. Os campos e os botões devem continuar acessíveis por rolagem.
- Conclua uma prática, retorne ao curso e abra o histórico.
- Confira que a navegação não cobre o último botão de cada tela.
- Ative a preferência de reduzir animações e reabra a splash.
- Teste autenticação e salvamento no APK com contas reais. A prévia com serviços simulados não substitui esse teste.

O deploy web não atualiza um APK já instalado. Para mudar o app, gere e instale uma nova versão.
