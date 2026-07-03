/* ============================================================
   world.js — Tela do Mundo 3D  [ETAPA 4]  · tema Ghibli
   Orquestra a cena: céu, luz de sol, cidade, jogador, câmera de
   terceira pessoa, HUD e missões. Entrada por WASD + mouse.
   ============================================================ */

import * as THREE from "three";
import { SCREENS } from "./config.js";
import { GameState } from "./state.js";
import { screens, toast } from "./ui.js";
import { buildCity } from "./city.js";
import { Player } from "./player.js";
import { ThirdPersonCamera } from "./camera.js";
import { HUD } from "./hud.js";
import { MissionEngine } from "./missions.js";

export function WorldScreen() {
  let ctx = null;

  return {
    mount() {
      const canvas = document.createElement("canvas");
      canvas.className = "world-canvas";

      const root = document.createElement("div");
      root.className = "screen--center theme-ghibli world-screen";
      root.append(canvas);

      // inicializa após entrar no DOM (para ter tamanho correto)
      queueMicrotask(() => {
        try {
          ctx = new World(canvas, root);
        } catch (e) {
          console.error("[world] falha ao iniciar o mundo 3D", e);
          toast("Não foi possível iniciar o mundo 3D neste dispositivo.", 4000);
        }
      });

      return root;
    },

    unmount() {
      ctx?.dispose();
      ctx = null;
    },
  };
}

class World {
  constructor(canvas, root) {
    this.canvas = canvas;
    this.root = root;
    this.clock = new THREE.Clock();
    this.keys = new Set();
    this._raf = null;

    this._initRenderer();
    this._initScene();
    this._initCity();
    this._initPlayer();
    this._initCamera();
    this._initHUD();
    this._initMissions();
    this._bindInput();

    this._onResize = this._resize.bind(this);
    window.addEventListener("resize", this._onResize);
    this._resize();
    this._loop();

    // acesso para depuração no console
    window.__world = this;
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xbfe4f2);
    this.scene.fog = new THREE.Fog(0xd8ecf2, 90, 220);

    this.camera = new THREE.PerspectiveCamera(58, 1, 0.1, 600);
    this.camera.position.set(0, 12, 24);

    // luz ambiente (céu quente, chão verde)
    this.scene.add(new THREE.HemisphereLight(0xfff2d6, 0x6a8f5a, 1.0));

    // sol
    const sun = new THREE.DirectionalLight(0xfff0cf, 2.1);
    sun.position.set(60, 90, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 260;
    const s = 110;
    sun.shadow.camera.left = -s; sun.shadow.camera.right = s;
    sun.shadow.camera.top = s; sun.shadow.camera.bottom = -s;
    sun.shadow.bias = -0.0004;
    sun.shadow.radius = 4;
    this.scene.add(sun);

    this._sky();
  }

  _sky() {
    // colinas distantes (silhueta do horizonte)
    const hillMat = new THREE.MeshToonMaterial({ color: 0x9ac48a });
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(46 + Math.random() * 20, 22 + Math.random() * 10, 16), hillMat);
      cone.position.set(Math.cos(ang) * 165, 4, Math.sin(ang) * 165);
      this.scene.add(cone);
    }
    // nuvens fofas
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xfffdf8 });
    for (let i = 0; i < 8; i++) {
      const cloud = new THREE.Group();
      for (let j = 0; j < 4; j++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(5 + Math.random() * 4, 10, 10), cloudMat);
        puff.position.set(j * 6 - 9 + Math.random() * 2, Math.random() * 2, Math.random() * 3);
        puff.scale.y = 0.6;
        cloud.add(puff);
      }
      cloud.position.set((Math.random() - 0.5) * 260, 60 + Math.random() * 30, (Math.random() - 0.5) * 260);
      this.scene.add(cloud);
    }
  }

  _initCity() {
    this.city = buildCity(this.scene);
  }

  _initPlayer() {
    this.player = new Player(this.scene, GameState.data.character || {});
    this.player.bounds = this.city.bounds;
    this.player.spawn(0, 12, 0); // na avenida central, olhando para a praça
  }

  _initCamera() {
    this.tpc = new ThirdPersonCamera(this.camera, this.player.root);
    this.tpc.attachControls(this.canvas);
    this._fwd = new THREE.Vector3();
    this._right = new THREE.Vector3();
    this._inputVec = new THREE.Vector3();
  }

  _initHUD() {
    this.hud = new HUD({
      state: GameState,
      landmarks: this.city.landmarks,
      bounds: this.city.bounds,
      onAction: () => this.missions?.confirmAction(),
    });
    this.hud.mount(this.root);
  }

  _initMissions() {
    this.missions = new MissionEngine(this.scene, this.city.landmarks);
    this.missions.start(GameState.data.job || "caminhoneiro");
  }

  _bindInput() {
    this._onKeyDown = (e) => {
      if (e.code === "Escape") { this._leave(); return; }
      this.keys.add(e.code);
    };
    this._onKeyUp = (e) => this.keys.delete(e.code);
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);

    // clicar no mundo trava o ponteiro para olhar com o mouse
    this._onClick = () => {
      if (document.pointerLockElement !== this.canvas) this.canvas.requestPointerLock?.();
    };
    this.canvas.addEventListener("click", this._onClick);
  }

  _leave() {
    if (document.pointerLockElement) document.exitPointerLock?.();
    screens.show(SCREENS.MENU);
  }

  _inputVector(out) {
    const f = this.tpc.getForwardOnGround(this._fwd);
    const r = this.tpc.getRightOnGround(this._right);
    const inZ = (this.keys.has("KeyW") ? 1 : 0) - (this.keys.has("KeyS") ? 1 : 0);
    const inX = (this.keys.has("KeyD") ? 1 : 0) - (this.keys.has("KeyA") ? 1 : 0);
    out.set(0, 0, 0);
    out.addScaledVector(f, inZ).addScaledVector(r, inX);
    return out;
  }

  _loop() {
    const dt = Math.min(this.clock.getDelta(), 0.05);

    const input = this._inputVector(this._inputVec);
    this.player.update(dt, { x: input.x, z: input.z });
    this.tpc.update(dt);
    this.missions.update(dt, this.player.root.position);
    this.city.update(dt);
    this.hud.update(dt, this.player.root.position);

    this.renderer.render(this.scene, this.camera);
    this._raf = requestAnimationFrame(() => this._loop());
  }

  _resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    cancelAnimationFrame(this._raf);
    window.removeEventListener("resize", this._onResize);
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
    this.canvas.removeEventListener("click", this._onClick);
    if (document.pointerLockElement) document.exitPointerLock?.();
    this.tpc?.dispose();
    this.hud?.dispose();
    this.missions?.dispose();
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    });
    this.renderer.dispose();
  }
}
