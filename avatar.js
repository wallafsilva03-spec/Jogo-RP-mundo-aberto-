/* ============================================================
   avatar.js — Fábrica de avatar 3D (Three.js) · estilo Ghibli
   Humanoide estilizado com CEL-SHADING (MeshToonMaterial) e
   CONTORNO desenhado, dando o aspecto de anime/desenho à mão.
   O mesmo avatar é reutilizado pelo personagem jogável (Etapa 4).

   Exporta buildAvatar(appearance) -> { group, apply(appearance) }
   ============================================================ */

import * as THREE from "three";
import { SKIN_TONES, OUTFIT_COLORS } from "./config.js";

// Reexporta as paletas (definidas em config.js, sem dependência do Three.js)
export { SKIN_TONES, OUTFIT_COLORS };

const PANTS = "#6d5a7a";   // roxo-acinzentado suave
const SHOES = "#7a5544";   // marrom quente
const HAIR = "#4a3524";    // castanho
const OUTLINE = "#2b2119"; // contorno "tinta"

/* Gradiente de tons para o cel-shading (bandas suaves). */
let _gradientMap = null;
function gradientMap() {
  if (_gradientMap) return _gradientMap;
  const colors = new Uint8Array([90, 160, 220, 255]); // 4 bandas
  const tex = new THREE.DataTexture(colors, colors.length, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  _gradientMap = tex;
  return tex;
}

function toon(color) {
  return new THREE.MeshToonMaterial({
    color: new THREE.Color(color),
    gradientMap: gradientMap(),
  });
}

/**
 * Constrói o grupo do avatar.
 * @param {{sex?:string, skin?:string, outfit?:string}} appearance
 */
export function buildAvatar(appearance = {}) {
  const a = {
    sex: appearance.sex ?? "m",
    skin: appearance.skin ?? SKIN_TONES[2],
    outfit: appearance.outfit ?? OUTFIT_COLORS[0],
  };
  const female = a.sex === "f";

  const group = new THREE.Group();
  const outlineMat = new THREE.MeshBasicMaterial({ color: OUTLINE, side: THREE.BackSide });

  // Materiais compartilhados (guardados para troca de cor em tempo real)
  const skinMat = toon(a.skin);
  const outfitMat = toon(a.outfit);
  const pantsMat = toon(PANTS);
  const shoesMat = toon(SHOES);
  const hairMat = toon(HAIR);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x2b2119 });
  const blushMat = new THREE.MeshBasicMaterial({ color: 0xe8896b, transparent: true, opacity: 0.5 });

  // Adiciona um mesh + seu contorno (clone maior em BackSide)
  const add = (geo, material, x, y, z, { outline = true, grow = 0.03 } = {}) => {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);

    if (outline) {
      const o = new THREE.Mesh(geo, outlineMat);
      o.position.set(x, y, z);
      const s = geo.parameters;
      // escala levemente maior para formar a "linha de tinta"
      o.scale.set(
        1 + (grow * 2) / (s.width || 0.3),
        1 + (grow * 2) / (s.height || 0.3),
        1 + (grow * 2) / (s.depth || 0.3)
      );
      group.add(o);
    }
    return m;
  };

  const shoulder = female ? 0.62 : 0.74;
  const hip = female ? 0.30 : 0.26;

  // ----- Pernas -----
  add(new THREE.BoxGeometry(0.26, 0.85, 0.26), pantsMat, -hip, 0.42, 0);
  add(new THREE.BoxGeometry(0.26, 0.85, 0.26), pantsMat, hip, 0.42, 0);
  // Sapatos
  add(new THREE.BoxGeometry(0.30, 0.18, 0.42), shoesMat, -hip, 0.07, 0.06);
  add(new THREE.BoxGeometry(0.30, 0.18, 0.42), shoesMat, hip, 0.07, 0.06);

  // ----- Tronco (roupa) -----
  const torsoH = female ? 0.92 : 0.98;
  add(new THREE.BoxGeometry(shoulder, torsoH, 0.34), outfitMat, 0, 0.86 + torsoH / 2 - 0.4, 0);

  // ----- Braços (manga da roupa + mão de pele) -----
  const armX = shoulder / 2 + 0.11;
  const armTopY = 1.28;
  [-armX, armX].forEach((x) => {
    add(new THREE.BoxGeometry(0.18, 0.5, 0.18), outfitMat, x, armTopY, 0);       // manga
    add(new THREE.BoxGeometry(0.16, 0.34, 0.16), skinMat, x, armTopY - 0.42, 0); // antebraço/mão
  });

  // ----- Pescoço + Cabeça (cabeça maior, fofa) -----
  add(new THREE.BoxGeometry(0.16, 0.14, 0.16), skinMat, 0, 1.60, 0);
  const head = add(new THREE.BoxGeometry(0.48, 0.50, 0.46), skinMat, 0, 1.90, 0);

  // Olhos grandes (estilo anime) + brilho
  add(new THREE.BoxGeometry(0.09, 0.11, 0.02), eyeMat, -0.11, 1.93, 0.235, { outline: false });
  add(new THREE.BoxGeometry(0.09, 0.11, 0.02), eyeMat, 0.11, 1.93, 0.235, { outline: false });
  add(new THREE.BoxGeometry(0.03, 0.03, 0.02), new THREE.MeshBasicMaterial({ color: 0xffffff }), -0.13, 1.96, 0.246, { outline: false });
  add(new THREE.BoxGeometry(0.03, 0.03, 0.02), new THREE.MeshBasicMaterial({ color: 0xffffff }), 0.09, 1.96, 0.246, { outline: false });
  // Bochechas coradas
  add(new THREE.BoxGeometry(0.09, 0.05, 0.02), blushMat, -0.17, 1.85, 0.235, { outline: false });
  add(new THREE.BoxGeometry(0.09, 0.05, 0.02), blushMat, 0.17, 1.85, 0.235, { outline: false });

  // ----- Cabelo (comprimento varia por sexo) -----
  add(new THREE.BoxGeometry(0.54, 0.20, 0.52), hairMat, 0, 2.16, 0);        // topo
  add(new THREE.BoxGeometry(0.54, 0.16, 0.16), hairMat, 0, 2.02, -0.22);    // nuca
  if (female) {
    add(new THREE.BoxGeometry(0.56, 0.55, 0.16), hairMat, 0, 1.78, -0.24);  // cabelo longo
  }
  // Franja
  add(new THREE.BoxGeometry(0.50, 0.10, 0.06), hairMat, 0, 2.06, 0.235);

  group.userData.head = head;

  /** Troca as cores em tempo real (usado pelos swatches da UI). */
  function apply(next = {}) {
    if (next.skin) skinMat.color.set(next.skin);
    if (next.outfit) outfitMat.color.set(next.outfit);
    // Sexo altera geometria → reconstrói (feito pela UI).
  }

  return { group, apply, materials: { skinMat, outfitMat } };
}
