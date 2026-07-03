/* ============================================================
   city.js — Cidadezinha 3D estilo Ghibli  [ETAPA 4]
   Constrói ruas, calçadas, prédios com placas, praça com fonte,
   árvores, carros estacionados e NPCs que caminham. Devolve os
   marcos (landmarks) usados pelo sistema de missões.
   ============================================================ */

import * as THREE from "three";
import { buildAvatar, SKIN_TONES, OUTFIT_COLORS } from "./avatar.js";

const GRAD = (() => {
  const c = new Uint8Array([90, 160, 220, 255]);
  const t = new THREE.DataTexture(c, 4, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();
const toon = (color) => new THREE.MeshToonMaterial({ color: new THREE.Color(color), gradientMap: GRAD });

/* Catálogo de marcos: id, nome, posição [x,z], cores e tamanho. */
const BUILDINGS = [
  { id: "prefeitura",     name: "Prefeitura",     pos: [0, -56],  w: 22, h: 14, d: 16, color: "#e9d8b0", roof: "#8a5a3c", emoji: "🏛️" },
  { id: "praca",          name: "Praça",          pos: [0, 56],   plaza: true, emoji: "🌳" },
  { id: "banco",          name: "Banco",          pos: [22, 22],  w: 16, h: 12, d: 16, color: "#cfe3c0", roof: "#3f7d54", emoji: "🏦" },
  { id: "hospital",       name: "Hospital",       pos: [-22, 22], w: 18, h: 11, d: 16, color: "#f2f0e6", roof: "#d16f6f", emoji: "🏥" },
  { id: "mercado",        name: "Mercado",        pos: [22, -22], w: 18, h: 9,  d: 16, color: "#f6d9a0", roof: "#c98a3c", emoji: "🏪" },
  { id: "posto",          name: "Posto",          pos: [-22, -22],w: 14, h: 7,  d: 12, color: "#e7c9c0", roof: "#b5533f", emoji: "⛽" },
  { id: "oficina",        name: "Oficina",        pos: [56, 2],   w: 16, h: 9,  d: 14, color: "#d9cbb2", roof: "#5a6472", emoji: "🔧" },
  { id: "transportadora", name: "Transportadora", pos: [-56, 0],  w: 20, h: 11, d: 16, color: "#c9d6e3", roof: "#4a6b8a", emoji: "🚛" },
  { id: "obra",           name: "Obra",           pos: [40, -56], w: 14, h: 12, d: 14, color: "#e8cf9a", roof: "#a9843f", emoji: "👷", scaffold: true },
  { id: "fazenda",        name: "Fazenda",        pos: [-54, 46], w: 16, h: 8,  d: 14, color: "#e6b98a", roof: "#7a4b2b", emoji: "🚜" },
  { id: "destino",        name: "Destino",        pos: [56, 44],  w: 14, h: 9,  d: 14, color: "#dcd0e6", roof: "#6d5a7a", emoji: "📦" },
];

export function buildCity(scene) {
  const group = new THREE.Group();
  scene.add(group);

  const landmarks = {};
  const npcs = [];

  _ground(group);
  _roads(group);

  for (const b of BUILDINGS) {
    const pos = new THREE.Vector3(b.pos[0], 0, b.pos[1]);
    landmarks[b.id] = { id: b.id, name: b.name, emoji: b.emoji, pos };
    if (b.plaza) _plaza(group, pos);
    else group.add(_building(b, pos));
  }

  _scatterHouses(group, landmarks);
  _scatterTrees(group);
  _scatterFlowers(group);
  _parkedCars(group);
  _spawnNPCs(group, npcs);

  function update(dt) {
    for (const n of npcs) n.update(dt);
  }

  return { group, landmarks, update, bounds: 70 };
}

/* ---------------- Terreno ---------------- */
function _ground(group) {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), toon("#8bc26a"));
  g.rotation.x = -Math.PI / 2;
  g.receiveShadow = true;
  group.add(g);

  // manchas de grama mais escura (variação)
  for (let i = 0; i < 26; i++) {
    const r = 4 + Math.random() * 8;
    const patch = new THREE.Mesh(new THREE.CircleGeometry(r, 12), toon("#7db35c"));
    patch.rotation.x = -Math.PI / 2;
    patch.position.set((Math.random() - 0.5) * 220, 0.01, (Math.random() - 0.5) * 220);
    group.add(patch);
  }
}

/* ---------------- Ruas e calçadas ---------------- */
function _roadStrip(group, x, z, w, d) {
  // calçada (base clara, um pouco maior)
  const side = new THREE.Mesh(new THREE.BoxGeometry(w + 3, 0.16, d + 3), toon("#cfc6ad"));
  side.position.set(x, 0.08, z);
  side.receiveShadow = true;
  group.add(side);
  // asfalto (cinza quente, como estrada pintada à mão)
  const road = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), toon("#7d7568"));
  road.position.set(x, 0.11, z);
  road.receiveShadow = true;
  group.add(road);
  // faixa central tracejada
  const along = w > d ? "x" : "z";
  const len = Math.max(w, d);
  const count = Math.floor(len / 8);
  for (let i = 0; i < count; i++) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(along === "x" ? 2.4 : 0.4, 0.02, along === "x" ? 0.4 : 2.4), toon("#e8e2cf"));
    const off = -len / 2 + 4 + i * 8;
    dash.position.set(x + (along === "x" ? off : 0), 0.22, z + (along === "z" ? off : 0));
    group.add(dash);
  }
}
function _roads(group) {
  // avenidas centrais (cruz)
  _roadStrip(group, 0, 0, 150, 9);
  _roadStrip(group, 0, 0, 9, 150);
  // anel
  _roadStrip(group, 40, 0, 9, 100);
  _roadStrip(group, -40, 0, 9, 100);
  _roadStrip(group, 0, 40, 100, 9);
  _roadStrip(group, 0, -40, 100, 9);
}

