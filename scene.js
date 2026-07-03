/* ============================================================
   scene.js — Cena 3D de fundo do menu (Three.js / WebGL)
   Um skyline estilizado de cidade brasileira ao entardecer, com
   partículas e câmera flutuante. Leve, apenas atmosférico.

   Na etapa 4 este arquivo evolui para o mundo jogável (a mesma
   estrutura de setup/loop/dispose é reaproveitada).
   ============================================================ */

import * as THREE from "three";

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
