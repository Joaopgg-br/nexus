# Nexus

Plataforma web e Android de aprendizado em TI. O curso inicial de cibersegurança reúne cinco capítulos, sete práticas guiadas, avaliação e histórico individual com Supabase.

## Executar

Use Node.js 22 ou superior e npm.

```sh
npm ci
npm start
```

Abra `http://localhost:4200`. Confira as configurações públicas do Supabase em `src/environments/environment.ts` e `environment.prod.ts`. As políticas de acesso estão em `supabase/migrations/20260901_create_historico.sql`.

```sh
npm run build
npm run test:learning
```

O build de produção fica em `www/`.

## Deploy e Android

Veja [o guia de deploy e APK](docs/deploy-e-apk.md). O projeto inclui `vercel.json`, plataforma `android/`, configuração do Capacitor e ícones Nexus.

```sh
npm run android:sync
npm run android:open
```

O APK usa os arquivos web empacotados. Ele não depende de um site aberto na Vercel, mas precisa de internet para autenticação e histórico no Supabase. Depois de alterar a interface, sincronize e gere um novo APK.

## Identidade e movimento

- Logo editável: `src/assets/brand/nexus-mark.svg`.
- Ícones fonte PNG 1024: `resources/`.
- Densidades Android e camadas adaptativas: `resources/android/`.
- Tema compartilhado: `src/theme/nexus.scss`.
- Transição das páginas: `src/app/animations/nexus-navigation.ts`.
- A splash e as transições respeitam `prefers-reduced-motion`.

As áreas de leitura permanecem estáticas. A navegação usa animações curtas e os controles têm retorno ao toque. O zoom do navegador permanece disponível.
