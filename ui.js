/* ============================================================
   ui.js — Infraestrutura de interface
   • EventBus  — comunicação desacoplada entre módulos
   • el()      — micro-helper de criação de DOM
   • ScreenManager — máquina de estados de telas com transições
   • toast / modal — componentes reutilizáveis
   ============================================================ */

/* ---------------- EventBus (pub/sub) ---------------- */
class EventBus {
  constructor() {
    this._map = new Map();
  }
  on(evt, fn) {
    if (!this._map.has(evt)) this._map.set(evt, new Set());
    this._map.get(evt).add(fn);
    return () => this.off(evt, fn);
  }
  off(evt, fn) {
    this._map.get(evt)?.delete(fn);
  }
  emit(evt, payload) {
    this._map.get(evt)?.forEach((fn) => {
      try { fn(payload); } catch (e) { console.error(`[bus:${evt}]`, e); }
    });
  }
}

export const bus = new EventBus();

/* ---------------- Helper de DOM ---------------- */
/**
 * Cria um elemento com atributos/filhos.
 * el("button.btn", { onclick }, "Texto")
 */
export function el(tag, props = {}, ...children) {
  const [name, ...classes] = tag.split(".");
  const node = document.createElement(name || "div");
  if (classes.length) node.className = classes.join(" ");

  for (const [key, val] of Object.entries(props || {})) {
    if (key === "class") node.className = val;
    else if (key === "html") node.innerHTML = val;
    else if (key.startsWith("on") && typeof val === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), val);
    } else if (key === "dataset") {
      Object.assign(node.dataset, val);
    } else if (val !== false && val != null) {
      node.setAttribute(key, val === true ? "" : val);
    }
  }

  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(child));
  }
  return node;
}

/* ---------------- ScreenManager ---------------- */
/**
 * Cada "tela" é um objeto: { mount(root, ctx) -> HTMLElement, unmount?() }
 * O manager cuida da transição de saída/entrada.
 */
class ScreenManager {
  constructor(rootId = "app") {
    this.root = document.getElementById(rootId);
    this.screens = new Map();
    this.current = null;
    this.currentEl = null;
    this.currentKey = null;
  }

  register(key, factory) {
    this.screens.set(key, factory);
    return this;
  }

  has(key) {
    return this.screens.has(key);
  }

  async show(key, ctx = {}) {
    const factory = this.screens.get(key);
    if (!factory) throw new Error(`Tela não registrada: ${key}`);

    // saída da tela anterior
    if (this.currentEl) {
      const leaving = this.currentEl;
      this.current?.unmount?.();
      leaving.classList.add("screen--leaving");
      await wait(380);
      leaving.remove();
    }

    const screen = factory();
    const node = screen.mount(ctx);
    node.classList.add("screen");
    this.root.append(node);

    this.current = screen;
    this.currentEl = node;
    this.currentKey = key;
    bus.emit("screen:changed", key);
    return screen;
  }
}

export const screens = new ScreenManager("app");

/* ---------------- Utilitário de espera ---------------- */
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------- Céu Ghibli (fundo reutilizável) ----------------
   Céu em aquarela, sol quente, nuvens fofas flutuando e colinas.
   Usado como plano de fundo das telas com tema Ghibli. */
export function ghibliSky() {
  const clouds = [
    "cloud--a", "cloud--b", "cloud--c", "cloud--d", "cloud--e",
  ].map((c) => el(`div.cloud.${c}`, {}, el("span"), el("span"), el("span")));

  const hills = el("div.hills", {
    html: `
      <svg viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
        <path class="hill hill-3" d="M0,220 C240,150 420,190 720,170 C1020,150 1200,200 1440,160 L1440,320 L0,320 Z"/>
        <path class="hill hill-2" d="M0,260 C260,210 520,250 780,225 C1040,200 1260,255 1440,220 L1440,320 L0,320 Z"/>
        <path class="hill hill-1" d="M0,300 C300,265 560,295 860,278 C1120,262 1300,300 1440,285 L1440,320 L0,320 Z"/>
      </svg>`,
  });

  return el(
    "div.sky",
    { "aria-hidden": "true" },
    el("div.sun"),
    el("div.birds", { html: "<span>ᨒ</span><span>ᨒ</span><span>ᨒ</span>" }),
    ...clouds,
    hills
  );
}

/* ---------------- Toast ---------------- */
let toastWrap = null;
export function toast(message, ms = 2600) {
  if (!toastWrap) {
    toastWrap = el("div.toast-wrap");
    document.body.append(toastWrap);
  }
  const node = el("div.toast", {}, message);
  toastWrap.append(node);
  setTimeout(() => {
    node.classList.add("out");
    setTimeout(() => node.remove(), 400);
  }, ms);
}

/* ---------------- Modal ---------------- */
/**
 * openModal({ title, body: HTMLElement })
 * Retorna uma função close().
 */
export function openModal({ title, subtitle, body }) {
  const closeBtn = el("button.modal__close", { "aria-label": "Fechar" }, "✕");

  const modal = el(
    "div.modal",
    {},
    el(
      "div.modal__head",
      {},
      el("h2.modal__title", {}, title),
      closeBtn
    ),
    subtitle ? el("p.modal__desc", {}, subtitle) : null,
    body
  );

  const backdrop = el("div.modal-backdrop", {}, modal);
  document.body.append(backdrop);

  const close = () => {
    backdrop.classList.add("closing");
    setTimeout(() => backdrop.remove(), 300);
  };

  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });
  document.addEventListener("keydown", function esc(e) {
    if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); }
  });

  return close;
}