/* ---------------- Prédios ---------------- */
function _building(b, pos) {
  const g = new THREE.Group();
  g.position.copy(pos);

  const body = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), toon(b.color));
  body.position.y = b.h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  // telhado (prisma)
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(b.w, b.d) * 0.72, b.h * 0.5, 4), toon(b.roof));
  roof.position.y = b.h + b.h * 0.25;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  g.add(roof);

  // janelas (fileiras)
  const winMat = new THREE.MeshToonMaterial({ color: 0xfff3c4, gradientMap: GRAD });
  const rows = Math.max(1, Math.floor(b.h / 4));
  const cols = Math.max(2, Math.floor(b.w / 4));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 0.1), winMat);
      const wx = -b.w / 2 + 2.4 + c * ((b.w - 4) / Math.max(1, cols - 1));
      win.position.set(wx, 3 + r * 3.6, b.d / 2 + 0.05);
      g.add(win);
    }
  }

  // porta
  const door = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 0.2), toon("#6b4a32"));
  door.position.set(0, 1.6, b.d / 2 + 0.06);
  g.add(door);

  if (b.scaffold) _scaffold(g, b);

  // placa flutuante
  const label = _label(`${b.emoji}  ${b.name}`);
  label.position.set(0, b.h + b.h * 0.5 + 3, 0);
  g.add(label);

  return g;
}

function _scaffold(g, b) {
  const mat = toon("#caa24a");
  for (let i = 0; i < 4; i++) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, b.h + 2, 0.3), mat);
    const sx = (i % 2 ? 1 : -1) * (b.w / 2 + 0.6);
    const sz = (i < 2 ? 1 : -1) * (b.d / 2 + 0.6);
    post.position.set(sx, (b.h + 2) / 2, sz);
    g.add(post);
  }
}

/* ---------------- Praça ---------------- */
function _plaza(group, pos) {
  const g = new THREE.Group();
  g.position.copy(pos);

  const floor = new THREE.Mesh(new THREE.CylinderGeometry(16, 16, 0.3, 40), toon("#e3d7b8"));
  floor.position.y = 0.15;
  floor.receiveShadow = true;
  g.add(floor);

  // fonte central
  const base = new THREE.Mesh(new THREE.CylinderGeometry(4, 4.5, 1, 24), toon("#b9c4cf"));
  base.position.y = 0.6;
  g.add(base);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.3, 24), toon("#7fc7e8"));
  water.position.y = 1.1;
  g.add(water);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 2.4, 12), toon("#b9c4cf"));
  spout.position.y = 2;
  g.add(spout);

  // árvores em volta
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    g.add(_tree(Math.cos(ang) * 12, Math.sin(ang) * 12));
  }

  const label = _label("🌳  Praça Central");
  label.position.set(0, 8, 0);
  g.add(label);

  group.add(g);
}

