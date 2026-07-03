/* ============================================================
   avatar.js — Fábrica de avatar 3D (Three.js)
   Monta um humanoide estilizado a partir da aparência escolhida
   na criação de personagem (Etapa 2). O mesmo avatar é reutilizado
   pelo personagem jogável em terceira pessoa (Etapa 4).

   Exporta buildAvatar(appearance) -> { group, apply(appearance) }
   ============================================================ */

import * as THREE from "three";
import { SKIN_TONES, OUTFIT_COLORS } from "./config.js";

// Reexporta as paletas (definidas em config.js, sem dependência do Three.js)
export { SKIN_TONES, OUTFIT_COLORS };

const PANTS = "#2b3346";
const SHOES = "#11151f";
const HAIR = "#241a12";

function mat(color, { rough = 0.7, metal = 0.05 } = {}) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: rough,
    metalness: metal,
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

  // Materiais compartilhados (guardados para troca de cor em tempo real)
  const skinMat = mat(a.skin);
  const outfitMat = mat(a.outfit, { rough: 0.55 });
  const pantsMat = mat(PANTS);
  const shoesMat = mat(SHOES, { rough: 0.4 });
  const hairMat = mat(HAIR, { rough: 0.9 });
  const eyeMat = mat("#15181f", { rough: 0.3 });

  const add = (geo, material, x, y, z) => {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  };

  const shoulder = female ? 0.62 : 0.74;
  const hip = female ? 0.30 : 0.26;

  // ----- Pernas -----
  add(new THREE.BoxGeometry(0.26, 0.85, 0.26), pantsMat, -hip, 0.42, 0);
  add(new THREE.BoxGeometry(0.26, 0.85, 0.26), pantsMat, hip, 0.42, 0);
  // Sapatos
  add(new THREE.BoxGeometry(0.30, 0.16, 0.40), shoesMat, -hip, 0.06, 0.06);
  add(new THREE.BoxGeometry(0.30, 0.16, 0.40), shoesMat, hip, 0.06, 0.06);

  // ----- Tronco (roupa) -----
  const torsoH = female ? 0.92 : 0.98;
  add(new THREE.BoxGeometry(shoulder, torsoH, 0.34), outfitMat, 0, 0.86 + torsoH / 2 - 0.4, 0);

  // ----- Braços (manga da roupa + mão de pele) -----
  const armX = shoulder / 2 + 0.11;
  const armTopY = 1.28;
  [-armX, armX].forEach((x) => {
    add(new THREE.BoxGeometry(0.18, 0.5, 0.18), outfitMat, x, armTopY, 0);   // manga
    add(new THREE.BoxGeometry(0.16, 0.34, 0.16), skinMat, x, armTopY - 0.42, 0); // antebraço/mão
  });

  // ----- Pescoço + Cabeça -----
  add(new THREE.BoxGeometry(0.16, 0.14, 0.16), skinMat, 0, 1.60, 0);
  const head = add(new THREE.BoxGeometry(0.42, 0.44, 0.40), skinMat, 0, 1.86, 0);

  // Olhos
  add(new THREE.BoxGeometry(0.07, 0.07, 0.02), eyeMat, -0.10, 1.90, 0.205);
  add(new THREE.BoxGeometry(0.07, 0.07, 0.02), eyeMat, 0.10, 1.90, 0.205);

  // ----- Cabelo (comprimento varia por sexo) -----
  add(new THREE.BoxGeometry(0.46, 0.16, 0.44), hairMat, 0, 2.08, 0); // topo
  if (female) {
    add(new THREE.BoxGeometry(0.46, 0.42, 0.14), hairMat, 0, 1.80, -0.20); // cabelo longo
  } else {
    add(new THREE.BoxGeometry(0.46, 0.14, 0.16), hairMat, 0, 1.94, -0.18); // nuca curta
  }

  group.userData.head = head;

  /** Troca as cores em tempo real (usado pelos swatches da UI). */
  function apply(next = {}) {
    if (next.skin) skinMat.color.set(next.skin);
    if (next.outfit) outfitMat.color.set(next.outfit);
    // Sexo altera geometria → recomenda-se reconstruir (feito pela UI).
  }

  return { group, apply, materials: { skinMat, outfitMat } };
}
