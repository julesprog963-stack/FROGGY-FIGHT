import * as THREE from 'three';
import { Textures } from './textures.js';
import { TiltingLeaf, SteppingLPlatform, HangingSwingPlatform, TongueAnchor } from './leaf.js';
import { SwampFly, BarkBeetle, PatrolWasp } from './bugs.js';
import { NPC } from './npc.js';
import { Coin } from './coin.js';

function createCylinderPlatform(mesh, radius, height) {
  const box = new THREE.Box3();
  const halfH = height * 0.5;
  box.min.set(mesh.position.x - radius, mesh.position.y - halfH, mesh.position.z - radius);
  box.max.set(mesh.position.x + radius, mesh.position.y + halfH, mesh.position.z + radius);
  return {
    mesh,
    getBounds: () => box
  };
}

export class Level {
  constructor(scene) {
    this.scene = scene;
    this.platforms = [];
    this.tiltingLeaves = [];
    this.hangingPlatforms = [];
    this.anchors = [];
    this.bugs = [];
    this.checkpoints = [];
    this.npcs = [];
    this.coins = [];
    this.swampRadius = 48.0;

    this.trunkMesh = null;
    this.arenaRadius = 14;
    this.trunkHeight = 40;

    this.buildWorld();
    this.buildTrunk();
    this.buildOrganicVines();
    this.buildBioluminescentFungi();
    this.buildPlatformsFromMaquette();
    this.buildIndustrialDetails();
    this.populateBugs();
    this.buildPerimeterBarriers();
    this.buildPatoLemusBillboard();
    this.spawnNPCs();
    this.spawnCoins();
  }

  buildWorld() {
    // 1. Suelo del bosque talado
    const groundGeo = new THREE.PlaneGeometry(160, 160, 16, 16);
    const groundMat = new THREE.MeshLambertMaterial({
      color: 0x1b331b,
      flatShading: true
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    this.scene.add(ground);

    const groundBox = new THREE.Box3(
      new THREE.Vector3(-80, -2, -80),
      new THREE.Vector3(80, -1, 80)
    );
    this.platforms.push({ mesh: ground, getBounds: () => groundBox });

    // Agua pantanosa reflectante
    const waterGeo = new THREE.PlaneGeometry(150, 150);
    const waterMat = new THREE.MeshBasicMaterial({
      color: 0x0a2216,
      transparent: true,
      opacity: 0.72
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.6;
    this.scene.add(water);

    // Tocones cortados en la distancia
    const stumpMat = new THREE.MeshLambertMaterial({ color: 0x3d2714, flatShading: true });
    for (let i = 0; i < 22; i++) {
      const angle = (i / 22) * Math.PI * 2 + Math.random() * 0.2;
      const dist = 30 + Math.random() * 28;
      const h = 2 + Math.random() * 7;
      const stump = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.8, h, 7), stumpMat);
      stump.position.set(Math.cos(angle) * dist, h * 0.5 - 1, Math.sin(angle) * dist);
      this.scene.add(stump);
    }
  }

  buildTrunk() {
    // Prisma octagonal alto con corteza oscura estriada (fiel a la maqueta de cartón)
    const trunkGeo = new THREE.CylinderGeometry(8.5, 10.5, this.trunkHeight, 8);
    const trunkMat = new THREE.MeshLambertMaterial({
      map: Textures.createTreeBark(),
      color: 0x3a2d27,
      flatShading: true
    });
    this.trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
    this.trunkMesh.position.y = this.trunkHeight * 0.5;
    this.scene.add(this.trunkMesh);

    // Cima talada con anillos de crecimiento y marcas de sierra
    const topCapGeo = new THREE.CylinderGeometry(8.5, 8.5, 0.8, 16);
    const topCapMat = new THREE.MeshLambertMaterial({
      map: Textures.createWoodRings(),
      color: 0xd4a373,
      flatShading: true
    });
    const topCap = new THREE.Mesh(topCapGeo, topCapMat);
    topCap.position.y = this.trunkHeight + 0.4;
    this.scene.add(topCap);
    this.platforms.push(createCylinderPlatform(topCap, 8.5, 0.8));
  }

  buildOrganicVines() {
    // Lianas y enredaderas que serpentean alrededor del tronco
    const vineMat = new THREE.MeshLambertMaterial({ color: 0x1b4332, flatShading: true });
    for (let i = 0; i < 4; i++) {
      const vineGroup = new THREE.Group();
      const baseAngle = (i / 4) * Math.PI * 2;
      for (let y = 2; y < 38; y += 3) {
        const a = baseAngle + (y / 38) * Math.PI * 1.5;
        const r = 8.8 + (1 - y / 40) * 1.6;
        const segment = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 3.2, 5), vineMat);
        segment.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
        segment.rotation.z = Math.cos(a) * 0.2;
        segment.rotation.x = Math.sin(a) * 0.2;
        vineGroup.add(segment);
      }
      this.scene.add(vineGroup);
    }
  }

