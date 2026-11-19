/**
 * Calorias aproximadas por 100 g (ou 100 ml) dos alimentos da lista de substituição.
 * Base: Tabela TACO (alimentos brasileiros) e, quando ela não tem o preparo, valores médios
 * de referência. Servem para estimar o dia — não substituem a orientação da nutricionista.
 *
 * Para um alimento que não está aqui, coloque `kcal` direto no alimento do plano:
 *   { ...f('Queijo branco batido light', 3, CS, 60), kcal: 130 }
 */
export const KCAL_PER_100: Record<string, number> = {
  // Grupo 1 · baixa caloria
  'cafe': 9,
  'cha de erva-doce': 1,

  // Grupo 2 · folhosos
  'acelga': 21,
  'agriao': 17,
  'alface crespa/lisa/americana': 14,
  'alface roxa': 15,
  'alho-poro': 32,
  'aspargo cozido': 20,
  'couve-manteiga crua': 27,
  'couve refogada': 90,
  'espinafre cru': 16,
  'espinafre refogado': 67,
  'pepino cru': 10,
  'repolho refogado': 30,

  // Grupo 3 · hortaliças
  'abobrinha italiana cozida': 15,
  'abobrinha italiana refogada': 24,
  'abobora cabotia cozida': 48,
  'abobora moranga cozida': 29,
  'berinjela cozida': 19,
  'beterraba cozida': 32,
  'beterraba crua': 49,
  'brocolis cozido': 25,
  'cenoura baby': 34,
  'cenoura cozida': 30,
  'cenoura crua': 34,
  'chuchu cozido': 19,
  'couve-flor cozida': 19,
  'jilo cozido': 27,
  'palmito pupunha em conserva': 29,
  'shimeji cozido': 30,
  'shitake cozido': 39,
  'tomate-cereja': 20,
  'tomate salada': 15,

  // Grupo 4 · carnes e proteínas
  'acem moido cozido': 212,
  'alcatra sem gordura grelhada': 241,
  'atum solido em oleo': 166,
  'atum light em agua': 110,
  'contrafile sem gordura grelhado': 194,
  'coxa de frango sem pele grelhada': 167,
  'file de frango grelhado': 159,
  'frango grelhado': 159,
  'file de salmao com pele grelhado': 229,
  'file de tilapia cozido': 128,
  'file de tilapia': 128,
  'file-mignon sem gordura grelhado': 220,
  'lombo de porco assado': 210,
  'ovo de galinha': 143,
  'ovo de galinha cozido': 146,
  'ovo de galinha frito/mexido': 200,
  'ovos mexidos': 167,
  'patinho moido refogado': 219,
  'patinho sem gordura grelhado': 219,
  'peito de frango desfiado': 163,
  'pescada branca grelhada': 111,
  'picanha sem gordura grelhada': 238,
  'picanha com gordura grelhada': 289,
  'salmao sem pele grelhado': 243,
  'sobrecoxa de frango sem pele assada': 233,

  // Grupo 5 · cereais e tubérculos
  'arroz branco': 128,
  'arroz branco cozido': 128,
  'arroz integral cozido': 124,
  'batata-baroa/mandioquinha cozida': 80,
  'batata-doce cozida': 77,
  'batata inglesa cozida': 52,
  'batata inglesa saute': 68,
  'farinha de arroz': 363,
  'inhame cozido': 97,
  'macarrao cozido': 102,
  'macarrao integral cozido': 124,
  'mandioca/aipim cozido': 125,
  'milho verde cozido': 108,
  'milho verde enlatado': 98,

  // Grupo 6 · feijão e leguminosas
  'feijao': 76,
  'feijao-fradinho cozido': 78,
  'feijao carioca cozido': 76,
  'feijao preto cozido': 77,
  'grao-de-bico cozido': 164,
  'lentilha cozida': 93,
  'ervilha em vagem cozida': 88,

  // Grupo 9 · frutas
  'abacaxi': 48,
  'ameixa crua': 53,
  'ameixa seca': 240,
  'banana-maca': 87,
  'banana-ouro': 112,
  'banana nanica': 92,
  'banana prata': 98,
  'caju cru': 43,
  'caqui': 71,
  'figo': 41,
  'framboesa': 52,
  'geleia de frutas sem acucar': 100,
  'goiaba': 54,
  'kiwi': 51,
  'laranja-lima': 46,
  'mamao formosa': 45,
  'mamao': 45,
  'manga palmer': 72,
  'manga tommy atkins': 51,
  'maracuja': 68,
  'maca fuji': 56,
  'maca': 56,
  'maca argentina': 63,
  'melancia': 33,
  'melao': 29,
  'mirtilo/blueberry': 57,
  'morango': 30,
  'pera park crua': 61,
  'pera williams crua': 53,
  'pinha/fruta-do-conde': 88,
  'pessego': 36,
  'suco concentrado de uva': 58,
  'suco de laranja-lima': 39,
  'tangerina ponca': 38,
  'uva rubi ou italia': 51,
  'agua de coco': 22,

  // Grupo 11 · nozes e sementes
  'castanha de caju': 570,
  'castanha-do-para crua': 643,
  'pasta de amendoim integral': 600,

  // Grupo 12 · pães e fibras
  'aveia em flocos': 394,
  'bolacha de arroz': 387,
  'cuscuz de milho cozido': 113,
  'cuscuz de milho': 113,
  'farelo de aveia': 246,
  'farinha de aveia': 390,
  'goma de tapioca': 330,
  'granola': 420,
  'milho de pipoca para micro-ondas': 450,
  'milho de pipoca sem oleo': 375,
  'pao de forma integral': 253,
  'pao de forma tradicional': 270,
  'pao frances': 300,
  'pao sirio/pita': 275,
  'pao tipo folha/wrap': 300,

  // Grupo 13 · laticínios
  'coalhada desnatada': 45,
  'creme de ricota light': 130,
  'iogurte natural desnatado': 41,
  'leite desnatado uht': 35,
  'leite desnatado em po': 362,
  'queijo minas frescal light': 200,
  'queijo minas meia cura': 321,
  'queijo mucarela': 330,
  'queijo cottage': 98,
  'ricota': 140,
  'requeijao cremoso': 257,
  'queijo branco batido light (hacendado)': 130,

  // Grupo 14 · suplementos
  'whey protein': 400,
  'whey protein fusion cookies & cream': 389,
};

