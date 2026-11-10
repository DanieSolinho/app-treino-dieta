# Treino & Dieta

App web mobile-first que junta treino, alongamento, dieta e água num só lugar. Esta primeira entrega traz a **tela de Dieta com substituição de alimentos**.

## O que já funciona

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

## Usando o seu plano

Edite `src/data/samplePlan.ts` com os alimentos, quantidades e equivalências da sua nutricionista. Os valores atuais são só exemplo. Se já abriu o app antes, limpe o localStorage (DevTools › Application › Local Storage) para carregar o plano novo.

## Próximos passos

Treinos com sugestão de carga, água, painel Hoje, progresso e importação do plano a partir do PDF.
