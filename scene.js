/* ============================================================
   scene.js — Cena 3D de fundo do menu (Three.js / WebGL)
   Um skyline estilizado de cidade brasileira ao entardecer, com
   partículas e câmera flutuante. Leve, apenas atmosférico.

   Na etapa 4 este arquivo evolui para o mundo jogável (a mesma
   estrutura de setup/loop/dispose é reaproveitada).
   ============================================================ */

import * as THREE from "three";
import { buildAvatar } from "./avatar.js";

/* ============================================================
   CharacterPreview — palco 3D para a criação de personagem
   (Etapa 2). Mostra o avatar num pedestal, girando, com luz de
   estúdio. Atualiza cor de pele/roupa em tempo real.
   ============================================================ */
export class CharacterPreview {
  constructor(canvas) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();
    this._raf = null;
    this._onResize = this.resize.bind(this);
    this._dragging = false;
    this._yaw = 0;
    this._autoRotate = true;
    this._init();
  }

  _init() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this._sizeToCanvas();
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    this.camera.position.set(0, 1.5, 5.2);
    this.camera.lookAt(0, 1.05, 0);

    this._addLights();
    this._addStage();

    this.pivot = new THREE.Group();
    this.scene.add(this.pivot);
    this.setAppearance({});

    this._bindDrag();
    window.addEventListener("resize", this._onResize);
    this._loop();
  }

  _addLights() {
    // céu quente em cima, verde reflexo do gramado embaixo
    this.scene.add(new THREE.HemisphereLight(0xfff2d6, 0x8bbf6a, 1.1));

    const sun = new THREE.DirectionalLight(0xfff0c9, 2.0);
    sun.position.set(3.5, 6, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 20;
    sun.shadow.radius = 6; // sombra macia
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0xbfe3ff, 0.8);
    fill.position.set(-4, 3, 2);
    this.scene.add(fill);
  }

  _addStage() {
    // Montinho de grama (campina Ghibli)
    const grass = new THREE.Mesh(
      new THREE.CylinderGeometry(1.7, 1.9, 0.5, 48),
      new THREE.MeshToonMaterial({ color: 0x7fb069 })
    );
    grass.position.y = -0.27;
    grass.receiveShadow = true;
    this.scene.add(grass);

    // Terra na base do montinho
    const soil = new THREE.Mesh(
      new THREE.CylinderGeometry(1.9, 2.0, 0.22, 48),
      new THREE.MeshToonMaterial({ color: 0x9c6b43 })
    );
    soil.position.y = -0.6;
    this.scene.add(soil);

    // Tufos de grama e florzinhas
    const tuft = new THREE.MeshToonMaterial({ color: 0x6a9955 });
    const flowers = [0xffd166, 0xef8fb0, 0xffffff];
    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * Math.PI * 2;
      const r = 1.25 + Math.random() * 0.35;
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r;
      if (i % 3 === 0) {
        const f = new THREE.Mesh(
          new THREE.SphereGeometry(0.06, 8, 8),
          new THREE.MeshToonMaterial({ color: flowers[i % flowers.length] })
        );
        f.position.set(x, 0.04, z);
        this.scene.add(f);
      } else {
        const g = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 5), tuft);
        g.position.set(x, 0.05, z);
        g.rotation.z = (Math.random() - 0.5) * 0.3;
        this.scene.add(g);
      }
    }
  }

  /** (Re)constrói o avatar com a aparência dada. */
  setAppearance(appearance) {
    this._appearance = { ...(this._appearance || {}), ...appearance };
    if (this.avatar) {
      this.pivot.remove(this.avatar.group);
      this.avatar.group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
      });
    }
    this.avatar = buildAvatar(this._appearance);
    this.pivot.add(this.avatar.group);
  }

  /** Troca só as cores (sem reconstruir a geometria). */
  applyColors(colors) {
    this._appearance = { ...(this._appearance || {}), ...colors };
    this.avatar?.apply(colors);
  }

  _bindDrag() {
    const c = this.canvas;
    const down = (x) => { this._dragging = true; this._lastX = x; this._autoRotate = false; };
    const move = (x) => {
      if (!this._dragging) return;
      this._yaw += (x - this._lastX) * 0.01;
      this._lastX = x;
    };
    const up = () => { this._dragging = false; };

    c.addEventListener("mousedown", (e) => down(e.clientX));
    window.addEventListener("mousemove", (e) => move(e.clientX));
    window.addEventListener("mouseup", up);
    c.addEventListener("touchstart", (e) => down(e.touches[0].clientX), { passive: true });
    c.addEventListener("touchmove", (e) => move(e.touches[0].clientX), { passive: true });
    c.addEventListener("touchend", up);
    this._dragHandlers = { move, up };
  }

  _loop() {
    const dt = this.clock.getDelta();
    if (this._autoRotate) this._yaw += dt * 0.5;
    if (this.pivot) this.pivot.rotation.y = this._yaw;
    this.renderer.render(this.scene, this.camera);
    this._raf = requestAnimationFrame(() => this._loop());
  }

  _sizeToCanvas() {
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    this.renderer.setSize(w, h, false);
    if (this.camera) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
  }

  resize() { this._sizeToCanvas(); }

  dispose() {
    cancelAnimationFrame(this._raf);
    window.removeEventListener("resize", this._onResize);
    if (this._dragHandlers) {
      window.removeEventListener("mousemove", this._dragHandlers.move);
      window.removeEventListener("mouseup", this._dragHandlers.up);
    }
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    });
    this.renderer.dispose();
  }
}

