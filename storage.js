/* ============================================================
   storage.js — Camada de persistência
   Abstrai o LocalStorage. No futuro, esta mesma interface pode
   apontar para uma API/banco de dados sem mudar o resto do jogo.
   ============================================================ */

import { GAME, DEFAULT_SETTINGS } from "./config.js";

/** Adaptador de armazenamento. Hoje: LocalStorage. Amanhã: API. */
class StorageDriver {
  constructor() {
    this.available = this._check();
    this._memory = new Map(); // fallback se LocalStorage bloqueado
  }

  _check() {
    try {
      const k = "__bo_test__";
      window.localStorage.setItem(k, "1");
      window.localStorage.removeItem(k);
      return true;
    } catch {
      console.warn("[storage] LocalStorage indisponível — usando memória.");
      return false;
    }
  }

  read(key) {
    try {
      const raw = this.available
        ? window.localStorage.getItem(key)
        : this._memory.get(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn("[storage] falha ao ler", key, e);
      return null;
    }
  }

  write(key, value) {
    try {
      const raw = JSON.stringify(value);
      if (this.available) window.localStorage.setItem(key, raw);
      else this._memory.set(key, raw);
    } catch (e) {
      console.warn("[storage] falha ao gravar", key, e);
    }
  }

  remove(key) {
    if (this.available) window.localStorage.removeItem(key);
    else this._memory.delete(key);
  }
}

const driver = new StorageDriver();

/* ---------------- Save do jogo ---------------- */

export function loadSave() {
  return driver.read(GAME.storageKey);
}

export function writeSave(state) {
  driver.write(GAME.storageKey, { ...state, _savedAt: Date.now() });
}

export function clearSave() {
  driver.remove(GAME.storageKey);
}

export function hasSave() {
  return !!loadSave();
}

/* ---------------- Configurações ---------------- */

export function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...(driver.read(GAME.settingsKey) || {}) };
}

export function writeSettings(settings) {
  driver.write(GAME.settingsKey, settings);
}

export const Storage = {
  loadSave,
  writeSave,
  clearSave,
  hasSave,
  loadSettings,
  writeSettings,
};
