export interface Food {
  name: string;
  qty: number | null; // null = "à vontade"
  measure: string; // medida caseira: "colher(es) de sopa cheia(s)", "fatia(s) média(s)"…
  grams?: number;
  unit?: 'g' | 'ml'; // padrão: g
  kcal?: number; // kcal por 100 g/ml; sem isso, o app procura na tabela (src/data/kcalTable.ts)
  protein?: number; // g de proteína por 100 g/ml; sem isso, também vem da tabela
}

/** Algo comido fora do plano, registrado à mão. */
export interface OffPlanEntry {
  id: string;
  text: string; // "2 fatias de pizza de calabresa"
  kcal: number;
  protein?: number; // g — só quando veio da lista da dieta
}

export interface SubstitutionGroup {
  id: string; // "4"
  name: string; // "Carnes e Proteínas"
  options: Food[]; // 1 porção de cada alimento
}

/** "Ou escolha 1,8 porção do grupo 4 da lista de substituição." */
export interface GroupRef {
  id: string;
  portions: number;
}

export interface MealItem {
  id: string;
  food: Food;
  options?: Food[]; // substituições escritas na própria refeição
  group?: GroupRef; // + qualquer alimento do grupo, na porção indicada
}

export interface MealVariant {
  id: string;
  label: string; // "Sem feijão", "Lanche"
  items: MealItem[];
}

export interface Meal {
  id: string;
  name: string; // "Almoço"
  time?: string; // opcional: "12:30"
  items: MealItem[];
  defaultLabel?: string; // nome da versão principal quando há variantes ("Com feijão")
  variants?: MealVariant[];
  /** Refeição extra (ex.: lanche da manhã): não entra no lembrete de "faltou marcar". */
  optional?: boolean;
}

export interface DietPlan {
  title?: string;
  kcalGoal?: number; // meta do dia; sem isso, o app lê do título ("… · 1300 kcal")
  proteinGoal?: number; // meta de proteína do dia, em gramas
  /** Quando este plano foi importado/editado (ms). Um aparelho só substitui o plano do servidor por um mais novo. */
  version?: number;
  meals: Meal[];
  groups: SubstitutionGroup[];
}
