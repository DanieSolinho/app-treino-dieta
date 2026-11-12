# Treino & Dieta

App web mobile-first que junta treino, alongamento, dieta e água num só lugar.

## O que já funciona

**Treinos com sugestão de carga**
- Fichas com exercícios, séries, faixa de reps, descanso e incremento — criar, editar e apagar
- Treino em andamento: registro série a série (carga, reps, esforço), timer de descanso, desfazer
- Progressão dupla: bateu o topo da faixa em todas as séries sem "difícil" → a carga sobe; duas sessões seguidas abaixo do mínimo → reduz ~10%
- Resumo ao finalizar com duração, volume e a carga do próximo treino
- O treino em andamento sobrevive a um refresh

**Painel Hoje**
- Treino do dia (pelos dias da semana da ficha), água com meta e streak de dias cumpridos

**Dieta**
- Plano alimentar do dia, com refeições e horários
- Marcar refeição como feita
- Trocar um alimento por um equivalente do mesmo grupo (carboidratos, proteínas…)
- A troca vale só para o dia; o plano original não muda
- Desfazer uma troca
- Tudo salvo no navegador (localStorage), sem login

## Stack

React 18 · TypeScript · Vite · Zustand (com `persist`) · Vitest

## Como rodar

```bash
npm install
npm run dev     # abre em http://localhost:5173
npm test        # testes da store
npm run build   # versão de produção em dist/
```

## Estrutura

```
src/
  data/samplePlan.ts          # plano de EXEMPLO — troque pelo seu
  features/diet/
    DietPage.tsx              # tela Dieta
    MealCard.tsx              # refeição + itens + botão de troca
    SubstitutionSheet.tsx     # folha com os equivalentes (<dialog> nativo)
  lib/                        # datas e formatação de quantidades
  stores/
    useDietStore.ts           # plano e grupos de substituição
    useDayStore.ts            # trocas e refeições feitas, por dia
  types/diet.ts               # Food, MealItem, Meal, SubstitutionGroup
  styles/global.css           # tokens de cor e estilos
```

## Como a substituição funciona

- Cada `MealItem` pode ter um `groupId`. Sem grupo, não aparece o botão de troca.
- `useDayStore.swaps[data][itemId]` guarda o alimento escolhido no dia.
- O hook `useFoodForDay(item)` devolve a troca, se existir, ou o alimento original — os componentes não precisam saber se houve troca.

## Banco de dados e login (Supabase)

Postgres no Supabase (região UE, Paris), com login por e-mail e senha.

| Tabela | O que guarda |
| --- | --- |
| `profiles` | nome e meta de água (criado sozinho no cadastro) |
| `diet_plans` | plano alimentar (documento JSON) |
| `workout_plans` | fichas, agenda e alongamentos (documento JSON) |
| `workout_sessions` | cada treino feito |
| `day_logs` | um dia: refeições feitas, água, trocas |
| `body_entries` | peso e medidas |

- **RLS em todas as tabelas:** cada usuária só lê e escreve as próprias linhas; visitantes sem login não acessam nada.
- **`delete_my_account()`:** apaga a conta e, em cascata, todos os dados (RGPD).
- **Migrações versionadas** em `supabase/migrations/`: o banco pode ser recriado em qualquer Postgres.
- **Acesso concentrado em `src/services/`:** as telas não falam com o Supabase direto.

```bash
cp .env.example .env.local   # URL e chave publicável do Supabase (públicas por natureza)
```

Sem o `.env.local`, o app funciona como antes, só no aparelho.

**Login** (`src/services/auth.ts` + `src/features/auth/`): criar conta com confirmação por e-mail, entrar, sair, esqueci minha senha → nova senha, e apagar conta em Ajustes. Erros do Supabase traduzidos pelos códigos (`invalid_credentials`, `email_not_confirmed`…). No painel do Supabase, **Authentication › URL Configuration** precisa ter o endereço do app em Site URL e Redirect URLs.

### Sincronização (`src/services/sync/`)

Offline primeiro: o app lê e grava no aparelho, e o motor envia só o que mudou.

- Observa as stores e anota o que mudou (`sync-meta` no aparelho, sobrevive a fechar o app).
- Envia ~1,5 s depois de cada mudança; sem internet, guarda e tenta quando volta (`online`) ou ao abrir o app.
- Busca as novidades ao entrar, ao voltar para o app (a cada 30 s no máximo) e quando a internet volta.
- Conta vazia + aparelho com dados → sobe tudo (primeira vez). Aparelho novo → os dados da conta substituem os de exemplo.
- Conflito: vale o último envio, mas o que está pendente no aparelho nunca é sobrescrito.
- Sair envia o que falta e limpa o aparelho; outra conta no mesmo navegador não vê nada da anterior.
- `engine.ts` não conhece o Supabase: recebe um `SyncApi` (real em `supabaseApi.ts`, falso nos testes).
- Fichas, agenda e alongamentos sobem juntos (`workout_plans`). Agenda/alongamentos vazios no servidor não apagam os que vieram com o app. `sync-meta.version` (v2) faz o aparelho que já sincronizava reenviar agenda e alongamentos uma vez.

