/* ============================================================
   player.js — Personagem em terceira pessoa  [ETAPA 4]
   Preparado para: movimentação WASD, animação de caminhada e,
   futuramente, inventário / multiplayer (posição sincronizada).

   Neste MVP (Etapa 1) o módulo apenas expõe a interface.
   ============================================================ */

export class Player {
  constructor(appearance = {}) {
    // aparência definida na criação do personagem (Etapa 2)
    this.appearance = {
      name: appearance.name ?? "Jogador",
      sex: appearance.sex ?? "m",
      skin: appearance.skin ?? "#c9926b",
      outfit: appearance.outfit ?? "#10b981",
    };
    this.position = { x: 0, y: 0, z: 0 };
    this.speed = 6;
  }

  /** Constrói o mesh 3D do personagem (Three.js) — implementado na Etapa 4. */
  build(/* scene */) {
    /* TODO Etapa 4: corpo, cabeça, membros, animação de caminhada. */
  }

  /** Atualiza física/movimento por frame — implementado na Etapa 4. */
  update(/* dt, input */) {}
}
