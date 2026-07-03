/* ============================================================
   state.js — Estado global do jogo (em memória + persistência)
   Fonte única de verdade para economia e personagem. Isolado das
   telas para evitar dependências circulares e facilitar a evolução
   futura (sincronização com servidor, login, etc.).
   ============================================================ */

import { ECONOMY } from "./config.js";
import { Storage } from "./storage.js";
import { bus } from "./ui.js";

function freshData() {
  return {
    character: null, // { name, sex, skin, outfit } — Etapa 2
    job: null,       // id da profissão — Etapa 3
    money: ECONOMY.startMoney,
    xp: ECONOMY.startXp,
    level: ECONOMY.startLevel,
  };
}

export const GameState = {
  data: freshData(),
  settings: Storage.loadSettings(),

  load() {
    const save = Storage.loadSave();
    if (save) Object.assign(this.data, save);
    return !!save;
  },

  save() {
    Storage.writeSave(this.data);
    bus.emit("state:saved", this.data);
  },

  /** Define a aparência do personagem e persiste (Etapa 2). */
  setCharacter(character) {
    this.data.character = { ...character };
    this.save();
    bus.emit("character:changed", this.data.character);
  },

  reset() {
    Storage.clearSave();
    this.data = freshData();
    bus.emit("state:reset");
  },
};
