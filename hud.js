/* ============================================================
   hud.js — Interface de jogo (HUD)  [ETAPA 4]  · tema Ghibli
   Nome, profissão, nível, dinheiro, XP, missão atual, relógio e
   minimapa. Reage a eventos do EventBus (economia, missões).
   ============================================================ */

import { JOBS } from "./config.js";
import { xpForNext } from "./state.js";
import { bus, el, toast } from "./ui.js";

const money = (n) => "R$ " + Math.round(n).toLocaleString("pt-BR");

export class HUD {
  constructor({ state, landmarks, bounds, onAction }) {
    this.state = state;
    this.landmarks = landmarks;
    this.bounds = bounds;
    this.onAction = onAction;
    this.gameMinutes = 8 * 60; // começa 08:00
    this._subs = [];
    this._playerPos = { x: 0, z: 0 };
  }

  mount(parent) {
    const d = this.state.data;
    const job = JOBS.find((j) => j.id === d.job);

    // ---- topo-esquerda: card do jogador ----
    this.levelEl = el("span.hud-chiplabel", {}, `Nível ${d.level}`);
    const playerCard = el("div.hud-card.hud-player",
      {},
      el("div.hud-player__ava", {}, job?.emoji || "🧑"),
      el("div.hud-player__info",
        {},
        el("div.hud-player__name", {}, d.character?.name || "Jogador"),
        el("div.hud-player__job", {}, job ? `${job.name}` : "—"),
      ),
      el("div.hud-player__lvl", {}, this.levelEl)
    );

    // ---- topo-direita: carteira + relógio + XP ----
    this.moneyEl = el("span.hud-wallet__val", {}, money(d.money));
    this.clockEl = el("span.hud-clock__time", {}, "08:00");
    this.xpFill = el("div.hud-xp__fill");
    this.xpText = el("span.hud-xp__text", {}, "");
    const topRight = el("div.hud-topright",
      {},
      el("div.hud-card.hud-clock", {}, el("span.hud-clock__icon", {}, "🕗"), this.clockEl),
      el("div.hud-card.hud-wallet", {}, el("span.hud-wallet__icon", {}, "💰"), this.moneyEl),
      el("div.hud-card.hud-xp", {},
        el("div.hud-xp__bar", {}, this.xpFill),
        this.xpText
      )
    );

    // ---- objetivo (missão) ----
    this.missionLabel = el("div.hud-mission__label", {}, "Preparando missão…");
    this.actionBtn = el("button.hud-mission__action", { onClick: () => this.onAction?.() }, "Aceitar");
    this.actionBtn.style.display = "none";
    const mission = el("div.hud-card.hud-mission",
      {},
      el("div.hud-mission__head", {}, el("span.hud-mission__pin", {}, "🎯"), el("span", {}, "Missão")),
      this.missionLabel,
      this.actionBtn
    );

    // ---- minimapa ----
    this.miniCanvas = el("canvas.hud-mini__canvas", { width: 168, height: 168 });
    const mini = el("div.hud-card.hud-mini", {}, this.miniCanvas, el("div.hud-mini__label", {}, "Mapa"));

    // ---- dica de controles ----
    const hint = el("div.hud-hint",
      {},
      el("span", {}, el("b.kbd", {}, "W"), el("b.kbd", {}, "A"), el("b.kbd", {}, "S"), el("b.kbd", {}, "D"), " andar"),
      el("span", {}, el("b.kbd", {}, "Mouse"), " câmera"),
      el("span", {}, el("b.kbd", {}, "Scroll"), " zoom"),
      el("span", {}, el("b.kbd", {}, "Esc"), " menu")
    );

    this.root = el("div.hud",
      {},
      el("div.hud-topleft", {}, playerCard),
      topRight,
      mission,
      mini,
      hint
    );
    parent.append(this.root);

    this._bind();
    this._refreshEconomy();
    this._drawMini();
    return this.root;
  }