export class MenuScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();
    this._raf = null;
    this._onResize = this.resize.bind(this);
    this._init();
  }

  _init() {
    const { canvas } = this;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio = this.renderer.setPixelRatio.bind(this.renderer);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0e17, 0.028);

    this.camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      300
    );
    this.camera.position.set(0, 9, 34);
    this.camera.lookAt(0, 6, 0);

    this._addLights();
    this._buildCity();
    this._buildParticles();
    this._buildGround();

    window.addEventListener("resize", this._onResize);
    this._loop();
  }

  _addLights() {
    const hemi = new THREE.HemisphereLight(0x9fd8ff, 0x101422, 0.8);
    this.scene.add(hemi);

    // "sol" quente ao entardecer
    const sun = new THREE.DirectionalLight(0xffd28a, 1.4);
    sun.position.set(-18, 22, 14);
    this.scene.add(sun);

    // preenchimento verde suave (identidade da marca)
    const rim = new THREE.PointLight(0x10b981, 1.2, 120);
    rim.position.set(20, 10, -10);
    this.scene.add(rim);
  }

  _buildGround() {
    const geo = new THREE.PlaneGeometry(400, 400);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x070a12,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    this.scene.add(ground);
  }

  _buildCity() {
    this.city = new THREE.Group();

    const palette = [0x141b2a, 0x18202f, 0x0f1622, 0x1c2333];
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.6,
      roughness: 0.4,
    });

    const rows = 5;
    const cols = 26;
    for (let i = 0; i < cols; i++) {
      for (let r = 0; r < rows; r++) {
        if (Math.random() < 0.35 && r > 0) continue;

        const w = 1.6 + Math.random() * 1.2;
        const d = 1.6 + Math.random() * 1.2;
        const h = 3 + Math.random() * (r === 0 ? 20 : 8);

        const geo = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshStandardMaterial({
          color: palette[(i + r) % palette.length],
          roughness: 0.75,
          metalness: 0.25,
        });
        const building = new THREE.Mesh(geo, mat);

        const x = (i - cols / 2) * 2.4 + (Math.random() - 0.5);
        const z = -8 - r * 7 - Math.random() * 3;
        building.position.set(x, h / 2 - 0.5, z);
        this.city.add(building);

        // pequenas "janelas" luminosas em prédios altos
        if (h > 10 && Math.random() < 0.7) {
          const win = new THREE.Mesh(
            new THREE.PlaneGeometry(w * 0.5, h * 0.5),
            windowMat
          );
          win.position.set(x, h * 0.55 - 0.5, z + d / 2 + 0.01);
          this.city.add(win);
        }
      }
    }

    this.scene.add(this.city);
  }

  _buildParticles() {
    const count = 700;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = Math.random() * 45;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120 - 20;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x8fe3c4,
      size: 0.14,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  _loop() {
    const t = this.clock.getElapsedTime();

    // Câmera flutuante suave (parallax cinematográfico)
    this.camera.position.x = Math.sin(t * 0.15) * 5;
    this.camera.position.y = 9 + Math.sin(t * 0.22) * 0.8;
    this.camera.lookAt(0, 6, -10);

    if (this.city) this.city.rotation.y = Math.sin(t * 0.05) * 0.04;
    if (this.particles) {
      this.particles.rotation.y = t * 0.01;
      this.particles.position.y = Math.sin(t * 0.3) * 0.6;
    }

    this.renderer.render(this.scene, this.camera);
    this._raf = requestAnimationFrame(() => this._loop());
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  dispose() {
    cancelAnimationFrame(this._raf);
    window.removeEventListener("resize", this._onResize);
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => m.dispose());
      }
    });
    this.renderer.dispose();
  }
}
