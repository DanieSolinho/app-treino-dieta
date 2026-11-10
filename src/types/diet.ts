export type Unit = 'g' | 'ml' | 'un' | 'colher' | 'fatia' | 'concha';

export interface Food {
  name: string;
  amount: number;
  unit: Unit;
}

export interface SubstitutionGroup {
  id: string;
  name: string; // "Carboidratos"
  options: Food[]; // equivalentes definidos pela nutricionista
}

export interface MealItem {
  id: string;
  food: Food;
  groupId?: string; // sem grupo = sem substituição
}

export interface Meal {
  id: string;
  name: string; // "Almoço"
  time: string; // "13:00"
  items: MealItem[];
}

export interface DietPlan {
  meals: Meal[];
  groups: SubstitutionGroup[];
}
