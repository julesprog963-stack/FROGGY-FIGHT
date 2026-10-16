import * as THREE from 'three';
import { paintedTexture } from './ps2-art.js';

/**
 * Modelo 3D estilo PS2 (Jak & Daxter / Sly Cooper / Rareware) de PATO LEMUS,
 * inspirado satíricamente en el Gobernador de Jalisco:
 * - Cabello pelirrojo/cobrizo peinado de lado con tupé voluminoso
 * - Camisa blanca de vestir con mangas arremangadas
 * - Icónico chaleco naranja acolchado ("Al Estilo Jalisco / TALACORP") con escudo en el pecho
 * - Pantalón azul marino de vestir y tenis/calzado "fosfo-fosfo" naranja en sus patas palmípedas
 */
export function createPatoLemusModel(options = {}) {
  const lemus = new THREE.Group();

  // Materiales estilo PS2 con sombreado facetado y texturas pintadas
  const whiteFeatherMat = new THREE.MeshLambertMaterial({ color: 0xfafafa, flatShading: true });
  const shirtWhiteMat = new THREE.MeshLambertMaterial({ color: 0xf1f5f9, flatShading: true });
  const gingerHairMat = new THREE.MeshLambertMaterial({
    map: paintedTexture('ginger_hair'),
    color: 0xe67e22,
    flatShading: true
  });
  const gingerHighlightMat = new THREE.MeshLambertMaterial({ color: 0xf39c12, flatShading: true });
  const gingerBrowMat = new THREE.MeshLambertMaterial({ color: 0xb84200, flatShading: true });

  const orangeVestMat = new THREE.MeshLambertMaterial({
    map: paintedTexture('orange_vest'),
    color: 0xff6b00,
    flatShading: true
  });
  const fosfoOrangeMat = new THREE.MeshLambertMaterial({ color: 0xff5500, emissive: 0x331100, flatShading: true });
  const beakOrangeMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b, flatShading: true });
  const beakDarkMat = new THREE.MeshLambertMaterial({ color: 0xd97706, flatShading: true });
  const mouthDarkMat = new THREE.MeshBasicMaterial({ color: 0x5c1414 });
  const teethWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const tongueMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  const navyJeansMat = new THREE.MeshLambertMaterial({ color: 0x1e293b, flatShading: true });
  const beltLeatherMat = new THREE.MeshLambertMaterial({ color: 0x451a03, flatShading: true });
  const goldBadgeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const jaliscoBlueMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });

  const blackMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const irisBlueMat = new THREE.MeshBasicMaterial({ color: 0x1d4ed8 });
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const orangeLegMat = new THREE.MeshLambertMaterial({ color: 0xe67e22, flatShading: true });

  // ============================================================================
  // 1. CABEZA ESCULPIDA Y CABELLERA PELIRROJA / COBRIZA DE GOBERNADOR
  // ============================================================================
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 3.28, 0);
  headGroup.rotation.x = 0.10;

  // Cráneo de pato facetado PS2
  const skullGeo = new THREE.DodecahedronGeometry(0.92, 1);
  const skull = new THREE.Mesh(skullGeo, whiteFeatherMat);
  skull.scale.set(1.06, 1.14, 1.02);
  headGroup.add(skull);

  // Mejillas llenas y carismáticas
  [-0.50, 0.50].forEach((x, i) => {
    const cheek = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 1), whiteFeatherMat);
    cheek.position.set(x, -0.18, 0.24);
    cheek.scale.set(1.1, 0.85, 0.95);
    headGroup.add(cheek);
  });

  // Cabellera pelirroja característica peinada con raya de lado y tupé ejecutivo
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.96, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
    gingerHairMat
  );
  hairCap.position.set(0, 0.16, -0.05);
  hairCap.rotation.x = -0.18;
  hairCap.scale.set(1.04, 0.95, 1.05);
  headGroup.add(hairCap);

  // Patillas laterales pelirrojas (sideburns)
  [-0.86, 0.86].forEach((x) => {
    const sideburn = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.52, 0.36), gingerHairMat);
    sideburn.position.set(x, 0.12, 0.12);
    headGroup.add(sideburn);
  });

  // Tupé frontal elevado con onda hacia la derecha (estilo Pablo Lemus)
  const crestCenter = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.42, 0.78), gingerHairMat);
  crestCenter.position.set(0.08, 0.96, 0.28);
  crestCenter.rotation.set(-0.25, 0.15, -0.14);
  headGroup.add(crestCenter);

  const crestLeft = new THREE.Mesh(new THREE.ConeGeometry(0.36, 1.15, 5), gingerHighlightMat);
  crestLeft.position.set(-0.32, 1.04, 0.15);
  crestLeft.rotation.set(-0.65, 0.2, 0.45);
  headGroup.add(crestLeft);

  const crestRight = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.35, 5), gingerHairMat);
  crestRight.position.set(0.36, 1.08, 0.22);
  crestRight.rotation.set(-0.55, -0.25, -0.52);
  headGroup.add(crestRight);

  // ============================================================================
  // 2. OJOS AZULES EXPRESIVOS Y CEJAS PELIRROJAS ARQUEADAS
  // ============================================================================
  [-0.35, 0.35].forEach((x, i) => {
    const eyeGeo = new THREE.CylinderGeometry(0.31, 0.35, 0.16, 10);
    const eye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    eye.rotation.x = Math.PI / 2;
    eye.rotation.y = (i === 0) ? -0.14 : 0.14;
    eye.scale.set(1.0, 1.22, 1.0);
    eye.position.set(x, 0.36, 0.86);
    headGroup.add(eye);

    // Iris azul claro
    const iris = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.21, 0.09, 10), irisBlueMat);
    iris.rotation.x = Math.PI / 2;
    iris.position.set(x - 0.04, 0.34, 0.93);
    headGroup.add(iris);

    // Pupila negra
    const pupil = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.10, 8), blackMat);
    pupil.rotation.x = Math.PI / 2;
    pupil.position.set(x - 0.04, 0.34, 0.96);
    headGroup.add(pupil);

    // Brillo especular PS2
    const catchlight = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.05), eyeWhiteMat);
    catchlight.position.set(x - 0.08, 0.41, 1.01);
    headGroup.add(catchlight);

    // Ceja pelirroja espesa en gesto de político confiado
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.17, 0.26), gingerBrowMat);
    brow.position.set(x, 0.60, 0.89);
    brow.rotation.z = (i === 0) ? 0.35 : -0.42;
    brow.rotation.y = (i === 0) ? -0.16 : 0.16;
    headGroup.add(brow);
  });

  // ============================================================================
  // 3. PICO ANCHO CON SONRISA DE CAMPAÑA ELECTORAL
  // ============================================================================
  const beakGroup = new THREE.Group();
  beakGroup.position.set(0, -0.08, 0.78);

  const upperBillPlate = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.17, 0.72), beakOrangeMat);
  upperBillPlate.position.set(0, 0.05, 0.35);
  upperBillPlate.rotation.x = 0.20;
  beakGroup.add(upperBillPlate);

  const upperBillCurvedTip = new THREE.Mesh(new THREE.CylinderGeometry(0.60, 0.64, 0.15, 12), beakOrangeMat);
  upperBillCurvedTip.position.set(0, -0.03, 0.69);
  upperBillCurvedTip.rotation.x = 0.20;
  upperBillCurvedTip.scale.set(1.12, 1.0, 0.65);
  beakGroup.add(upperBillCurvedTip);

  // Sonrisa blanca brillante de comercial político
  const teethRow = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.10, 0.12), teethWhiteMat);
  teethRow.position.set(0, -0.03, 0.56);
  beakGroup.add(teethRow);

  // Comisuras laterales elevadas
  [-0.68, 0.68].forEach((x, i) => {
    const corner = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.45), beakDarkMat);
    corner.position.set(x, 0.03, 0.30);
    corner.rotation.z = (i === 0) ? -0.45 : 0.45;
    beakGroup.add(corner);
  });

  const mouthInterior = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.18, 0.55), mouthDarkMat);
  mouthInterior.position.set(0, -0.10, 0.35);
  beakGroup.add(mouthInterior);

  const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), tongueMat);
  tongue.scale.set(0.85, 0.30, 1.15);
  tongue.position.set(0, -0.08, 0.40);
  beakGroup.add(tongue);

  const lowerBill = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.12, 0.56), beakOrangeMat);
  lowerBill.position.set(0, -0.20, 0.32);
  lowerBill.rotation.x = -0.14;
  beakGroup.add(lowerBill);

  headGroup.add(beakGroup);
  lemus.add(headGroup);

  // ============================================================================
  // 4. CUELLO Y CAMISA BLANCA ABIERTA CON GAFETE / CORBATA NARANJA
  // ============================================================================
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.50, 0.60, 0.62, 8), whiteFeatherMat);
  neck.position.set(0, 2.66, 0.05);
  lemus.add(neck);

  // Cuello de camisa blanca abierta estilo ejecutivo de campaña
  [-0.28, 0.28].forEach((x, i) => {
    const collarFlap = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.50, 0.14), shirtWhiteMat);
    collarFlap.position.set(x, 2.48, 0.68);
    collarFlap.rotation.z = (i === 0) ? -0.42 : 0.42;
    collarFlap.rotation.y = (i === 0) ? -0.2 : 0.2;
    lemus.add(collarFlap);
  });

  // Corbata / Lanyard institucional naranja vibrante (mantiene la referencia tieBody para viento en cinemáticas)
  const tieBody = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.98, 0.10), fosfoOrangeMat);
  tieBody.position.set(0, 1.94, 0.75);
  tieBody.rotation.x = -0.06;
  lemus.add(tieBody);

  // ============================================================================
  // 5. TORSO: CAMISA BLANCA + CHALECO NARANJA ACOLCHADO "AL ESTILO JALISCO"
  // ============================================================================
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 1.85, 0);

  // Base de camisa blanca debajo del chaleco
  const innerShirt = new THREE.Mesh(new THREE.BoxGeometry(1.88, 1.52, 1.28), shirtWhiteMat);
  torsoGroup.add(innerShirt);

  // Chaleco Naranja Acolchado característico (Puffer Vest)
  const vestChest = new THREE.Mesh(new THREE.BoxGeometry(2.02, 1.48, 1.38), orangeVestMat);
  vestChest.position.set(0, 0.04, 0);
  torsoGroup.add(vestChest);

  // Cuello alto acolchado naranja del chaleco
  const vestCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.74, 0.34, 10, 1, true), orangeVestMat);
  vestCollar.position.set(0, 0.84, 0.02);
  torsoGroup.add(vestCollar);

  // Escudo de Jalisco / TALACORP bordado en el pecho izquierdo del chaleco
  const badgeBack = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.38, 0.08), goldBadgeMat);
  badgeBack.position.set(0.52, 0.34, 0.71);
  torsoGroup.add(badgeBack);

  const badgeInner = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.09), jaliscoBlueMat);
  badgeInner.position.set(0.52, 0.34, 0.72);
  torsoGroup.add(badgeInner);

  // Bolsillos laterales del chaleco naranja
  [-0.58, 0.58].forEach((x) => {
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.32, 0.08), fosfoOrangeMat);
    pocket.position.set(x, -0.34, 0.70);
    torsoGroup.add(pocket);
  });

  // Cinturón de cuero con hebilla dorada
  const belt = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.20, 1.34), beltLeatherMat);
  belt.position.set(0, -0.74, 0);
  torsoGroup.add(belt);

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.08), goldBadgeMat);
  buckle.position.set(0, -0.74, 0.69);
  torsoGroup.add(buckle);

  // Cola de plumas de pato que asoma por detrás del chaleco
  const duckTail = new THREE.Mesh(new THREE.ConeGeometry(0.44, 1.15, 5), whiteFeatherMat);
  duckTail.position.set(0, -0.55, -0.82);
  duckTail.rotation.x = Math.PI / 2.8;
  torsoGroup.add(duckTail);

  lemus.add(torsoGroup);

  const featherShadeMat = new THREE.MeshLambertMaterial({ color: 0xdbe4ef, flatShading: true });

  // ============================================================================
  // 6. BRAZO DERECHO CON CAMISA ARREMANGADA Y MANO ESCULPIDA PS2 (4 DEDOS)
  // ============================================================================
  const pointingArm = new THREE.Group();
  pointingArm.position.set(-1.06, 2.24, 0.08);

  // Hombro redondeado de camisa blanca integrado al chaleco
  const rShoulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.34, 1), shirtWhiteMat);
  rShoulder.position.set(-0.06, 0.02, 0.04);
  rShoulder.scale.set(1.08, 1.12, 1.08);
  pointingArm.add(rShoulder);

  // Manga superior cilíndrica continua hasta el codo
  const rUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.27, 0.72, 8), shirtWhiteMat);
  rUpper.position.set(0.06, -0.08, 0.34);
  rUpper.rotation.x = Math.PI / 2.25;
  rUpper.rotation.z = -0.18;
  pointingArm.add(rUpper);

  // Articulación del codo y doblez abultado de camisa arremangada
  const rElbowSphere = new THREE.Mesh(new THREE.SphereGeometry(0.23, 8, 6), shirtWhiteMat);
  rElbowSphere.position.set(0.14, -0.15, 0.66);
  pointingArm.add(rElbowSphere);

  const rRollCuff = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.09, 7, 12), shirtWhiteMat);
  rRollCuff.position.set(0.15, -0.16, 0.70);
  rRollCuff.rotation.y = 0.16;
  pointingArm.add(rRollCuff);

  // Antebrazo emplumado orgánico ahusado hacia la muñeca
  const rFore = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.78, 8), whiteFeatherMat);
  rFore.position.set(0.21, -0.20, 1.04);
  rFore.rotation.x = Math.PI / 2.12;
  rFore.rotation.z = -0.12;
  pointingArm.add(rFore);

  // Muñeca emplumada + pulsera naranja fosfo de campaña
  const rWristSphere = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), whiteFeatherMat);
  rWristSphere.position.set(0.26, -0.23, 1.40);
  pointingArm.add(rWristSphere);

  const wristband = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.048, 6, 10), fosfoOrangeMat);
  wristband.position.set(0.26, -0.23, 1.38);
  pointingArm.add(wristband);

  // MANO DERECHA ESCULPIDA (Estilo PS2: palma orgánica, nudillos, 3 dedos flexionados, pulgar e índice apuntando)
  const rHandGroup = new THREE.Group();
  rHandGroup.position.set(0.28, -0.24, 1.56);
  rHandGroup.rotation.set(-0.06, 0.08, -0.10);
  rHandGroup.scale.set(1.18, 1.18, 1.18);

  // Palma redondeada y dorso de la mano
  const rPalm = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 1), whiteFeatherMat);
  rPalm.scale.set(1.14, 0.88, 1.18);
  rHandGroup.add(rPalm);

  // Sombra interior de la palma para dar contraste a los dedos flexionados
  const palmHollow = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), featherShadeMat);
  palmHollow.position.set(-0.02, -0.06, 0.12);
  palmHollow.scale.set(1.1, 0.7, 0.8);
  rHandGroup.add(palmHollow);

  // 1. DEDO ÍNDICE EXTENDIDO APUNTANDO (3 falanges articuladas con yema redondeada)
  const indexFingerGroup = new THREE.Group();
  indexFingerGroup.position.set(0.10, 0.07, 0.16);
  indexFingerGroup.rotation.set(-0.05, -0.04, 0);

  const indexKnuckle = new THREE.Mesh(new THREE.SphereGeometry(0.085, 7, 6), whiteFeatherMat);
  indexFingerGroup.add(indexKnuckle);

  const indexProximal = new THREE.Mesh(new THREE.CylinderGeometry(0.070, 0.084, 0.25, 8), whiteFeatherMat);
  indexProximal.rotation.x = Math.PI / 2;
  indexProximal.position.set(0, 0, 0.12);
  indexFingerGroup.add(indexProximal);

  const indexMid = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.070, 0.21, 8), whiteFeatherMat);
  indexMid.rotation.x = Math.PI / 2;
  indexMid.position.set(0, 0.01, 0.32);
  indexFingerGroup.add(indexMid);

  const indexTip = new THREE.Mesh(new THREE.SphereGeometry(0.060, 8, 6), whiteFeatherMat);
  indexTip.scale.set(0.95, 0.90, 1.35);
  indexTip.position.set(0, 0.015, 0.43);
  indexFingerGroup.add(indexTip);

  rHandGroup.add(indexFingerGroup);

  // 2. DEDOS MEDIO, ANULAR Y MEÑIQUE FLEXIONADOS (Con nudillos definidos y pliegues sombreados)
  const curledFingerSpecs = [
    { x: 0.01, y: 0.03, z: 0.17, r: 0.066, len: 0.19 },  // Dedo medio
    { x: -0.08, y: -0.01, z: 0.15, r: 0.060, len: 0.17, hasRing: true }, // Dedo anular (con anillo)
    { x: -0.16, y: -0.05, z: 0.12, r: 0.052, len: 0.14 } // Dedo meñique
  ];

  curledFingerSpecs.forEach((f) => {
    const fGroup = new THREE.Group();
    fGroup.position.set(f.x, f.y, f.z);

    const knuckle = new THREE.Mesh(new THREE.SphereGeometry(f.r * 1.08, 7, 6), whiteFeatherMat);
    fGroup.add(knuckle);

    const phalanx1 = new THREE.Mesh(new THREE.CylinderGeometry(f.r * 0.9, f.r, f.len, 7), whiteFeatherMat);
    phalanx1.position.set(0, -f.len * 0.42, f.len * 0.28);
    phalanx1.rotation.x = 2.25;
    fGroup.add(phalanx1);

    const phalanx2 = new THREE.Mesh(new THREE.CylinderGeometry(f.r * 0.78, f.r * 0.9, f.len * 0.85, 7), featherShadeMat);
    phalanx2.position.set(0, -f.len * 0.78, -0.02);
    phalanx2.rotation.x = 0.85;
    fGroup.add(phalanx2);

    if (f.hasRing) {
      const signetRing = new THREE.Mesh(new THREE.TorusGeometry(f.r * 0.98, 0.018, 6, 8), goldBadgeMat);
      signetRing.position.set(0, -f.len * 0.25, f.len * 0.22);
      signetRing.rotation.x = 0.7;
      fGroup.add(signetRing);
    }

    rHandGroup.add(fGroup);
  });

  // 3. PULGAR OPONIBLE ARTICULADO (Cerrando el gesto sobre el dedo medio)
  const thumbGroup = new THREE.Group();
  thumbGroup.position.set(0.17, -0.04, 0.08);
  thumbGroup.rotation.set(0.25, -0.45, 0.35);

  const thumbBase = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.082, 0.18, 7), whiteFeatherMat);
  thumbBase.rotation.x = Math.PI / 2;
  thumbBase.position.set(0, 0, 0.08);
  thumbGroup.add(thumbBase);

  const thumbDistal = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.16, 7), whiteFeatherMat);
  thumbDistal.rotation.x = Math.PI / 2;
  thumbDistal.rotation.y = -0.55;
  thumbDistal.position.set(-0.04, -0.01, 0.21);
  thumbGroup.add(thumbDistal);

  const thumbTip = new THREE.Mesh(new THREE.SphereGeometry(0.055, 7, 6), whiteFeatherMat);
  thumbTip.position.set(-0.08, -0.01, 0.27);
  thumbGroup.add(thumbTip);

  rHandGroup.add(thumbGroup);

  pointingArm.add(rHandGroup);
  lemus.add(pointingArm);

  // ============================================================================
  // 7. BRAZO IZQUIERDO CON CAMISA ARREMANGADA, RELOJ EJECUTIVO Y MANO ESCULPIDA
  // ============================================================================
  const leftArm = new THREE.Group();
  leftArm.position.set(1.06, 2.24, 0.05);

  const lShoulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.34, 1), shirtWhiteMat);
  lShoulder.position.set(0.06, 0.02, 0.02);
  lShoulder.scale.set(1.08, 1.12, 1.08);
  leftArm.add(lShoulder);

  const lUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.26, 0.78, 8), shirtWhiteMat);
  lUpper.position.set(0.28, -0.24, 0.06);
  lUpper.rotation.z = -0.68;
  lUpper.rotation.x = 0.18;
  leftArm.add(lUpper);

  // Codo izquierdo continuo con doblez de camisa arremangada
  const lElbowSphere = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), shirtWhiteMat);
  lElbowSphere.position.set(0.48, -0.50, 0.12);
  leftArm.add(lElbowSphere);

  const lRollCuff = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.085, 7, 12), shirtWhiteMat);
  lRollCuff.position.set(0.49, -0.52, 0.13);
  lRollCuff.rotation.x = Math.PI / 2.2;
  lRollCuff.rotation.y = 0.55;
  leftArm.add(lRollCuff);

  // Antebrazo izquierdo continuo desde el codo hasta la muñeca en la cadera
  const lFore = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.21, 0.74, 8), whiteFeatherMat);
  lFore.position.set(0.42, -0.78, 0.28);
  lFore.rotation.z = 0.34;
  lFore.rotation.x = -0.52;
  leftArm.add(lFore);

  const lWristSphere = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), whiteFeatherMat);
  lWristSphere.position.set(0.32, -1.02, 0.42);
  leftArm.add(lWristSphere);

  // Reloj ejecutivo dorado con correa de piel en la muñeca izquierda
  const watchBand = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.038, 6, 10), beltLeatherMat);
  watchBand.position.set(0.35, -0.96, 0.39);
  watchBand.rotation.x = 0.95;
  watchBand.rotation.y = -0.32;
  leftArm.add(watchBand);

  const watchDial = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.088, 0.05, 8), goldBadgeMat);
  watchDial.position.set(0.42, -0.95, 0.45);
  watchDial.rotation.z = -0.55;
  leftArm.add(watchDial);

  // Mano izquierda esculpida apoyada en la cintura con 4 dedos articulados
  const lHandGroup = new THREE.Group();
  lHandGroup.position.set(0.26, -1.10, 0.46);
  lHandGroup.rotation.set(0.22, -0.42, 0.38);
  lHandGroup.scale.set(1.12, 1.12, 1.12);

  const lPalm = new THREE.Mesh(new THREE.DodecahedronGeometry(0.19, 1), whiteFeatherMat);
  lPalm.scale.set(1.12, 0.88, 1.16);
  lHandGroup.add(lPalm);

  [-0.09, -0.02, 0.05, 0.12].forEach((fz, idx) => {
    const lKnuckle = new THREE.Mesh(new THREE.SphereGeometry(0.052, 6, 5), whiteFeatherMat);
    lKnuckle.position.set(-0.08, -0.01, fz);
    lHandGroup.add(lKnuckle);

    const lFinger = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.050, 0.22 - idx * 0.015, 7),
      whiteFeatherMat
    );
    lFinger.position.set(-0.15, -0.05, fz);
    lFinger.rotation.z = 1.22;
    lHandGroup.add(lFinger);
  });

  const lThumb = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.058, 0.18, 7), whiteFeatherMat);
  lThumb.position.set(-0.05, 0.08, 0.15);
  lThumb.rotation.x = 0.65;
  lThumb.rotation.z = 0.85;
  lHandGroup.add(lThumb);

  leftArm.add(lHandGroup);
  lemus.add(leftArm);

  // ============================================================================
  // 8. PANTALÓN DE MEZCLILLA / VESTIR AZUL MARINO Y PATAS CON DETALLE FOSFO-FOSFO
  // ============================================================================
  const pantsGroup = new THREE.Group();
  pantsGroup.position.set(0, 0.88, 0);

  const lPant = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.74, 0.72), navyJeansMat);
  lPant.position.set(-0.55, 0, 0);
  pantsGroup.add(lPant);

  const rPant = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.74, 0.72), navyJeansMat);
  rPant.position.set(0.55, 0, 0);
  pantsGroup.add(rPant);
  lemus.add(pantsGroup);

  // Pierna derecha articulada
  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(-0.55, 0.95, 0);

  const rLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.95, 6), orangeLegMat);
  rLeg.position.set(0, -0.45, 0);
  rLeg.rotation.z = -0.12;
  rightLegPivot.add(rLeg);

  const rFoot = createWebbedDuckFoot(fosfoOrangeMat, beakDarkMat, shirtWhiteMat);
  rFoot.position.set(-0.15, -0.92, 0.15);
  rFoot.rotation.y = -0.35;
  rightLegPivot.add(rFoot);
  lemus.add(rightLegPivot);

  // Pierna izquierda articulada
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(0.55, 0.95, 0);

  const lLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.95, 6), orangeLegMat);
  lLeg.position.set(0, -0.45, 0);
  lLeg.rotation.z = 0.12;
  leftLegPivot.add(lLeg);

  const lFoot = createWebbedDuckFoot(fosfoOrangeMat, beakDarkMat, shirtWhiteMat);
  lFoot.position.set(0.15, -0.92, 0.15);
  lFoot.rotation.y = 0.35;
  leftLegPivot.add(lFoot);
  lemus.add(leftLegPivot);

  lemus.userData = {
    headGroup,
    pointingArm,
    leftArm,
    rightLegPivot,
    leftLegPivot,
    tieBody,
    crestCenter,
    crestLeft,
    crestRight
  };

  return {
    mesh: lemus,
    headGroup,
    pointingArm,
    leftArm,
    rightLegPivot,
    leftLegPivot,
    tieBody,
    crestCenter,
    crestLeft,
    crestRight
  };
}