  _bind() {
    this._subs.push(
      bus.on("mission:changed", (m) => this._onMission(m)),
      bus.on("economy:changed", () => this._refreshEconomy()),
      bus.on("mission:reward", (r) => {
        toast(`✅ ${r.label}  +${money(r.money)} · +${r.xp} XP`, 3200);
        this._pulse(this.moneyEl);
      }),
      bus.on("level:up", (lvl) => {
        toast(`⭐ Subiu para o nível ${lvl}!`, 3600);
        this.levelEl.textContent = `Nível ${lvl}`;
        this._pulse(this.levelEl);
      })
    );
  }

  _onMission(m) {
    this.missionLabel.textContent = m.label;
    this._targetPos = m.targetPos || null;
    if (m.showAction) {
      this.actionBtn.textContent = m.actionLabel || "Confirmar";
      this.actionBtn.style.display = "";
    } else {
      this.actionBtn.style.display = "none";
    }
  }

  _refreshEconomy() {
    const d = this.state.data;
    this.moneyEl.textContent = money(d.money);
    this.levelEl.textContent = `Nível ${d.level}`;
    const need = xpForNext(d.level);
    const pct = Math.max(0, Math.min(100, (d.xp / need) * 100));
    this.xpFill.style.width = pct + "%";
    this.xpText.textContent = `${d.xp} / ${need} XP`;
  }

  _pulse(node) {
    node.classList.remove("hud-pulse");
    void node.offsetWidth;
    node.classList.add("hud-pulse");
  }

  /** Chamado a cada frame pelo mundo. */
  update(dt, playerPos) {
    this._playerPos = playerPos;
    // relógio de jogo (2 min de jogo por segundo real)
    this.gameMinutes = (this.gameMinutes + dt * 60) % (24 * 60);
    const h = Math.floor(this.gameMinutes / 60);
    const m = Math.floor(this.gameMinutes % 60);
    this.clockEl.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

    this._miniAcc = (this._miniAcc || 0) + dt;
    if (this._miniAcc > 0.1) { this._miniAcc = 0; this._drawMini(); }
  }

  _drawMini() {
    const ctx = this.miniCanvas.getContext("2d");
    const S = 168, B = this.bounds;
    const toXY = (wx, wz) => [S / 2 + (wx / B) * (S / 2 - 12), S / 2 + (wz / B) * (S / 2 - 12)];

    ctx.clearRect(0, 0, S, S);
    // fundo grama
    ctx.fillStyle = "#8bc26a";
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2); ctx.fill();

    // ruas (cruz + anel)
    ctx.strokeStyle = "#cfc6ad"; ctx.lineWidth = 7;
    line(ctx, ...toXY(-B, 0), ...toXY(B, 0));
    line(ctx, ...toXY(0, -B), ...toXY(0, B));
    ctx.strokeRect(...toXY(-40, -40), (80 / B) * (S / 2 - 12), (80 / B) * (S / 2 - 12));

    // marcos
    for (const id in this.landmarks) {
      const lm = this.landmarks[id];
      const [x, y] = toXY(lm.pos.x, lm.pos.z);
      ctx.fillStyle = id === "praca" ? "#4f8a45" : "#7a6f5f";
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    }

    // alvo da missão
    if (this._targetPos) {
      const [x, y] = toXY(this._targetPos.x, this._targetPos.z);
      ctx.fillStyle = "#f4b942";
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#d16f45"; ctx.lineWidth = 2; ctx.stroke();
    }

    // jogador
    const [px, py] = toXY(this._playerPos.x, this._playerPos.z);
    ctx.fillStyle = "#d16f45";
    ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#fffdf8"; ctx.lineWidth = 2.5; ctx.stroke();

    // borda
    ctx.strokeStyle = "#fffdf8"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2); ctx.stroke();
  }

  dispose() {
    this._subs.forEach((off) => off());
    this.root?.remove();
  }
}

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