### Fotos (`src/services/images.ts`)

- Bucket **privado** `exercise-images` no Supabase Storage, uma pasta por conta (`<id>/<nome>.webp`); só a dona lê ou altera (`supabase/migrations/…_exercise_images.sql`).
- No computador com `src/data/private/images`, o app mostra a foto local e, depois de sincronizar, envia as que faltam na conta.
- Nos outros aparelhos, `useImage(nome)` pede links temporários assinados (7 dias, em lote) e guarda no aparelho.
- Apagar a conta apaga as fotos antes.

## Back-end: escanear rótulo (`api/analyze-label.ts`)

Na troca de um alimento, "Tem outro alimento?" tira uma foto do rótulo (ou do alimento) e calcula quanto dá para comer no lugar da porção do plano.

```
App (React)  ──foto reduzida + porção──▶  /api/analyze-label (Vercel Function)
                                              │ 1. confere o código de acesso
                                              │ 2. Claude lê a tabela nutricional (visão + ferramenta → JSON)
                                              │ 3. equivalência calculada em código (src/lib/labelMath.ts)
App  ◀── gramas, macros, avisos ─────────────┘
```

- A chave da API fica só no servidor. O app nunca vê.
- `SCAN_ACCESS_CODE` impede que estranhos usem a função (e gastem seus créditos).
- A IA só **lê**; a conta é feita em código e testada (`labelMath.test.ts`, `api/analyze-label.test.ts`).

### Rodar no computador

```bash
cp .env.example .env.local   # preencha ANTHROPIC_API_KEY e SCAN_ACCESS_CODE
npm run dev                  # o Vite serve /api localmente (plugin em vite.config.ts)
```

### Escanear rótulo na Vercel (quando for ativar)

O botão fica escondido até existir `VITE_SCAN_ENABLED=true` (no `.env.local` e nas variáveis da Vercel).

Em **Settings › Environment Variables**, cadastre `ANTHROPIC_API_KEY` e `SCAN_ACCESS_CODE` e faça um novo deploy. Sem elas, a função responde que o recurso não está configurado.

## Publicar (Vercel) e instalar no celular (PWA)

- `vercel.json`: build do Vite, saída em `dist`, `sw.js` sem cache e `/assets` com cache longo.
- `.env.production`: URL e chave **publishable** do Supabase (públicas por definição; o RLS protege os dados). Nada secreto vai nesse arquivo.
- A Vercel monta o app a partir do GitHub, então **sem** `src/data/private`: o site publicado não contém a dieta, as fichas nem as fotos. Tudo isso chega pela conta depois do login (sincronização + fotos privadas).
- PWA: `public/manifest.webmanifest`, ícones em `public/icons/` (fonte `icon.svg`) e `public/sw.js`, registrado só no build de produção. O service worker guarda as páginas e os arquivos do site para abrir sem internet; dados, login e fotos do Supabase não passam por ele.
- No Supabase, **Authentication › URL Configuration**: Site URL = endereço da Vercel; Redirect URLs = endereço da Vercel e `http://localhost:5173`.

## Importar plano (Ajustes › Plano)

Quando chega dieta, treino ou agenda nova, o app recebe um arquivo `.json` (formato `treino-dieta-plano`, versão 1) com qualquer parte: `diet`, `workouts`, `schedule`, `stretches` e `images` (fotos .webp em base64).

- `src/lib/planImport.ts`: confere tudo antes (refeições, grupos de substituição, exercícios, agenda só com fichas que existem, fotos até 2 MB), mostra o resumo do que muda e só aplica depois da confirmação.
- Exercício que continua (mesmo nome, ignorando acentos e maiúsculas) mantém o id e a carga atual: o histórico e a sugestão de carga seguem.
- A agenda nova junta com a antiga (datas iguais são substituídas). Treinos feitos, água, peso e medidas não mudam.
- As mudanças sobem sozinhas pela sincronização; as fotos vão para o armazenamento privado da conta.
- Gerar o arquivo a partir de `src/data/private`: `npx vite-node scripts/export-plan.ts -- --label "Plano de dezembro" --only workouts,schedule --images inf-12 --out plano-dez.json`

## Dados pessoais (fora do Git)

O app procura `src/data/private/dieta.ts` e `src/data/private/treinos.ts`. Se existirem, usa o plano alimentar, as fichas, a agenda por data e os alongamentos reais; se não, usa os exemplos. A pasta está no `.gitignore`, então o repositório público roda só com dados de exemplo. Os testes de `src/data/private-data.test.ts` validam os dados pessoais e são pulados quando a pasta não existe.

## Usando o seu plano

Edite `src/data/samplePlan.ts` com os alimentos, quantidades e equivalências da sua nutricionista. Os valores atuais são só exemplo. Se já abriu o app antes, limpe o localStorage (DevTools › Application › Local Storage) para carregar o plano novo.

## Próximos passos

Treinos com sugestão de carga, água, painel Hoje, progresso e importação do plano a partir do PDF.
