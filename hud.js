/* ============================================================
   hud.js — Interface de jogo (HUD)  [ETAPA 4]
   Mostrará: nome, profissão, nível, dinheiro, XP, missão atual,
   relógio e minimapa. Reage a eventos do EventBus (bus).

   Neste MVP apenas expõe a interface e reserva os pontos de
   integração para a economia (dinheiro/xp/nível).
   ============================================================ */

import { bus } from "./ui.js";

export class HUD {
  constructor(state) {
    this.state = state; // { name, job, level, money, xp, mission }
    this.root = null;
  }

  /** Renderiza o HUD sobre a cena — implementado na Etapa 4. */
  mount(/* parent */) {
    // TODO Etapa 4: painéis de vidro com nome/profissão/nível,
    // barra de XP animada, carteira, relógio e minimapa falso.
    bus.on("economy:changed", () => this.refresh());
  }

  refresh() {
    /* TODO Etapa 4: atualizar valores exibidos. */
  }
}
