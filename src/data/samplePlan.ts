import type { DietPlan } from '../types/diet';

/**
 * PLANO DE EXEMPLO — só para o app ter dados ao abrir.
 * Substitua pelos alimentos, quantidades e equivalências do plano da sua nutricionista.
 */
export const samplePlan: DietPlan = {
  groups: [
    {
      id: 'carboidratos',
      name: 'Carboidratos',
      options: [
        { name: 'Arroz branco', amount: 100, unit: 'g' },
        { name: 'Batata-doce', amount: 150, unit: 'g' },
        { name: 'Mandioca cozida', amount: 100, unit: 'g' },
        { name: 'Macarrão integral', amount: 90, unit: 'g' },
        { name: 'Cuscuz de milho', amount: 100, unit: 'g' },
      ],
    },
    {
      id: 'proteinas',
      name: 'Proteínas',
      options: [
        { name: 'Frango grelhado', amount: 120, unit: 'g' },
        { name: 'Patinho moído', amount: 100, unit: 'g' },
        { name: 'Tilápia grelhada', amount: 140, unit: 'g' },
        { name: 'Ovos cozidos', amount: 3, unit: 'un' },
      ],
    },
    {
      id: 'leguminosas',
      name: 'Leguminosas',
      options: [
        { name: 'Feijão', amount: 1, unit: 'concha' },
        { name: 'Lentilha', amount: 1, unit: 'concha' },
        { name: 'Grão-de-bico', amount: 4, unit: 'colher' },
      ],
    },
    {
      id: 'frutas',
      name: 'Frutas',
      options: [
        { name: 'Banana', amount: 1, unit: 'un' },
        { name: 'Maçã', amount: 1, unit: 'un' },
        { name: 'Mamão', amount: 1, unit: 'fatia' },
      ],
    },
    {
      id: 'paes',
      name: 'Pães',
      options: [
        { name: 'Pão integral', amount: 2, unit: 'fatia' },
        { name: 'Tapioca', amount: 3, unit: 'colher' },
        { name: 'Aveia', amount: 3, unit: 'colher' },
      ],
    },
  ],
  meals: [
    {
      id: 'cafe',
      name: 'Café da manhã',
      time: '08:00',
      items: [
        { id: 'cafe-pao', food: { name: 'Pão integral', amount: 2, unit: 'fatia' }, groupId: 'paes' },
        { id: 'cafe-ovos', food: { name: 'Ovos mexidos', amount: 2, unit: 'un' } },
        { id: 'cafe-fruta', food: { name: 'Mamão', amount: 1, unit: 'fatia' }, groupId: 'frutas' },
      ],
    },
    {
      id: 'lanche-manha',
      name: 'Lanche da manhã',
      time: '10:30',
      items: [
        { id: 'lm-fruta', food: { name: 'Banana', amount: 1, unit: 'un' }, groupId: 'frutas' },
        { id: 'lm-iogurte', food: { name: 'Iogurte natural', amount: 170, unit: 'g' } },
      ],
    },
    {
      id: 'almoco',
      name: 'Almoço',
      time: '13:00',
      items: [
        { id: 'alm-arroz', food: { name: 'Arroz branco', amount: 100, unit: 'g' }, groupId: 'carboidratos' },
        { id: 'alm-feijao', food: { name: 'Feijão', amount: 1, unit: 'concha' }, groupId: 'leguminosas' },
        { id: 'alm-frango', food: { name: 'Frango grelhado', amount: 120, unit: 'g' }, groupId: 'proteinas' },
        { id: 'alm-salada', food: { name: 'Salada verde à vontade', amount: 1, unit: 'un' } },
      ],
    },
    {
      id: 'lanche-tarde',
      name: 'Lanche da tarde',
      time: '16:30',
      items: [
        { id: 'lt-fruta', food: { name: 'Maçã', amount: 1, unit: 'un' }, groupId: 'frutas' },
        { id: 'lt-pao', food: { name: 'Tapioca', amount: 3, unit: 'colher' }, groupId: 'paes' },
      ],
    },
    {
      id: 'jantar',
      name: 'Jantar',
      time: '20:00',
      items: [
        { id: 'jan-carbo', food: { name: 'Batata-doce', amount: 150, unit: 'g' }, groupId: 'carboidratos' },
        { id: 'jan-prot', food: { name: 'Tilápia grelhada', amount: 140, unit: 'g' }, groupId: 'proteinas' },
        { id: 'jan-legumes', food: { name: 'Legumes cozidos', amount: 1, unit: 'un' } },
      ],
    },
  ],
};
