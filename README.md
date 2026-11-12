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

### Publicar na Vercel

1. Entre em vercel.com com a conta do GitHub e importe o repositório (detecta Vite sozinho).
2. Em **Settings › Environment Variables**, cadastre `ANTHROPIC_API_KEY` e `SCAN_ACCESS_CODE`.
3. Deploy. A pasta `api/` vira função automaticamente.

## Dados pessoais (fora do Git)

O app procura `src/data/private/dieta.ts` e `src/data/private/treinos.ts`. Se existirem, usa o plano alimentar, as fichas, a agenda por data e os alongamentos reais; se não, usa os exemplos. A pasta está no `.gitignore`, então o repositório público roda só com dados de exemplo. Os testes de `src/data/private-data.test.ts` validam os dados pessoais e são pulados quando a pasta não existe.

## Usando o seu plano

Edite `src/data/samplePlan.ts` com os alimentos, quantidades e equivalências da sua nutricionista. Os valores atuais são só exemplo. Se já abriu o app antes, limpe o localStorage (DevTools › Application › Local Storage) para carregar o plano novo.

## Próximos passos

Treinos com sugestão de carga, água, painel Hoje, progresso e importação do plano a partir do PDF.
