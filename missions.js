/* ============================================================
   missions.js — Sistema de missões  [ETAPA 4]
   Missões dependem da profissão escolhida. Ex. Caminhoneiro:
   1) Vá até a Transportadora  →  2) Aceitar Frete
   3) Ir até o destino         →  4) Entrega realizada (+XP +R$)

   Motor de missões declarativo, pronto para expandir. Neste MVP
   apenas expõe o catálogo/estrutura, sem execução.
   ============================================================ */

/** Cadeias de missões por profissão (dados declarativos). */
export const MISSION_CHAINS = Object.freeze({
  caminhoneiro: [
    { id: "ir-transportadora", label: "Vá até a Transportadora", target: "transportadora" },
    { id: "aceitar-frete",     label: "Aceitar Frete",           action: "accept" },
    { id: "ir-destino",        label: "Ir até o destino",        target: "destino" },
    { id: "entrega",           label: "Entrega realizada",       reward: { money: 850, xp: 60 } },
  ],
  // TODO Etapa 4: cadeias das demais profissões.
});

export class MissionEngine {
  constructor(bus) {
    this.bus = bus;
    this.chain = [];
    this.index = 0;
  }

  /** Inicia a cadeia de missões da profissão — implementado na Etapa 4. */
  start(/* jobId */) {}

  /** Avança para o próximo passo — implementado na Etapa 4. */
  advance() {}
}
