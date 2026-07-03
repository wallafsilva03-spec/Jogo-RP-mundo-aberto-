/* ============================================================
   player.js — Personagem jogável em terceira pessoa  [ETAPA 4]
   Movimentação WASD relativa à câmera, com animação de caminhada
   (balanço do corpo + passada) e rotação suave para a direção do
   movimento. Usa o avatar cel-shaded de avatar.js.
   ============================================================ */

import * as THREE from "three";
import { buildAvatar } from "./avatar.js";

export class Player {
  constructor(scene, appearance = {}) {
    this.scene = scene;
    this.appearance = appearance;

    const built = buildAvatar(appearance);
    this.avatar = built;

    // Grupo raiz do jogador (posição/rotação no mundo)
    this.root = new THREE.Group();
    // Sub-grupo do corpo (para o "quique" da caminhada sem afetar o y do chão)
    this.body = new THREE.Group();
    this.body.add(built.group);
    this.root.add(this.body);
    scene.add(this.root);

    this.position = this.root.position;
    this.velocity = new THREE.Vector3();
    this.speed = 9;
    this.heading = 0;         // direção atual (rad)
    this._walkPhase = 0;
    this.moving = false;
    this.bounds = 58;         // limite do mundo
  }

  spawn(x, z, heading = 0) {
    this.root.position.set(x, 0, z);
    this.heading = heading;
    this.root.rotation.y = heading;
  }

  /**
   * @param {number} dt
   * @param {{x:number, z:number}} input  vetor de entrada (-1..1) já
   *        relativo à câmera (world space, no plano XZ)
   */
  update(dt, input) {
    const len = Math.hypot(input.x, input.z);
    this.moving = len > 0.001;

    if (this.moving) {
      const nx = input.x / len;
      const nz = input.z / len;
      this.velocity.set(nx * this.speed, 0, nz * this.speed);

      this.root.position.x += this.velocity.x * dt;
      this.root.position.z += this.velocity.z * dt;

      // limites do mundo
      const b = this.bounds;
      this.root.position.x = Math.max(-b, Math.min(b, this.root.position.x));
      this.root.position.z = Math.max(-b, Math.min(b, this.root.position.z));

      // rotação suave para a direção do movimento
      const target = Math.atan2(nx, nz);
      this.heading = lerpAngle(this.heading, target, 1 - Math.pow(0.001, dt));
      this.root.rotation.y = this.heading;

      // animação de caminhada
      this._walkPhase += dt * 12;
      const bob = Math.abs(Math.sin(this._walkPhase)) * 0.12;
      this.body.position.y = bob;
      this.body.rotation.z = Math.sin(this._walkPhase) * 0.05;
    } else {
      // idle: volta suave ao repouso + leve respiração
      this._walkPhase += dt * 2;
      this.body.position.y += (0 - this.body.position.y) * (1 - Math.pow(0.01, dt));
      this.body.rotation.z += (0 - this.body.rotation.z) * (1 - Math.pow(0.01, dt));
      this.body.scale.y = 1 + Math.sin(this._walkPhase) * 0.006;
    }
  }

  dispose() {
    this.scene.remove(this.root);
    this.root.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
    });
  }
}

/* Interpola ângulos pelo caminho mais curto. */
function lerpAngle(a, b, t) {
  let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}