function createWebbedDuckFoot(footMat, detailMat, soleMat) {
  const foot = new THREE.Group();

  // Tobillera deportiva naranja fosfo con suela blanca
  const ankle = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.26, 0.50), footMat);
  ankle.position.set(0, 0.12, 0);
  foot.add(ankle);

  const soleStrip = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.54), soleMat);
  soleStrip.position.set(0, 0.02, 0);
  foot.add(soleStrip);

  // Dedos palmípedos anaranjados
  const centerToe = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 1.25), footMat);
  centerToe.position.set(0, 0.07, 0.60);
  foot.add(centerToe);

  const leftToe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 1.10), footMat);
  leftToe.position.set(-0.38, 0.07, 0.50);
  leftToe.rotation.y = -0.45;
  foot.add(leftToe);

  const rightToe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 1.10), footMat);
  rightToe.position.set(0.38, 0.07, 0.50);
  rightToe.rotation.y = 0.45;
  foot.add(rightToe);

  const webGeo = new THREE.BoxGeometry(1.0, 0.06, 0.85);
  const web = new THREE.Mesh(webGeo, detailMat);
  web.position.set(0, 0.04, 0.42);
  foot.add(web);

  const heel = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.38), footMat);
  heel.position.set(0, 0.09, -0.22);
  foot.add(heel);

  return foot;
}