/**
 * Proteína aproximada (g) por 100 g ou 100 ml — mesma base da tabela de calorias.
 * Para um alimento fora daqui, coloque `protein` direto no alimento do plano.
 */
export const PROTEIN_PER_100: Record<string, number> = {
  'cafe': 0.7, 'cha de erva-doce': 0,
  // folhosos
  'acelga': 1.4, 'agriao': 2.7, 'alface crespa/lisa/americana': 1.3, 'alface roxa': 0.9, 'alho-poro': 1.4,
  'aspargo cozido': 2.4, 'couve-manteiga crua': 2.9, 'couve refogada': 1.7, 'espinafre cru': 2,
  'espinafre refogado': 2.7, 'pepino cru': 0.9, 'repolho refogado': 0.8,
  // hortaliças
  'abobrinha italiana cozida': 1.1, 'abobrinha italiana refogada': 1.1, 'abobora cabotia cozida': 1.4,
  'abobora moranga cozida': 0.4, 'berinjela cozida': 0.7, 'beterraba cozida': 1.3, 'beterraba crua': 1.9,
  'brocolis cozido': 2.1, 'cenoura baby': 0.6, 'cenoura cozida': 0.8, 'cenoura crua': 1.3, 'chuchu cozido': 0.4,
  'couve-flor cozida': 1.2, 'jilo cozido': 1.4, 'palmito pupunha em conserva': 2.5, 'shimeji cozido': 2.2,
  'shitake cozido': 1.6, 'tomate-cereja': 1.1, 'tomate salada': 0.9,
  // carnes e proteínas
  'acem moido cozido': 26.7, 'alcatra sem gordura grelhada': 31.9, 'atum solido em oleo': 26.2,
  'atum light em agua': 24, 'contrafile sem gordura grelhado': 35.9, 'coxa de frango sem pele grelhada': 28.5,
  'file de frango grelhado': 32, 'frango grelhado': 32, 'file de salmao com pele grelhado': 23.9,
  'file de tilapia cozido': 26, 'file de tilapia': 26, 'file-mignon sem gordura grelhado': 32.8,
  'lombo de porco assado': 35.7, 'ovo de galinha': 13, 'ovo de galinha cozido': 13.3,
  'ovo de galinha frito/mexido': 15.6, 'ovos mexidos': 13, 'patinho moido refogado': 35.9,
  'patinho sem gordura grelhado': 35.9, 'peito de frango desfiado': 31.5, 'pescada branca grelhada': 20,
  'picanha sem gordura grelhada': 31.9, 'picanha com gordura grelhada': 26.4, 'salmao sem pele grelhado': 26.1,
  'sobrecoxa de frango sem pele assada': 29.2, 'whey protein fusion cookies & cream': 79, 'whey protein': 80,
  // cereais e tubérculos
  'arroz branco': 2.5, 'arroz branco cozido': 2.5, 'arroz integral cozido': 2.6, 'batata-baroa/mandioquinha cozida': 0.9,
  'batata-doce cozida': 0.6, 'batata inglesa cozida': 1.2, 'batata inglesa saute': 1.3, 'farinha de arroz': 6,
  'inhame cozido': 2.1, 'macarrao cozido': 3.4, 'macarrao integral cozido': 5, 'mandioca/aipim cozido': 0.6,
  'milho verde cozido': 3.2, 'milho verde enlatado': 2.4,
  // feijão e leguminosas
  'feijao': 4.8, 'feijao-fradinho cozido': 5.1, 'feijao carioca cozido': 4.8, 'feijao preto cozido': 4.5,
  'grao-de-bico cozido': 8.9, 'lentilha cozida': 6.3, 'ervilha em vagem cozida': 4,
  // frutas
  'abacaxi': 0.9, 'ameixa crua': 0.8, 'ameixa seca': 2.2, 'banana-maca': 1.8, 'banana-ouro': 1.5,
  'banana nanica': 1.4, 'banana prata': 1.3, 'caju cru': 0.9, 'caqui': 0.4, 'figo': 1, 'framboesa': 1.2,
  'geleia de frutas sem acucar': 0.3, 'goiaba': 1.1, 'kiwi': 1.1, 'laranja-lima': 1.1, 'mamao formosa': 0.8,
  'mamao': 0.8, 'manga palmer': 0.4, 'manga tommy atkins': 0.9, 'maracuja': 2, 'maca fuji': 0.3, 'maca': 0.3,
  'maca argentina': 0.2, 'melancia': 0.9, 'melao': 0.7, 'mirtilo/blueberry': 0.7, 'morango': 0.9,
  'pera park crua': 0.5, 'pera williams crua': 0.6, 'pinha/fruta-do-conde': 1.5, 'pessego': 0.8,
  'suco concentrado de uva': 0.3, 'suco de laranja-lima': 0.7, 'tangerina ponca': 0.8, 'uva rubi ou italia': 0.7,
  'agua de coco': 0,
  // nozes e sementes
  'castanha de caju': 18.5, 'castanha-do-para crua': 14.5, 'pasta de amendoim integral': 25,
  // pães e fibras
  'aveia em flocos': 13.9, 'bolacha de arroz': 7, 'cuscuz de milho cozido': 2.2, 'cuscuz de milho': 2.2,
  'farelo de aveia': 17, 'farinha de aveia': 13, 'goma de tapioca': 0, 'granola': 10,
  'milho de pipoca para micro-ondas': 9, 'milho de pipoca sem oleo': 12, 'pao de forma integral': 9.4,
  'pao de forma tradicional': 8, 'pao frances': 8, 'pao sirio/pita': 9, 'pao tipo folha/wrap': 8,
  // laticínios
  'coalhada desnatada': 4, 'creme de ricota light': 10, 'iogurte natural desnatado': 3.8, 'leite desnatado uht': 3.4,
  'leite desnatado em po': 34.7, 'queijo minas frescal light': 17, 'queijo minas meia cura': 21.2,
  'queijo mucarela': 22.6, 'queijo cottage': 11, 'ricota': 12.6, 'requeijao cremoso': 9.6,
  'queijo branco batido light (hacendado)': 9,
};
