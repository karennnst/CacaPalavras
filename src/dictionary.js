export const DICTIONARY_VERSION = "pt-BR-2026-10-v1";

const answerWords = [
  "LIVRO", "NUVEM", "PRAIA", "FREVO", "SABÃO", "LIMÃO", "AVIÃO", "PAPEL",
  "MELÃO", "BOLSA", "FOLHA", "CHUVA", "NOITE", "VERDE", "PONTE", "SONHO",
  "CAMPO", "BRISA", "SABOR", "MUNDO", "LÁPIS", "AMIGO", "PORTA", "PEDRA",
  "TEMPO", "LINDA", "LINHA", "FAROL", "BARCO", "LIVRE", "FORTE", "TERRA",
  "GATOS", "CASAS", "DENTE", "FESTA", "TRIGO", "VISTA", "BEIJO", "RISCO",
  "MANGA", "MORRO", "CINCO", "CORPO", "GENTE", "SINAL", "SORTE", "VALOR",
  "VENTO", "PONTO", "PRAZO", "RAIOS", "TARDE", "NOIVA", "LUGAR", "CALMA",
  "AÇÕES", "MAÇÃS", "ÓTIMO", "ÓTIMA", "QUASE", "BEBER", "COMER", "ANDAR",
  "SABER", "DIZER", "LEITE", "PRATO", "FOLGA", "MURAL", "METRO", "NORTE",
  "SULCO", "CORAL", "FAVOR", "CLARO", "CLARA", "VIVER", "MOVER", "VIRAM",
  "VIRAR", "ABRIR", "FEIRA", "PEIXE", "FICHA", "FALHA", "CAIXA", "LARGO",
  "LARGA", "NINHO", "PÁTIO", "ACASO", "ROCHA", "VELHO", "VELHA", "PÁGINA",
  "SÉRIE", "TEXTO", "VALSA", "ZEBRA", "FOGÃO", "POMAR", "RÁDIO", "MÚSICA",
  "CARRO", "CASAL", "DOCE", "FLOR", "FRUTA", "HOTEL", "MEL", "MESA",
  "PÃO", "REDE", "RISO", "SOL", "VACA"
];

export const ANSWERS = answerWords
  .map((display) => ({ id: normalizeWord(display), display }))
  .filter(({ id }) => Array.from(id).length === 5);

const additionalGuesses = [
  "AÇÕES", "AÇÃO", "AÇUDE", "AMORA", "ARROZ", "ATLAS", "BAIXO", "BANDA",
  "BANHO", "BARRA", "BEBÊS", "BOLÃO", "BONDE", "BORDA", "BREJO", "CABRA",
  "CAFÉ", "CALDO", "CALOR", "CANTO", "CAPIM", "CARGA", "CARNE", "CARTA",
  "CERTO", "CESTA", "CICLO", "CÍLIO", "CIRCO", "COLAR", "CONTO", "COURO",
  "CRAVO", "DANÇA", "DEDOS", "DÓLAR", "DÚZIA", "ELITE", "ETAPA", "FARDA",
  "FARPA", "FELIZ", "FIRMA", "FOFÃO", "FÔLEGO", "FREIO", "GARRA", "GOSTO",
  "GRAMA", "GRUPO", "HASTE", "ÍNDIO", "JANTA", "JOGAR", "JOVEM", "JUROS",
  "LANCE", "LARVA", "LENTO", "LIMPO", "LOUCO", "LUZES", "MANHÃ", "MARCA",
  "MÁGIO", "MALHA", "MARÉ", "MÉDIO", "MIOLO", "MISTO", "MOEDA", "MOLHO",
  "MORAL", "MORSA", "MOTOR", "MUDAR", "MURAL", "NADAR", "NATAL", "NAVIO",
  "NEVOA", "NOBRE", "OBRAS", "OLHAR", "OMBRO", "ONDA", "ÓRGÃO", "OUVIR",
  "PALCO", "PALMA", "PAPAI", "PARAR", "PARTE", "PASTA", "PATOS", "PENSA",
  "PERTO", "PIANO", "PILHA", "PINTA", "PIRÃO", "PODER", "POEMA", "POETA",
  "POMBO", "POUCO", "PRAÇA", "PREÇO", "PRESA", "PULAR", "QUEDA", "QUILO",
  "QUINA", "QUOTA", "RAIVA", "RAMPA", "RAPAZ", "RAZÃO", "REGRA", "RESTO",
  "RITMO", "RODAR", "ROUPA", "RURAL", "SACAR", "SAGAZ", "SALTO", "SAÚDE",
  "SELVA", "SENHA", "SENSO", "SÉRIO", "SIGLA", "SÍTIO", "SOBRE", "SONSO",
  "SUAVE", "SUÍÇO", "TANTO", "TAXAS", "TECLA", "TELHA", "TENDO", "TERÇO",
  "TOQUE", "TORRE", "TRAMA", "TREVO", "TRUPE", "TURMA", "ÚNICO", "URUBU",
  "USADO", "VÁLIDO", "VAPOR", "VASTO", "VEADO", "VELAS", "VENDA", "VERÃO",
  "VIGOR", "VÍRUS", "VOGAL", "VULGO", "XADREZ", "ZELAR", "LÍRIO"
];

export const ACCEPTED_GUESSES = new Set(
  [...ANSWERS.map(({ display }) => display), ...additionalGuesses]
    .map(normalizeWord)
    .filter((word) => Array.from(word).length === 5)
);

export function normalizeWord(value) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleUpperCase("pt-BR")
    .normalize("NFC");
}
