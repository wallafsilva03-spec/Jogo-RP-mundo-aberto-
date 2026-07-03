/* ============================================================
   camera.js — Câmera de terceira pessoa  [ETAPA 4]
   Orbita o jogador; o mouse controla o giro (yaw) e a inclinação
   (pitch). Segue o alvo com suavização. Também expõe a direção
   "para frente" no plano do chão, usada para mover o jogador
   relativo à câmera.
   ============================================================ */

import * as THREE from "three";

export class ThirdPersonCamera {
  constructor(camera, targetObject) {
    this.camera = camera;
    this.target = targetObject; // Object3D seguido (root do player)

    this.distance = 12.5;
    this.minDistance = 6;
    this.maxDistance = 22;
    this.height = 4.4;
    this.yaw = Math.PI;     // atrás do jogador
    this.pitch = 0.42;      // levemente de cima
    this.minPitch = 0.05;
    this.maxPitch = 1.15;

    this.sensitivity = 0.0032;
    this._pos = new THREE.Vector3();
    this._look = new THREE.Vector3();
    this._enabled = true;

    this._onMove = this._onMove.bind(this);
    this._onWheel = this._onWheel.bind(this);
  }

  attachControls(dom) {
    this.dom = dom;
    dom.addEventListener("mousemove", this._onMove);
    dom.addEventListener("wheel", this._onWheel, { passive: false });
    // arraste em telas de toque
    dom.addEventListener("touchmove", (e) => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        if (this._lastTouch) {
          this._applyLook(t.clientX - this._lastTouch.x, t.clientY - this._lastTouch.y);
        }
        this._lastTouch = { x: t.clientX, y: t.clientY };
      }
    }, { passive: true });
    dom.addEventListener("touchend", () => (this._lastTouch = null));
  }

  _onMove(e) {
    // Só orbita com o botão pressionado OU com pointer lock ativo
    const locked = document.pointerLockElement === this.dom;
    if (!locked && e.buttons !== 1) return;
    this._applyLook(e.movementX ?? 0, e.movementY ?? 0);
  }

  _applyLook(dx, dy) {
    this.yaw -= dx * this.sensitivity;
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch + dy * this.sensitivity));
  }

  _onWheel(e) {
    e.preventDefault();
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance + e.deltaY * 0.01));
  }

  /** Direção "para frente" da câmera projetada no chão (XZ). */
  getForwardOnGround(out = new THREE.Vector3()) {
    out.set(Math.sin(this.yaw + Math.PI), 0, Math.cos(this.yaw + Math.PI));
    return out.normalize();
  }
  getRightOnGround(out = new THREE.Vector3()) {
    const f = this.getForwardOnGround(out);
    return out.set(f.z, 0, -f.x);
  }

  update(dt) {
    const t = this.target.position;

    const horiz = Math.cos(this.pitch) * this.distance;
    const vert = Math.sin(this.pitch) * this.distance;

    const desired = this._pos.set(
      t.x + Math.sin(this.yaw) * horiz,
      t.y + this.height + vert,
      t.z + Math.cos(this.yaw) * horiz
    );

    // suavização (segue o alvo)
    const k = 1 - Math.pow(0.0001, dt);
    this.camera.position.lerp(desired, k);

    this._look.set(t.x, t.y + 2.2, t.z);
    this.camera.lookAt(this._look);
  }

  dispose() {
    if (!this.dom) return;
    this.dom.removeEventListener("mousemove", this._onMove);
    this.dom.removeEventListener("wheel", this._onWheel);
  }
}
