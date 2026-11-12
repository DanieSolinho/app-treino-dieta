import type { DietPlan } from '../types/diet';
import { f, vontade } from '../lib/food';

/**
 * PLANO DE EXEMPLO — é o que aparece no repositório público.
 * O seu plano real fica em src/data/private/ (fora do Git).
 */
export const samplePlan: DietPlan = {
  title: 'Plano de exemplo',
  groups: [
    {
      id: 'carboidratos',
      name: 'Carboidratos',
      options: [
        f('Arroz branco cozido', 1, 'colher(es) de sopa cheia(s)', 25),
        f('Batata-doce cozida', 1, 'fatia(s) pequena(s)', 40),
        f('Mandioca cozida', 1, 'colher(es) de sopa rasa(s)', 25),
        f('Macarrão integral cozido', 1, 'colher(es) de arroz rasa(s)', 25),
      ],
    },
    {
      id: 'proteinas',
      name: 'Proteínas',
      options: [
        f('Filé de frango grelhado', 1, 'bife(s) pequeno(s)', 50),
        f('Patinho moído refogado', 2, 'colher(es) de sopa cheia(s)', 50),
        f('Filé de tilápia', 1, 'filé(s) médio(s)', 60),
      ],
    },
    {
      id: 'frutas',
      name: 'Frutas',
      options: [
        f('Banana prata', 1, 'unidade(s) média(s)', 65),
        f('Maçã', 1, 'unidade(s) pequena(s)', 90),
        f('Mamão', 1, 'fatia(s) média(s)', 170),
      ],
    },
  ],
  meals: [
    {
      id: 'cafe',
      name: 'Café da manhã',
      items: [
        { id: 'cafe-ovos', food: f('Ovos mexidos', 2, 'unidade(s)', 100) },
        { id: 'cafe-fruta', food: f('Banana prata', 1, 'unidade(s) média(s)', 65), group: { id: 'frutas', portions: 1 } },
      ],
    },
    {
      id: 'almoco',
      name: 'Almoço',
      defaultLabel: 'Com feijão',
      items: [
        { id: 'alm-salada', food: vontade('Salada verde') },
        {
          id: 'alm-arroz',
          food: f('Arroz branco', 4, 'colher(es) de sopa cheia(s)', 100),
          options: [f('Macarrão integral cozido', 4, 'colher(es) de arroz rasa(s)', 100)],
          group: { id: 'carboidratos', portions: 4 },
        },
        { id: 'alm-feijao', food: f('Feijão', 1, 'concha(s) pequena(s)', 65) },
        { id: 'alm-frango', food: f('Frango grelhado', 2, 'bife(s) pequeno(s)', 100), group: { id: 'proteinas', portions: 2 } },
      ],
      variants: [
        {
          id: 'sem-feijao',
          label: 'Sem feijão',
          items: [
            { id: 'alm2-salada', food: vontade('Salada verde') },
            { id: 'alm2-arroz', food: f('Arroz branco', 6, 'colher(es) de sopa cheia(s)', 150), group: { id: 'carboidratos', portions: 6 } },
            { id: 'alm2-frango', food: f('Frango grelhado', 2, 'bife(s) pequeno(s)', 100), group: { id: 'proteinas', portions: 2 } },
          ],
        },
      ],
    },
    {
      id: 'lanche',
      name: 'Lanche',
      items: [{ id: 'lan-fruta', food: f('Maçã', 1, 'unidade(s) pequena(s)', 90), group: { id: 'frutas', portions: 1 } }],
    },
    {
      id: 'jantar',
      name: 'Jantar',
      items: [
        { id: 'jan-carbo', food: f('Batata-doce cozida', 3, 'fatia(s) pequena(s)', 120), group: { id: 'carboidratos', portions: 3 } },
        { id: 'jan-prot', food: f('Filé de tilápia', 2, 'filé(s) médio(s)', 120), group: { id: 'proteinas', portions: 2 } },
      ],
    },
  ],
};