/* ---------------- Casas ---------------- */
function _scatterHouses(group, landmarks) {
  const colors = ["#f2c9a0", "#cfe0e8", "#e8c8d0", "#d8e6c0", "#f0e2b8"];
  const roofs = ["#b5533f", "#4a6b8a", "#8a5a3c", "#3f7d54", "#a9843f"];
  const spots = [
    [-30, 52], [-14, 50], [14, 50], [30, 50],
    [52, -30], [52, -14], [52, 18], [52, 30],
    [-52, -30], [-52, -14], [-52, 18], [-52, 30],
    [-30, -52], [-14, -52], [14, -52],
  ];
  spots.forEach(([x, z], i) => {
    const b = {
      w: 8 + (i % 3), h: 6 + (i % 2) * 2, d: 8,
      color: colors[i % colors.length], roof: roofs[i % roofs.length],
      emoji: "🏠", name: "", w2: 0,
    };
    const g = _building({ ...b }, new THREE.Vector3(x, 0, z));
    // casas não levam placa: remove o último filho (label)
    g.remove(g.children[g.children.length - 1]);
    group.add(g);
  });
}

/* ---------------- Árvores ---------------- */
function _tree(x, z, s = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35 * s, 0.55 * s, 2.6 * s, 8), toon("#8a6238"));
  trunk.position.y = 1.3 * s;
  trunk.castShadow = true;
  g.add(trunk);

  // copa pintada: camadas achatadas de verdes quentes, do escuro (baixo)
  // ao claro (topo), como folhagem iluminada pelo sol
  const tones = ["#4f8a45", "#63a352", "#78b863", "#8fca74"];
  const layers = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < layers; i++) {
    const f = i / (layers - 1);
    const r = (2.2 - f * 1.0) * s;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), toon(tones[Math.min(i, tones.length - 1)]));
    leaf.scale.y = 0.62;
    leaf.position.set(
      (Math.random() - 0.5) * 0.8 * s,
      (2.8 + f * 2.2) * s,
      (Math.random() - 0.5) * 0.8 * s
    );
    leaf.castShadow = true;
    g.add(leaf);
  }
  g.position.set(x, 0, z);
  g.rotation.y = Math.random() * Math.PI * 2;
  return g;
}
function _scatterTrees(group) {
  for (let i = 0; i < 40; i++) {
    let x = (Math.random() - 0.5) * 200;
    let z = (Math.random() - 0.5) * 200;
    // afasta das ruas centrais e do anel
    if (Math.abs(x) < 10 || Math.abs(z) < 10) continue;
    if (Math.abs(Math.abs(x) - 40) < 9 || Math.abs(Math.abs(z) - 40) < 9) continue;
    // mantém livre a área de nascimento do jogador
    if (x * x + (z - 12) * (z - 12) < 260) continue;
    group.add(_tree(x, z, 0.8 + Math.random() * 0.6));
  }
}

/* ---------------- Flores na grama ---------------- */
function _scatterFlowers(group) {
  const colors = ["#ffd166", "#ef8fb0", "#fffdf8", "#e88a5f", "#b78fe0"];
  const stemMat = toon("#5f9e4f");
  for (let c = 0; c < 22; c++) {
    // canteiros: grupinhos de 4-8 flores
    const cx = (Math.random() - 0.5) * 190;
    const cz = (Math.random() - 0.5) * 190;
    if (Math.abs(cx) < 9 || Math.abs(cz) < 9) continue;
    if (Math.abs(Math.abs(cx) - 40) < 8 || Math.abs(Math.abs(cz) - 40) < 8) continue;
    const n = 4 + Math.floor(Math.random() * 5);
    const color = colors[c % colors.length];
    for (let i = 0; i < n; i++) {
      const f = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.5, 5), stemMat);
      stem.position.y = 0.25;
      f.add(stem);
      const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), toon(color));
      bloom.position.y = 0.55;
      f.add(bloom);
      f.position.set(cx + (Math.random() - 0.5) * 3.2, 0, cz + (Math.random() - 0.5) * 3.2);
      group.add(f);
    }
  }
}