  buildBioluminescentFungi() {
    // Hongos de repisa bioluminiscentes en los nudos del tronco
    const shroomColors = [0x9b59b6, 0xe67e22, 0x1abc9c, 0xf1c40f];
    const positions = [
      new THREE.Vector3(-8.8, 8, 2),
      new THREE.Vector3(-9.2, 14, -2),
      new THREE.Vector3(2, 21, -8.9),
      new THREE.Vector3(8.8, 27, 0),
      new THREE.Vector3(7.5, 33, 5)
    ];

    positions.forEach((pos, idx) => {
      const capMat = new THREE.MeshLambertMaterial({
        color: shroomColors[idx % shroomColors.length],
        flatShading: true
      });
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 0.6, 0.4, 7), capMat);
      cap.position.copy(pos);
      cap.rotation.z = (Math.random() - 0.5) * 0.4;
      this.scene.add(cap);

      // Tallo
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.8, 5), new THREE.MeshLambertMaterial({ color: 0xdfe6e9 }));
      stem.position.copy(pos).add(new THREE.Vector3(0, -0.4, 0));
      this.scene.add(stem);
    });
  }

  buildPlatformsFromMaquette() {
    // 1. Plataforma redonda de inicio en la base
    const startMushroom = new THREE.Mesh(
      new THREE.CylinderGeometry(3.6, 3.9, 0.6, 12),
      new THREE.MeshLambertMaterial({ color: 0xe67e22, flatShading: true })
    );
    startMushroom.position.set(0, 1.2, 11);
    this.scene.add(startMushroom);
    this.platforms.push(createCylinderPlatform(startMushroom, 3.8, 0.6));

    this.checkpoints.push(new THREE.Vector3(0, 1.6, 11));

    // 2. Tramo 1: Escalones con soporte en L (fieles a la maqueta)
    const stepConfigs = [
      { pos: new THREE.Vector3(-4.5, 3.8, 10.5), size: { w: 3.0, d: 2.2, h: 0.35 } },
      { pos: new THREE.Vector3(-8.2, 6.5, 8.8), size: { w: 3.0, d: 2.2, h: 0.35 } },
      { pos: new THREE.Vector3(-10.5, 9.4, 5.0), size: { w: 3.0, d: 2.2, h: 0.35 } }
    ];

    stepConfigs.forEach(cfg => {
      const plat = new SteppingLPlatform(this.scene, cfg.pos, cfg.size);
      this.platforms.push(plat);
    });

    // Primera hoja inestable que se inclina
    const leaf1 = new TiltingLeaf(this.scene, new THREE.Vector3(-11.5, 12.0, 0.5), { w: 3.6, d: 3.0, h: 0.3 }, 'left');
    this.platforms.push(leaf1);
    this.tiltingLeaves.push(leaf1);

    // Checkpoint 1: Nudo del tronco
    const knot1 = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.4, 0.7, 8),
      new THREE.MeshLambertMaterial({ color: 0x8e44ad, flatShading: true })
    );
    knot1.position.set(-10.8, 13.5, -4.5);
    this.scene.add(knot1);
    this.platforms.push(createCylinderPlatform(knot1, 3.3, 0.7));
    this.checkpoints.push(new THREE.Vector3(-10.8, 14.0, -4.5));

    // 3. Tramo 2: Anillos de lengua y plataforma colgante
    const anchor1 = new TongueAnchor(this.scene, new THREE.Vector3(-7.0, 22.0, -9.0));
    this.anchors.push(anchor1);

    const leaf2 = new TiltingLeaf(this.scene, new THREE.Vector3(-3.0, 16.5, -11.0), { w: 3.2, d: 2.8, h: 0.3 }, 'outward');
    this.platforms.push(leaf2);
    this.tiltingLeaves.push(leaf2);

    const platIndustrial1 = new SteppingLPlatform(this.scene, new THREE.Vector3(2.5, 19.5, -11.2), { w: 3.2, d: 2.2, h: 0.35 });
    this.platforms.push(platIndustrial1);

    // 4. PLATAFORMA COLGANTE SUSPENDIDA (derecha de la maqueta)
    const hangingPlat = new HangingSwingPlatform(this.scene, new THREE.Vector3(8.5, 23.0, -7.5), { w: 3.6, d: 2.6, h: 0.35 }, 5.5);
    this.platforms.push(hangingPlat);
    this.hangingPlatforms.push(hangingPlat);

    const overheadBranch = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.8, 6.0),
      new THREE.MeshLambertMaterial({ color: 0x3d2714, flatShading: true })
    );
    overheadBranch.position.set(8.5, 28.5, -7.5);
    this.scene.add(overheadBranch);
    const branchBox = new THREE.Box3(
      new THREE.Vector3(8.5 - 0.6, 28.5 - 0.4, -7.5 - 3.0),
      new THREE.Vector3(8.5 + 0.6, 28.5 + 0.4, -7.5 + 3.0)
    );
    this.platforms.push({ mesh: overheadBranch, getBounds: () => branchBox });

    const anchor2 = new TongueAnchor(this.scene, new THREE.Vector3(11.0, 31.0, -1.0));
    this.anchors.push(anchor2);

    // Checkpoint 2: Nudo de tuberías
    const knot2 = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.4, 0.7, 8),
      new THREE.MeshLambertMaterial({ color: 0x27ae60, flatShading: true })
    );
    knot2.position.set(11.5, 26.5, 2.5);
    this.scene.add(knot2);
    this.platforms.push(createCylinderPlatform(knot2, 3.3, 0.7));
    this.checkpoints.push(new THREE.Vector3(11.5, 27.0, 2.5));

    // 5. Tramo 3: Subida final
    const leaf3 = new TiltingLeaf(this.scene, new THREE.Vector3(10.2, 30.0, 7.5), { w: 3.4, d: 2.8, h: 0.3 }, 'right');
    this.platforms.push(leaf3);
    this.tiltingLeaves.push(leaf3);

    const leaf4 = new TiltingLeaf(this.scene, new THREE.Vector3(6.0, 33.5, 11.0), { w: 3.4, d: 2.8, h: 0.3 }, 'outward');
    this.platforms.push(leaf4);
    this.tiltingLeaves.push(leaf4);

    const finalStep = new SteppingLPlatform(this.scene, new THREE.Vector3(0.5, 37.0, 11.5), { w: 3.5, d: 2.5, h: 0.4 });
    this.platforms.push(finalStep);

    // Checkpoint 3: Cima
    this.checkpoints.push(new THREE.Vector3(0, 41.0, 6.5));
  }

  buildIndustrialDetails() {
    const pipeMat = new THREE.MeshLambertMaterial({
      map: Textures.createHazardMetal(),
      color: 0x95a5a6,
      flatShading: true
    });
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 18, 8), pipeMat);
    pipe.position.set(9.8, 20, 0);
    this.scene.add(pipe);

    const slimeMat = new THREE.MeshBasicMaterial({
      map: Textures.createToxicSlime(),
      color: 0x00ff88
    });
    const slime = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 4, 6), slimeMat);
    slime.position.set(9.8, 10, 0);
    this.scene.add(slime);

    const signPost = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 0.2), new THREE.MeshLambertMaterial({ color: 0x333333 }));
    signPost.position.set(0, 3.2, 13.5);
    this.scene.add(signPost);

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 0.15), pipeMat);
    signBoard.position.set(0, 4.2, 13.5);
    this.scene.add(signBoard);
  }

  populateBugs() {
    const flyPositions = [
      new THREE.Vector3(-2, 4, 11),
      new THREE.Vector3(-6, 7.5, 9.5),
      new THREE.Vector3(-10, 11, 7),
      new THREE.Vector3(-12, 14, 0),
      new THREE.Vector3(-6, 18, -10),
      new THREE.Vector3(0, 21, -11),
      new THREE.Vector3(6, 25, -8),
      new THREE.Vector3(12, 28, -2),
      new THREE.Vector3(12, 31, 5),
      new THREE.Vector3(8, 35, 9),
      new THREE.Vector3(2, 39, 10),
      new THREE.Vector3(-4, 42, 4),
      new THREE.Vector3(4, 42, -4)
    ];

    flyPositions.forEach(pos => {
      this.bugs.push(new SwampFly(this.scene, pos));
    });

    const beetlePositions = [
      new THREE.Vector3(-4.5, 4.3, 10.5),
      new THREE.Vector3(-10.8, 14.1, -4.5),
      new THREE.Vector3(2.5, 20.0, -11.2),
      new THREE.Vector3(11.5, 27.2, 2.5)
    ];

    beetlePositions.forEach(pos => {
      this.bugs.push(new BarkBeetle(this.scene, pos, 1.2));
    });

    const waspPositions = [
      new THREE.Vector3(-9, 15, -6),
      new THREE.Vector3(5, 24, -9),
      new THREE.Vector3(10, 32, 6)
    ];

    waspPositions.forEach(pos => {
      this.bugs.push(new PatrolWasp(this.scene, pos));
    });
  }

  buildPerimeterBarriers() {
    const postMat = new THREE.MeshLambertMaterial({ color: 0x3d3d3d, flatShading: true });
    const beamMat = new THREE.MeshLambertMaterial({
      map: Textures.createHazardStripes(),
      flatShading: true
    });
    const barrelMat = new THREE.MeshLambertMaterial({ color: 0x2f3640, flatShading: true });
    const sludgeMat = new THREE.MeshBasicMaterial({ color: 0x2ecc71, transparent: true, opacity: 0.85 });

    const numPosts = 24;
    for (let i = 0; i < numPosts; i++) {
      const angle = (i / numPosts) * Math.PI * 2;
      const nextAngle = ((i + 1) / numPosts) * Math.PI * 2;
      const r = this.swampRadius;

      const px = Math.sin(angle) * r;
      const pz = Math.cos(angle) * r;
      const npx = Math.sin(nextAngle) * r;
      const npz = Math.cos(nextAngle) * r;

      // Poste vertical de soporte
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 3.4, 6), postMat);
      post.position.set(px, 0.7, pz);
      this.scene.add(post);

      // Travesaño con franjas diagonales amarillas y negras de advertencia
      const midX = (px + npx) * 0.5;
      const midZ = (pz + npz) * 0.5;
      const segLen = Math.hypot(npx - px, npz - pz);
      const beam = new THREE.Mesh(new THREE.BoxGeometry(segLen, 0.55, 0.18), beamMat);
      beam.position.set(midX, 1.4, midZ);
      beam.rotation.y = Math.atan2(npx - px, npz - pz) - Math.PI / 2;
      this.scene.add(beam);

      // Barriles tóxicos de TALACORP intercalados
      if (i % 2 === 0) {
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 1.5, 8), barrelMat);
        barrel.position.set(px * 0.95, 0.2, pz * 0.95);
        if (i % 4 === 0) {
          barrel.rotation.z = Math.PI / 3;
          barrel.position.y = -0.15;
        }
        this.scene.add(barrel);

        // Charco de líquido tóxico verde radiactivo
        const sludge = new THREE.Mesh(new THREE.CircleGeometry(1.4 + Math.random() * 0.6, 8), sludgeMat);
        sludge.rotation.x = -Math.PI / 2;
        sludge.position.set(px * 0.93, -0.55, pz * 0.93);
        this.scene.add(sludge);
      }
    }
  }

  buildPatoLemusBillboard() {
    const billboardGroup = new THREE.Group();
    billboardGroup.position.set(-16, 0, 24);
    billboardGroup.rotation.y = 0.35; // Orientado hacia el inicio del nivel

    const woodPillarMat = new THREE.MeshLambertMaterial({ color: 0x5d4037, flatShading: true });
    const metalMat = new THREE.MeshLambertMaterial({ color: 0x7f8c8d, flatShading: true });

    // Dos postes gigantes de soporte
    [-6.2, 6.2].forEach(x => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 12, 6), woodPillarMat);
      pillar.position.set(x, 5.0, -0.2);
      billboardGroup.add(pillar);
    });

    // Vigas cruzadas traseras de andamio
    const strut = new THREE.Mesh(new THREE.BoxGeometry(13, 0.3, 0.2), metalMat);
    strut.position.set(0, 3.5, -0.3);
    billboardGroup.add(strut);

    // Tablero frontal con la textura publicitaria de Pato Lemus
    const boardGeo = new THREE.BoxGeometry(13.5, 6.8, 0.35);
    const billboardTex = Textures.createBillboardTexture();
    const boardMat = new THREE.MeshLambertMaterial({
      map: billboardTex,
      flatShading: true
    });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(0, 7.5, 0);
    billboardGroup.add(board);

    // Focos reflectores superiores
    [-4.5, 0, 4.5].forEach(x => {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.8), metalMat);
      lamp.position.set(x, 11.2, 0.5);
      lamp.rotation.x = 0.4;
      billboardGroup.add(lamp);

      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 4, 4), new THREE.MeshBasicMaterial({ color: 0xffeaa7 }));
      bulb.position.set(x, 11.1, 0.8);
      billboardGroup.add(bulb);
    });

    // Pancartas de protesta ciudadana / animal al pie del cartel
    const signMat = new THREE.MeshLambertMaterial({ color: 0xf1f2f6, flatShading: true });
    const stickMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b, flatShading: true });

    const protestSigns = [
      { text: '¡NO AL MEGAMALL!', x: -3.5, z: 1.5, rot: -0.2 },
      { text: '¡DEVUELVAN EL ÁRBOL!', x: 0.5, z: 1.8, rot: 0.15 },
      { text: '¡PATO LEMUS CORRUPTO!', x: 4.0, z: 1.4, rot: 0.28 }
    ];

    protestSigns.forEach(s => {
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 5), stickMat);
      stick.position.set(s.x, 0.4, s.z);
      stick.rotation.z = s.rot * 0.4;
      billboardGroup.add(stick);

      const plank = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.06), signMat);
      plank.position.set(s.x, 1.1, s.z);
      plank.rotation.y = s.rot;
      billboardGroup.add(plank);
    });

    this.scene.add(billboardGroup);
  }

  spawnNPCs() {
    // 1. Chippy la ardilla vendada llorando sobre un tocón
    this.npcs.push(new NPC(this.scene, {
      type: 'squirrel',
      name: 'CHIPPY LA ARDILLA',
      dialogue: '¡Snif... Maldita corporación TALACORP! El Presidente Pato Lemus prometió en campaña que solo podaría unas ramas secas, ¡y ahora van a poner un estacionamiento de 8 pisos sobre mi casa!',
      position: new THREE.Vector3(7.5, 0.5, 18.0),
      rotationY: -0.8
    }));

    // 2. Don Caparazón la tortuga en huelga con pancarta
    this.npcs.push(new NPC(this.scene, {
      type: 'turtle',
      name: 'DON CAPARAZÓN',
      dialogue: 'Llevo 120 años en este pantano, jovencito. El Presidente Pato Lemus vendió los derechos del bosque a TALACORP por dos costales de maíz transgénico. ¡Sube a ese tronco y desmantela a su robot antes de que echen cemento!',
      position: new THREE.Vector3(-13.5, -0.5, 20.0),
      rotationY: 0.45
    }));

    // 3. Pepe la zarigüeya lastimada con muleta
    this.npcs.push(new NPC(this.scene, {
      type: 'opossum',
      name: 'PEPE LA ZARIGÜEYA',
      dialogue: '¡Esos insectos mecánicos nos electrocutaron la madriguera! Los obreros de TALACORP tiraron monedas de oro por todo el pantano... Si juntas 10 monedas, te darán energía para ganar una vida extra. ¡Venga a nuestro hogar, Froggy!',
      position: new THREE.Vector3(-20.0, -0.5, -14.0),
      rotationY: 1.2
    }));
  }

  spawnCoins() {
    const coinPositions = [
      // Alrededor del inicio y camino
      new THREE.Vector3(0, 0.2, 13.5),
      new THREE.Vector3(2.5, 0.2, 14.5),
      new THREE.Vector3(-2.5, 0.2, 14.5),
      new THREE.Vector3(0, 0.2, 16.5),

      // Cerca de Chippy la ardilla
      new THREE.Vector3(6.0, 0.2, 17.0),
      new THREE.Vector3(7.5, 0.2, 16.2),
      new THREE.Vector3(9.0, 0.2, 17.5),
      new THREE.Vector3(8.0, 0.2, 19.5),

      // Cerca del Cartel de Pato Lemus y Don Caparazón
      new THREE.Vector3(-11.5, 0.2, 18.5),
      new THREE.Vector3(-13.5, 0.2, 18.0),
      new THREE.Vector3(-15.5, 0.2, 19.0),
      new THREE.Vector3(-17.5, 0.2, 20.5),
      new THREE.Vector3(-14.0, 0.2, 22.0),
      new THREE.Vector3(-16.0, 0.2, 23.5),

      // Cerca de Pepe la zarigüeya y barriles tóxicos
      new THREE.Vector3(-17.0, 0.2, -12.5),
      new THREE.Vector3(-19.0, 0.2, -13.0),
      new THREE.Vector3(-21.0, 0.2, -15.0),
      new THREE.Vector3(-18.5, 0.2, -16.5),

      // Alrededor de otros tocones en el pantano
      new THREE.Vector3(18.0, 0.2, 5.0),
      new THREE.Vector3(20.0, 0.2, 7.5),
      new THREE.Vector3(22.0, 0.2, 4.0),
      new THREE.Vector3(-10.0, 0.2, -25.0),
      new THREE.Vector3(-12.5, 0.2, -27.0),
      new THREE.Vector3(15.0, 0.2, -20.0),
      new THREE.Vector3(17.5, 0.2, -22.5),
      new THREE.Vector3(-28.0, 0.2, 5.0),
      new THREE.Vector3(-30.0, 0.2, 7.5),

      // En plataformas de madera de la base del árbol
      new THREE.Vector3(-4.5, 4.5, 10.5), // Escalón 1
      new THREE.Vector3(-8.2, 7.2, 8.8),   // Escalón 2
      new THREE.Vector3(3.5, 10.5, 9.8)   // Repisa siguiente
    ];

    coinPositions.forEach(pos => {
      this.coins.push(new Coin(this.scene, pos));
    });
  }

  update(dt, frog, hud = null, input = null) {
    this.tiltingLeaves.forEach(leaf => leaf.update(dt));
    this.hangingPlatforms.forEach(p => p.update(dt));
    this.anchors.forEach(a => a.update(dt));

    this.bugs.forEach(bug => {
      if (bug.type === 'fly') bug.update(dt);
      else if (bug.type === 'beetle') bug.update(dt, frog.position);
      else if (bug.type === 'wasp') bug.update(dt, frog);
    });

    this.coins.forEach(c => c.update(dt, frog));
    this.npcs.forEach(n => n.update(dt, frog, hud));

    // Interacción con NPCs al pulsar E o Tongue
    if (input && (input.keys.tonguePressed || input.keys.jumpPressed)) {
      const nearNpc = this.npcs.find(n => n.isNear);
      if (nearNpc && hud && hud.dialogueBox.style.display !== 'flex') {
        nearNpc.interact(hud);
      }
    }

    // Delimitación perimetral del pantano (barrera circular TALACORP)
    if (frog.position.y < 3.5) {
      const dist = Math.hypot(frog.position.x, frog.position.z);
      if (dist > this.swampRadius) {
        const nx = frog.position.x / dist;
        const nz = frog.position.z / dist;
        frog.position.x = nx * this.swampRadius;
        frog.position.z = nz * this.swampRadius;
        if (frog.velocity.x * nx + frog.velocity.z * nz > 0) {
          frog.velocity.x = -nx * 7.0;
          frog.velocity.z = -nz * 7.0;
        }
        if (frog.particles) {
          frog.particles.spawnDustPuff(frog.position, 8, 0xf1c40f);
        }
      }
    }

    this.checkpoints.forEach(cp => {
      if (frog.position.distanceTo(cp) < 3.2 && cp.y > frog.lastCheckpoint.y + 1) {
        frog.setCheckpoint(cp);
      }
    });
  }
}
