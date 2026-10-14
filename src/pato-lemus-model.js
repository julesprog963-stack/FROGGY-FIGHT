import * as THREE from 'three';
import { Textures } from './textures.js';

/**
 * Creates the high-fidelity low-poly 3D model of Pato Lemus (N64 / Rareware style)
 * Used in both the Opening Cinematic and the Summit Cutscene for 100% visual fidelity.
 */
export function createPatoLemusModel(options = {}) {
  const lemus = new THREE.Group();

  // Materiales de alta fidelidad estilo N64
  const whiteMat = new THREE.MeshLambertMaterial({ color: 0xfafafa, flatShading: true });
  const beakOrangeMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b, flatShading: true });
  const beakDarkMat = new THREE.MeshLambertMaterial({ color: 0xd97706, flatShading: true });
  const mouthDarkMat = new THREE.MeshBasicMaterial({ color: 0x6a1a1a });
  const tongueMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const suitMat = new THREE.MeshLambertMaterial({ map: Textures.createNavyPinstripe(), flatShading: true });
  
  const tieTex = Textures.createPolkaDotTie();
  tieTex.repeat.set(1, 3);
  const tieMat = new THREE.MeshLambertMaterial({ map: tieTex, flatShading: true });
  
  const blackMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const orangeLegMat = new THREE.MeshLambertMaterial({ color: 0xe67e22, flatShading: true });
  const orangeFootMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b, flatShading: true });

  // 1. CABEZA ESCULPIDA Y TUPÉ
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 3.25, 0);
  headGroup.rotation.x = 0.15;
  headGroup.rotation.y = 0;

  // Base craneal facetada
  const skullGeo = new THREE.DodecahedronGeometry(0.92, 1);
  const skull = new THREE.Mesh(skullGeo, whiteMat);
  skull.scale.set(1.05, 1.15, 1.0);
  headGroup.add(skull);

  // Mejillas que dan la forma triangular de pato
  [-0.48, 0.48].forEach((x, i) => {
    const cheek = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.75, 5), whiteMat);
    cheek.position.set(x, -0.22, 0.18);
    cheek.rotation.z = (i === 0) ? -1.22 : 1.22;
    cheek.rotation.x = -0.20;
    headGroup.add(cheek);
  });

  // Tupé de 3 plumas esculpidas hacia atrás en la coronilla
  const crestCenter = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.8, 4), whiteMat);
  crestCenter.position.set(0, 1.25, -0.28);
  crestCenter.rotation.x = -Math.PI / 2.9;
  headGroup.add(crestCenter);

  const crestLeft = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.5, 4), whiteMat);
  crestLeft.position.set(-0.35, 1.15, -0.20);
  crestLeft.rotation.x = -Math.PI / 3.2;
  crestLeft.rotation.z = 0.38;
  headGroup.add(crestLeft);

  const crestRight = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.5, 4), whiteMat);
  crestRight.position.set(0.35, 1.15, -0.20);
  crestRight.rotation.x = -Math.PI / 3.2;
  crestRight.rotation.z = -0.38;
  headGroup.add(crestRight);

  // 2. CEJAS Y OJOS EXPRESIVOS DE VILLANO
  [-0.35, 0.35].forEach((x, i) => {
    // Ojo blanco almendrado
    const eyeGeo = new THREE.CylinderGeometry(0.32, 0.36, 0.16, 8);
    const eye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    eye.rotation.x = Math.PI / 2;
    eye.rotation.y = (i === 0) ? -0.15 : 0.15;
    eye.scale.set(1.0, 1.25, 1.0);
    eye.position.set(x, 0.40, 0.85);
    headGroup.add(eye);

    // Pupila negra mirando con desdén
    const pupilGeo = new THREE.CylinderGeometry(0.18, 0.20, 0.10, 8);
    const pupil = new THREE.Mesh(pupilGeo, blackMat);
    pupil.rotation.x = Math.PI / 2;
    pupil.position.set(x - 0.08, 0.35, 0.94);
    headGroup.add(pupil);

    // Brillo blanco de reflejo en la pupila
    const catchlight = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.05), eyeWhiteMat);
    catchlight.position.set(x - 0.05, 0.42, 0.99);
    headGroup.add(catchlight);

    // Ceja negra afilada inclinada sobre el ojo en ángulo de villano
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.18, 0.26), blackMat);
    brow.position.set(x, 0.62, 0.88);
    brow.rotation.z = (i === 0) ? 0.46 : -0.46;
    brow.rotation.y = (i === 0) ? -0.18 : 0.18;
    headGroup.add(brow);
  });

  // 3. PICO DE PATO ESCULPIDO CON SONRISA SARCÁSTICA
  const beakGroup = new THREE.Group();
  beakGroup.position.set(0, -0.06, 0.76);

  // Superficie superior ancha inclinada hacia abajo
  const upperBillPlate = new THREE.Mesh(new THREE.BoxGeometry(1.30, 0.16, 0.70), beakOrangeMat);
  upperBillPlate.position.set(0, 0.04, 0.35);
  upperBillPlate.rotation.x = 0.22;
  beakGroup.add(upperBillPlate);

  // Punta curva frontal del pico en espátula
  const upperBillCurvedTip = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.62, 0.14, 12), beakOrangeMat);
  upperBillCurvedTip.position.set(0, -0.04, 0.68);
  upperBillCurvedTip.rotation.x = 0.22;
  upperBillCurvedTip.scale.set(1.10, 1.0, 0.65);
  beakGroup.add(upperBillCurvedTip);

  // Puente de la nariz
  const noseBridge = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.25), beakOrangeMat);
  noseBridge.position.set(0, 0.12, 0.15);
  beakGroup.add(noseBridge);

  // Fosas nasales
  [-0.12, 0.12].forEach(nx => {
    const nostril = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), beakDarkMat);
    nostril.position.set(nx, 0.10, 0.38);
    beakGroup.add(nostril);
  });

  // Comisuras laterales elevadas en las mejillas
  [-0.68, 0.68].forEach((x, i) => {
    const corner = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.45), beakDarkMat);
    corner.position.set(x, 0.02, 0.30);
    corner.rotation.z = (i === 0) ? -0.45 : 0.45;
    corner.rotation.y = (i === 0) ? -0.15 : 0.15;
    beakGroup.add(corner);
  });

  // Cavidad interior de la boca sonriente
  const mouthInterior = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.18, 0.55), mouthDarkMat);
  mouthInterior.position.set(0, -0.10, 0.35);
  beakGroup.add(mouthInterior);

  // Lengua roja visible dentro de la boca
  const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), tongueMat);
  tongue.scale.set(0.85, 0.30, 1.15);
  tongue.position.set(0, -0.08, 0.40);
  beakGroup.add(tongue);

  // Mandíbula inferior abierta (la boca sonriente)
  const lowerBill = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.12, 0.55), beakOrangeMat);
  lowerBill.position.set(0, -0.20, 0.32);
  lowerBill.rotation.x = -0.15;
  beakGroup.add(lowerBill);

  const lowerBillTip = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.10, 10), beakOrangeMat);
  lowerBillTip.position.set(0, -0.24, 0.56);
  lowerBillTip.rotation.x = -0.15;
  lowerBillTip.scale.set(1.0, 1.0, 0.6);
  beakGroup.add(lowerBillTip);

  headGroup.add(beakGroup);
  lemus.add(headGroup);

  // 4. CUELLO, CAMISA Y CORBATA DE LUNARES
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.62, 0.65, 8), whiteMat);
  neck.position.set(0, 2.65, 0.05);
  lemus.add(neck);

  // Cuello de camisa blanca en V
  [-0.26, 0.26].forEach((x, i) => {
    const collarFlap = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.52, 0.12), whiteMat);
    collarFlap.position.set(x, 2.45, 0.68);
    collarFlap.rotation.z = (i === 0) ? -0.45 : 0.45;
    collarFlap.rotation.y = (i === 0) ? -0.2 : 0.2;
    lemus.add(collarFlap);
  });

  // Nudo de la corbata
  const tieKnot = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.16), tieMat);
  tieKnot.position.set(0, 2.42, 0.74);
  lemus.add(tieKnot);

  // Pala de la corbata
  const tieBody = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.05, 0.12), tieMat);
  tieBody.position.set(0, 1.90, 0.72);
  tieBody.rotation.x = -0.08;
  lemus.add(tieBody);

  // 5. CHAQUETA DE TRAJE A RAYAS DIPLOMÁTICAS
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 1.85, 0);

  const jacketChest = new THREE.Mesh(new THREE.BoxGeometry(1.95, 1.55, 1.35), suitMat);
  torsoGroup.add(jacketChest);

  // Solapas anchas y afiladas de traje formal
  [-0.55, 0.55].forEach((x, i) => {
    const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.30, 0.20), suitMat);
    lapel.position.set(x, 0.15, 0.70);
    lapel.rotation.z = (i === 0) ? -0.22 : 0.22;
    lapel.rotation.y = (i === 0) ? -0.15 : 0.15;
    torsoGroup.add(lapel);
  });

  // Faldones de la chaqueta que abren en la cintura
  const skirtLeft = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.65, 1.36), suitMat);
  skirtLeft.position.set(-0.52, -0.85, 0.05);
  skirtLeft.rotation.z = 0.15;
  torsoGroup.add(skirtLeft);

  const skirtRight = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.65, 1.36), suitMat);
  skirtRight.position.set(0.52, -0.85, 0.05);
  skirtRight.rotation.z = -0.15;
  torsoGroup.add(skirtRight);

  // Botón frontal
  const button = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 6), blackMat);
  button.rotation.x = Math.PI / 2;
  button.position.set(0, -0.16, 0.70);
  torsoGroup.add(button);

  // Cola de plumas de pato que asoma por detrás
  const duckTail = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.1, 5), whiteMat);
  duckTail.position.set(0, -0.55, -0.80);
  duckTail.rotation.x = Math.PI / 2.8;
  torsoGroup.add(duckTail);

  lemus.add(torsoGroup);

  // 6. BRAZO DERECHO (Apuntando / Saludando con pivote en hombro)
  const pointingArm = new THREE.Group();
  pointingArm.position.set(-1.10, 2.25, 0);

  const rShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.60, 0.48), suitMat);
  rShoulder.position.set(-0.15, 0, 0);
  pointingArm.add(rShoulder);

  const rUpper = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.85, 0.42), suitMat);
  rUpper.position.set(0.15, -0.15, 0.35);
  rUpper.rotation.x = -Math.PI / 2.6;
  rUpper.rotation.y = 0.20;
  pointingArm.add(rUpper);

  const rFore = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.95, 0.38), suitMat);
  rFore.position.set(0.25, -0.20, 1.05);
  rFore.rotation.x = -Math.PI / 2.3;
  pointingArm.add(rFore);

  const rCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.14, 8), whiteMat);
  rCuff.rotation.x = Math.PI / 2;
  rCuff.position.set(0.30, -0.22, 1.55);
  pointingArm.add(rCuff);

  // Mano enguantada
  const rHandGroup = new THREE.Group();
  rHandGroup.position.set(0.32, -0.22, 1.85);
  rHandGroup.scale.set(1.25, 1.25, 1.25);

  const rFist = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.46, 0.50), whiteMat);
  rHandGroup.add(rFist);

  const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.26, 0.20), whiteMat);
  thumb.position.set(-0.16, 0.10, 0);
  rHandGroup.add(thumb);

  // Dedo índice apuntando
  const indexFinger1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.60, 6), whiteMat);
  indexFinger1.rotation.x = Math.PI / 2.15;
  indexFinger1.position.set(0, 0.08, 0.42);
  rHandGroup.add(indexFinger1);

  const indexFingerTip = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.30, 6), whiteMat);
  indexFingerTip.rotation.x = Math.PI / 2.15;
  indexFingerTip.position.set(0, 0.05, 0.80);
  rHandGroup.add(indexFingerTip);

  pointingArm.add(rHandGroup);
  lemus.add(pointingArm);

  // 7. BRAZO IZQUIERDO (Pose Akimbo en la cadera con pivote)
  const leftArm = new THREE.Group();
  leftArm.position.set(1.10, 2.25, 0);

  const lShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.60, 0.48), suitMat);
  lShoulder.position.set(0.15, 0, 0);
  leftArm.add(lShoulder);

  const lUpper = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.85, 0.42), suitMat);
  lUpper.position.set(0.35, -0.25, 0);
  lUpper.rotation.z = -0.82;
  lUpper.rotation.y = 0.15;
  leftArm.add(lUpper);

  const lFore = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.80, 0.38), suitMat);
  lFore.position.set(0.55, -0.75, 0.25);
  lFore.rotation.z = 0.45;
  lFore.rotation.x = -0.65;
  leftArm.add(lFore);

  const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.42), whiteMat);
  lHand.position.set(0.32, -1.05, 0.40);
  leftArm.add(lHand);

  lemus.add(leftArm);

  // 8. PANTALONES CORTOS DE TRAJE A RAYAS
  const pantsGroup = new THREE.Group();
  pantsGroup.position.set(0, 0.88, 0);

  const lPant = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.72, 0.70), suitMat);
  lPant.position.set(-0.55, 0, 0);
  pantsGroup.add(lPant);

  const rPant = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.72, 0.70), suitMat);
  rPant.position.set(0.55, 0, 0);
  pantsGroup.add(rPant);
  lemus.add(pantsGroup);

  // 9. PIERNAS ANARANJADAS Y PATAS PALMÍPEDAS
  // Pierna derecha (Viewer Left) con pivote articulado
  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(-0.55, 0.95, 0);

  const rLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.95, 6), orangeLegMat);
  rLeg.position.set(0, -0.45, 0);
  rLeg.rotation.z = -0.12;
  rightLegPivot.add(rLeg);

  const rFoot = createWebbedDuckFoot(orangeFootMat, beakDarkMat);
  rFoot.position.set(-0.15, -0.92, 0.15);
  rFoot.rotation.y = -0.35;
  rightLegPivot.add(rFoot);
  lemus.add(rightLegPivot);

  // Pierna izquierda (Viewer Right) con pivote articulado
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(0.55, 0.95, 0);

  const lLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.95, 6), orangeLegMat);
  lLeg.position.set(0, -0.45, 0);
  lLeg.rotation.z = 0.12;
  leftLegPivot.add(lLeg);

  const lFoot = createWebbedDuckFoot(orangeFootMat, beakDarkMat);
  lFoot.position.set(0.15, -0.92, 0.15);
  lFoot.rotation.y = 0.35;
  leftLegPivot.add(lFoot);
  lemus.add(leftLegPivot);

  // Asignar referencias a userData para fácil acceso
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

function createWebbedDuckFoot(footMat, detailMat) {
  const foot = new THREE.Group();

  const ankle = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.48), footMat);
  ankle.position.set(0, 0.1, 0);
  foot.add(ankle);

  // Dedo central largo
  const centerToe = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 1.25), footMat);
  centerToe.position.set(0, 0.07, 0.60);
  foot.add(centerToe);

  // Dedo izquierdo
  const leftToe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 1.10), footMat);
  leftToe.position.set(-0.38, 0.07, 0.50);
  leftToe.rotation.y = -0.45;
  foot.add(leftToe);

  // Dedo derecho
  const rightToe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 1.10), footMat);
  rightToe.position.set(0.38, 0.07, 0.50);
  rightToe.rotation.y = 0.45;
  foot.add(rightToe);

  // Membrana interdigital (webbing)
  const webGeo = new THREE.BoxGeometry(1.0, 0.06, 0.85);
  const web = new THREE.Mesh(webGeo, detailMat);
  web.position.set(0, 0.04, 0.42);
  foot.add(web);

  // Talón
  const heel = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.38), footMat);
  heel.position.set(0, 0.09, -0.22);
  foot.add(heel);

  return foot;
}