/* ---------------- Carros estacionados ---------------- */
function _car(x, z, rot, color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 5), toon(color));
  body.position.y = 1;
  body.castShadow = true;
  g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1, 2.6), toon("#cfe6f2"));
  cabin.position.set(0, 1.9, -0.2);
  g.add(cabin);
  for (const [wx, wz] of [[-1.2, 1.6], [1.2, 1.6], [-1.2, -1.6], [1.2, -1.6]]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 12), toon("#20242c"));
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.55, wz);
    g.add(wheel);
  }
  g.position.set(x, 0, z);
  g.rotation.y = rot;
  return g;
}
function _parkedCars(group) {
  const colors = ["#d15a5a", "#4a7bb5", "#e0b84a", "#5aa06a", "#9a6ab5", "#e08a4a"];
  const spots = [
    [6.5, 22, 0], [6.5, 30, 0], [-6.5, -18, 0], [-6.5, -26, 0],
    [22, 6.5, Math.PI / 2], [-30, 6.5, Math.PI / 2], [34, -6.5, Math.PI / 2], [-20, 6.5, Math.PI / 2],
  ];
  spots.forEach(([x, z, r], i) => group.add(_car(x, z, r, colors[i % colors.length])));
}

/* ---------------- NPCs ---------------- */
function _spawnNPCs(group, npcs) {
  const paths = [
    [[-60, 3.5], [60, 3.5]],
    [[3.5, -60], [3.5, 60]],
    [[-40, -30], [-40, 30]],
    [[40, -30], [40, 30]],
    [[-30, 40], [30, 40]],
    [[-30, -40], [30, -40]],
  ];
  paths.forEach((path, i) => {
    const skin = SKIN_TONES[i % SKIN_TONES.length];
    const outfit = OUTFIT_COLORS[(i * 2) % OUTFIT_COLORS.length];
    const built = buildAvatar({ sex: i % 2 ? "f" : "m", skin, outfit });
    built.group.scale.setScalar(0.92);
    const root = new THREE.Group();
    root.add(built.group);
    group.add(root);

    const a = new THREE.Vector3(path[0][0], 0, path[0][1]);
    const b = new THREE.Vector3(path[1][0], 0, path[1][1]);
    npcs.push(new NPC(root, a, b, 2 + Math.random() * 1.5));
  });
}

class NPC {
  constructor(root, a, b, speed) {
    this.root = root;
    this.a = a; this.b = b;
    this.speed = speed;
    this.t = Math.random();
    this.dir = 1;
    this.phase = Math.random() * 10;
    this._tmp = new THREE.Vector3();
    this.len = a.distanceTo(b);
    this._update();
  }
  _update() {
    this._tmp.copy(this.a).lerp(this.b, this.t);
    this.root.position.set(this._tmp.x, 0, this._tmp.z);
    const ang = this.dir > 0 ? Math.atan2(this.b.x - this.a.x, this.b.z - this.a.z)
                             : Math.atan2(this.a.x - this.b.x, this.a.z - this.b.z);
    this.root.rotation.y = ang;
  }
  update(dt) {
    this.t += (this.dir * this.speed * dt) / this.len;
    if (this.t >= 1) { this.t = 1; this.dir = -1; }
    if (this.t <= 0) { this.t = 0; this.dir = 1; }
    this.phase += dt * 10;
    this.root.children[0].position.y = Math.abs(Math.sin(this.phase)) * 0.1;
    this._update();
  }
}

/* ---------------- Placa (sprite de texto) ---------------- */
function _label(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext("2d");
  // fundo pílula creme
  const r = 40;
  ctx.fillStyle = "#fbf3df";
  roundRect(ctx, 8, 24, 496, 80, r);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#fffdf8";
  roundRect(ctx, 8, 24, 496, 80, r);
  ctx.stroke();
  ctx.fillStyle = "#4a3f33";
  ctx.font = "bold 46px Nunito, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 66);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true }));
  sprite.scale.set(11, 2.75, 1);
  return sprite;
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
