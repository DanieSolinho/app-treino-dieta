export interface Food {
  name: string;
  qty: number | null; // null = "à vontade"
  measure: string; // medida caseira: "colher(es) de sopa cheia(s)", "fatia(s) média(s)"…
  grams?: number;
  unit?: 'g' | 'ml'; // padrão: g
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
}

export interface DietPlan {
  title?: string;
  meals: Meal[];
  groups: SubstitutionGroup[];
}
