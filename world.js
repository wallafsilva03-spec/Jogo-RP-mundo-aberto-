/* ============================================================
   world.js — Tela do Mundo 3D  [ETAPA 4]  · tema Ghibli
   Orquestra a cena: céu, luz de sol, cidade, jogador, câmera de
   terceira pessoa, HUD e missões. Entrada por WASD + mouse.
   ============================================================ */

import * as THREE from "three";
import { OutlineEffect } from "three/addons/effects/OutlineEffect.js";
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
    // tom de filme: cores quentes e suaves, como fotografia de animação
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;

    // contorno de tinta em toda a cena — o traço clássico de anime
    this.outline = new OutlineEffect(this.renderer, {
      defaultThickness: 0.004,
      defaultColor: [0.16, 0.12, 0.09], // marrom-tinta quente, não preto duro
      defaultAlpha: 0.9,
    });
  }

  _initScene() {
    this.scene = new THREE.Scene();
    // névoa quente de aquarela no horizonte (esconde a borda do mundo)
    this.scene.fog = new THREE.Fog(0xeadfc0, 95, 235);

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
    // ---- Cúpula de céu em gradiente (aquarela): azul → creme no horizonte ----
    const skyGeo = new THREE.SphereGeometry(480, 32, 20);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x5fa8dc) },     // azul céu
        midColor: { value: new THREE.Color(0xa8d8ea) },     // azul claro
        horizonColor: { value: new THREE.Color(0xfbeecb) }, // creme quente
      },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 horizonColor;
        varying vec3 vDir;
        void main() {
          float h = clamp(vDir.y, 0.0, 1.0);
          vec3 col = mix(horizonColor, midColor, smoothstep(0.0, 0.25, h));
          col = mix(col, topColor, smoothstep(0.25, 0.75, h));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    // o céu não recebe contorno de tinta
    skyMat.userData.outlineParameters = { visible: false };
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);

    // ---- Sol com halo suave (sprite) ----
    const sunCanvas = document.createElement("canvas");
    sunCanvas.width = sunCanvas.height = 256;
    const sctx = sunCanvas.getContext("2d");
    const grad = sctx.createRadialGradient(128, 128, 8, 128, 128, 128);
    grad.addColorStop(0, "rgba(255,252,235,1)");
    grad.addColorStop(0.22, "rgba(255,240,190,0.95)");
    grad.addColorStop(0.5, "rgba(255,225,150,0.35)");
    grad.addColorStop(1, "rgba(255,225,150,0)");
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 256, 256);
    const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(sunCanvas), transparent: true, depthWrite: false, fog: false,
    }));
    sunSprite.scale.setScalar(140);
    sunSprite.position.set(210, 190, 130);
    this.scene.add(sunSprite);

    // ---- Colinas distantes (camadas, como cenário pintado) ----
    const hillTones = [0x9ac48a, 0x86b678, 0xa8cf96];
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const hill = new THREE.Mesh(
        new THREE.SphereGeometry(50 + Math.random() * 26, 16, 12),
        new THREE.MeshToonMaterial({ color: hillTones[i % 3] })
      );
      hill.scale.y = 0.42 + Math.random() * 0.18;
      hill.position.set(Math.cos(ang) * 175, -6, Math.sin(ang) * 175);
      this.scene.add(hill);
    }

    // ---- Nuvens fofas, achatadas como em pintura ----
    const cloudMat = new THREE.MeshToonMaterial({ color: 0xfffdf8, fog: false });
    this._clouds = [];
    for (let i = 0; i < 10; i++) {
      const cloud = new THREE.Group();
      const puffs = 4 + Math.floor(Math.random() * 3);
      for (let j = 0; j < puffs; j++) {
        const r = 6 + Math.random() * 5;
        const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), cloudMat);
        puff.position.set(j * 7 - (puffs * 3.5) + Math.random() * 3, Math.random() * 2.5, Math.random() * 4);
        puff.scale.y = 0.52;
        cloud.add(puff);
      }
      cloud.position.set((Math.random() - 0.5) * 320, 62 + Math.random() * 34, (Math.random() - 0.5) * 320);
      cloud.userData.speed = 1.2 + Math.random() * 1.6;
      this._clouds.push(cloud);
      this.scene.add(cloud);
    }

    // ---- Pétalas/folhas dançando ao vento (o toque Ghibli) ----
    const petalCount = 220;
    const pos = new Float32Array(petalCount * 3);
    this._petalSeed = new Float32Array(petalCount * 2);
    for (let i = 0; i < petalCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 150;
      pos[i * 3 + 1] = 1 + Math.random() * 16;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 150;
      this._petalSeed[i * 2] = Math.random() * 100;
      this._petalSeed[i * 2 + 1] = 0.5 + Math.random();
    }
    const petalGeo = new THREE.BufferGeometry();
    petalGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const petalCanvas = document.createElement("canvas");
    petalCanvas.width = petalCanvas.height = 32;
    const pctx = petalCanvas.getContext("2d");
    pctx.fillStyle = "#ffe9f0";
    pctx.beginPath();
    pctx.ellipse(16, 16, 10, 6, 0.6, 0, Math.PI * 2);
    pctx.fill();
    this.petals = new THREE.Points(petalGeo, new THREE.PointsMaterial({
      map: new THREE.CanvasTexture(petalCanvas),
      size: 0.55, transparent: true, opacity: 0.85, depthWrite: false,
      color: 0xffd7e2,
    }));
    this.scene.add(this.petals);
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
    this._ambient(dt);

    // renderiza com contorno de tinta (visual de anime)
    this.outline.render(this.scene, this.camera);
    this._raf = requestAnimationFrame(() => this._loop());
  }

  /** Vida ambiente: nuvens navegando e pétalas dançando no vento. */
  _ambient(dt) {
    const t = performance.now() * 0.001;

    for (const cloud of this._clouds || []) {
      cloud.position.x += cloud.userData.speed * dt;
      if (cloud.position.x > 200) cloud.position.x = -200;
    }

    if (this.petals) {
      const pos = this.petals.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const s = this._petalSeed[i * 2];
        const sp = this._petalSeed[i * 2 + 1];
        let x = pos.getX(i) + (1.6 + Math.sin(t * 0.5 + s) * 0.8) * sp * dt;
        let y = pos.getY(i) + Math.sin(t * 1.4 + s) * 0.55 * dt - 0.22 * sp * dt;
        const z = pos.getZ(i) + Math.cos(t * 0.7 + s) * 0.9 * dt;
        if (x > 80) x = -80;
        if (y < 0.4) y = 14 + Math.random() * 5;
        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
    }
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
