/* ============================================================
   config.js — Configuração central e constantes do jogo
   Ponto único de verdade. Facilita evolução para multiplayer,
   economia online, login, etc. sem espalhar "números mágicos".
   ============================================================ */

export const GAME = Object.freeze({
  name: "Brasil Online",
  version: "0.1.0",
  build: "mvp-etapa-1",
  storageKey: "brasil-online:save",
  settingsKey: "brasil-online:settings",
});

/* Estados globais do fluxo (máquina de estados de telas). */
export const SCREENS = Object.freeze({
  MENU: "menu",
  CREATE_CHARACTER: "create-character", // etapa 2
  CHOOSE_JOB: "choose-job",             // etapa 3
  WORLD: "world",                       // etapa 4
});

/* Valores iniciais da economia (apenas variáveis, sem banco). */
export const ECONOMY = Object.freeze({
  startMoney: 1000,
  startXp: 0,
  startLevel: 1,
  xpPerLevel: 100, // XP necessário por nível (curva simples por enquanto)
});

/* Configurações padrão do jogador (sobrescritas pelo LocalStorage). */
export const DEFAULT_SETTINGS = Object.freeze({
  musicVolume: 60,
  sfxVolume: 80,
  shadows: true,
  highQuality: true,
});

/* Profissões — dados de catálogo (usados na etapa 3). */
export const JOBS = Object.freeze([
  { id: "caminhoneiro", emoji: "🚛", name: "Caminhoneiro", difficulty: 3, income: "R$ 3.500 – R$ 8.000",
    desc: "Cruze o Brasil transportando cargas. Fretes longos, boa renda e independência na estrada." },
  { id: "agricultor", emoji: "🚜", name: "Agricultor", difficulty: 2, income: "R$ 2.000 – R$ 6.000",
    desc: "Plante, colha e abasteça o país. Trabalho árduo com recompensas sazonais." },
  { id: "motoboy", emoji: "🏍", name: "Motoboy", difficulty: 2, income: "R$ 1.800 – R$ 4.000",
    desc: "Agilidade e velocidade nas entregas urbanas. Cada minuto conta." },
  { id: "motorista-app", emoji: "🚕", name: "Motorista de Aplicativo", difficulty: 1, income: "R$ 1.500 – R$ 3.500",
    desc: "Leve passageiros pela cidade. Flexível, ideal para começar a carreira." },
  { id: "comerciante", emoji: "🏪", name: "Comerciante", difficulty: 3, income: "R$ 2.500 – R$ 10.000",
    desc: "Compre, venda e construa seu império. Gestão e visão de negócios." },
  { id: "servente", emoji: "👷", name: "Servente de Obra", difficulty: 1, income: "R$ 1.400 – R$ 3.000",
    desc: "A base da construção civil. Esforço garantido e crescimento na obra." },
]);

/* Flags de funcionalidades futuras — desligadas neste MVP.
   Mantidas aqui para preparar o terreno da arquitetura. */
export const FEATURES = Object.freeze({
  multiplayer: false,
  onlineEconomy: false,
  login: false,
  inventory: false,
  housing: false,
  companies: false,
  playerTrade: false,
});
