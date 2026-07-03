/* ============================================================
   camera.js — Câmera de terceira pessoa orbital  [ETAPA 4]
   Preparado para: seguir o personagem, controle por mouse,
   colisão suave e zoom. Neste MVP apenas expõe a interface.
   ============================================================ */

export class ThirdPersonCamera {
  constructor(camera, target) {
    this.camera = camera;
    this.target = target;
    this.distance = 8;
    this.height = 4;
    this.yaw = 0;
    this.pitch = 0.3;
  }

  /** Liga o controle por mouse — implementado na Etapa 4. */
  attachControls(/* domElement */) {}

  /** Atualiza a posição da câmera por frame — implementado na Etapa 4. */
  update(/* dt */) {}
}
