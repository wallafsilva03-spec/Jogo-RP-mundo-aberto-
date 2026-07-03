/* ============================================================
   missions.js — Sistema de missões  [ETAPA 4]
   Motor declarativo por profissão. Ex. Caminhoneiro:
   1) Vá até a Transportadora → 2) Aceitar Frete →
   3) Leve a carga ao Destino → 4) Entrega realizada (+XP +R$)
   Loop infinito de tarefas. Emite eventos no EventBus para a HUD.
   ============================================================ */

import * as THREE from "three";
import { bus } from "./ui.js";
import { GameState } from "./state.js";

/* Configuração de missão por profissão: local de trabalho, destino,
   verbos e recompensa. Caminhoneiro tem o texto detalhado do pedido. */
const JOB_MISSIONS = {
  caminhoneiro: {
    pickup: "transportadora", dropoff: "destino",
    goPickup: "Vá até a Transportadora",
    accept: "Aceitar Frete",
    goDropoff: "Leve a carga até o Destino",
    done: "Entrega realizada!",
    reward: { money: 850, xp: 60 },
  },
  agricultor: {
    pickup: "fazenda", dropoff: "mercado",
    goPickup: "Vá até a Fazenda",
    accept: "Colher a produção",
    goDropoff: "Entregue no Mercado",
    done: "Colheita vendida!",
    reward: { money: 620, xp: 50 },
  },
  motoboy: {
    pickup: "mercado", dropoff: "destino",
    goPickup: "Vá até o Mercado",
    accept: "Pegar entrega",
    goDropoff: "Entregue no endereço",
    done: "Entrega concluída!",
    reward: { money: 380, xp: 40 },
  },
  "motorista-app": {
    pickup: "praca", dropoff: "banco",
    goPickup: "Vá até a Praça buscar o passageiro",
    accept: "Iniciar corrida",
    goDropoff: "Leve o passageiro ao Banco",
    done: "Corrida finalizada!",
    reward: { money: 320, xp: 35 },
  },
  comerciante: {
    pickup: "mercado", dropoff: "banco",
    goPickup: "Vá até o Mercado repor estoque",
    accept: "Comprar mercadorias",
    goDropoff: "Deposite o lucro no Banco",
    done: "Lucro registrado!",
    reward: { money: 900, xp: 65 },
  },
  servente: {
    pickup: "obra", dropoff: "prefeitura",
    goPickup: "Vá até a Obra",
    accept: "Iniciar expediente",
    goDropoff: "Leve os documentos à Prefeitura",
    done: "Diária concluída!",
    reward: { money: 300, xp: 45 },
  },
};

const RADIUS = 6; // distância para "chegar" a um marco

export class MissionEngine {
  constructor(scene, landmarks) {
    this.scene = scene;
    this.landmarks = landmarks;
    this.steps = [];
    this.index = 0;
    this.targetPos = null;
    this._rewardTimer = null;

    this.beacon = makeBeacon();
    this.beacon.visible = false;
    scene.add(this.beacon);
  }

  start(jobId) {
    const cfg = JOB_MISSIONS[jobId] || JOB_MISSIONS.caminhoneiro;
    this.cfg = cfg;
    this.steps = [
      { type: "goto", label: cfg.goPickup, targetId: cfg.pickup },
      { type: "action", label: `Chegou! ${cfg.accept}.`, actionLabel: cfg.accept },
      { type: "goto", label: cfg.goDropoff, targetId: cfg.dropoff },
      { type: "reward", label: cfg.done, reward: cfg.reward },
    ];
    this.index = 0;
    this._enter();
  }

  _enter() {
    const step = this.steps[this.index];
    if (!step) return;

    if (step.type === "goto") {
      const lm = this.landmarks[step.targetId];
      this.targetPos = lm ? lm.pos.clone() : null;
      if (this.targetPos) {
        this.beacon.position.set(this.targetPos.x, 0, this.targetPos.z);
        this.beacon.visible = true;
      }
      this._emit({ showAction: false, targetName: lm?.name });
    } else if (step.type === "action") {
      this.beacon.visible = false;
      this.targetPos = null;
      this._emit({ showAction: true, actionLabel: step.actionLabel });
    } else if (step.type === "reward") {
      this.beacon.visible = false;
      this.targetPos = null;
      GameState.addReward(step.reward);
      this._emit({ showAction: false });
      bus.emit("mission:reward", { ...step.reward, label: step.label });
      // após breve pausa, recomeça um novo pedido (loop infinito)
      clearTimeout(this._rewardTimer);
      this._rewardTimer = setTimeout(() => { this.index = 0; this._enter(); }, 2200);
    }
  }

  _emit(extra = {}) {
    const step = this.steps[this.index];
    bus.emit("mission:changed", {
      index: this.index,
      total: this.steps.length,
      label: step.label,
      targetPos: this.targetPos,
      ...extra,
    });
  }

  /** Chamado pelo botão da HUD (ex.: "Aceitar Frete"). */
  confirmAction() {
    if (this.steps[this.index]?.type === "action") this._advance();
  }

  _advance() {
    this.index += 1;
    if (this.index >= this.steps.length) this.index = 0;
    this._enter();
  }

  update(dt, playerPos) {
    // anima o beacon
    if (this.beacon.visible) {
      this.beacon.rotation.y += dt * 1.4;
      this.beacon.children[1].position.y = 4 + Math.sin(performance.now() * 0.004) * 0.5;
    }
    // checa chegada
    const step = this.steps[this.index];
    if (step?.type === "goto" && this.targetPos) {
      const dx = playerPos.x - this.targetPos.x;
      const dz = playerPos.z - this.targetPos.z;
      if (Math.hypot(dx, dz) < RADIUS) this._advance();
    }
  }

  dispose() {
    clearTimeout(this._rewardTimer);
    this.scene.remove(this.beacon);
  }
}

/* Marcador luminoso (pilar + seta flutuante) no destino da missão. */
function makeBeacon() {
  const g = new THREE.Group();
  const noOutline = (m) => { m.userData.outlineParameters = { visible: false }; return m; };

  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.1, 30, 20, 1, true),
    noOutline(new THREE.MeshBasicMaterial({ color: 0xffd15a, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }))
  );
  pillar.position.y = 15;
  g.add(pillar);

  const arrow = new THREE.Mesh(
    new THREE.ConeGeometry(1.3, 2.4, 4),
    noOutline(new THREE.MeshBasicMaterial({ color: 0xf4b942 }))
  );
  arrow.rotation.x = Math.PI;
  arrow.position.y = 4;
  g.add(arrow);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.2, 0.18, 12, 32),
    noOutline(new THREE.MeshBasicMaterial({ color: 0xf4b942 }))
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.3;
  g.add(ring);

  return g;
}
