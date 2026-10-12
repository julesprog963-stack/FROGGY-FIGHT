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
    this.swampRadius = 72.0;

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
    this.buildPatoLemusCampaignPodium();
    this.buildToxicDrainageEasterEgg();
    this.spawnNPCs();
    this.spawnCoins();
  }

  buildWorld() {
    // 1. Suelo del bosque talado (expandido a 240x240m para máxima amplitud)
    const groundGeo = new THREE.PlaneGeometry(240, 240, 24, 24);
    const groundMat = new THREE.MeshLambertMaterial({
      color: 0x1b331b,
      flatShading: true
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    this.scene.add(ground);

    const groundBox = new THREE.Box3(
      new THREE.Vector3(-120, -2, -120),
      new THREE.Vector3(120, -1, 120)
    );
    this.platforms.push({ mesh: ground, getBounds: () => groundBox });

    // Agua pantanosa reflectante (expandida a 230x230m)
    const waterGeo = new THREE.PlaneGeometry(230, 230);
    const waterMat = new THREE.MeshBasicMaterial({
      color: 0x0a2216,
      transparent: true,
      opacity: 0.75
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.6;
    this.scene.add(water);

    // Tocones cortados en la distancia con holgura y separación
    const stumpMat = new THREE.MeshLambertMaterial({ color: 0x3d2714, flatShading: true });
    for (let i = 0; i < 34; i++) {
      const angle = (i / 34) * Math.PI * 2 + (i % 3) * 0.15;
      const dist = 28 + (i % 5) * 8.5;
      const h = 2 + (i % 4) * 1.8;
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
    signPost.position.set(3.5, 3.2, 13.0);
    this.scene.add(signPost);

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 0.15), pipeMat);
    signBoard.position.set(3.5, 4.2, 13.0);
    signBoard.rotation.y = -0.3;
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
    const poster1Tex = Textures.createCampaignPoster1();
    const poster2Tex = Textures.createCampaignPoster2();

    const numPosts = 36;
    for (let i = 0; i < numPosts; i++) {
      const angle = (i / numPosts) * Math.PI * 2;
      const nextAngle = ((i + 1) / numPosts) * Math.PI * 2;
      const r = this.swampRadius;

      const px = Math.sin(angle) * r;
      const pz = Math.cos(angle) * r;
      const npx = Math.sin(nextAngle) * r;
      const npz = Math.cos(nextAngle) * r;

      // Poste vertical de soporte de alta seguridad
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 3.8, 6), postMat);
      post.position.set(px, 0.9, pz);
      this.scene.add(post);

      // Travesaño con franjas diagonales de advertencia
      const midX = (px + npx) * 0.5;
      const midZ = (pz + npz) * 0.5;
      const segLen = Math.hypot(npx - px, npz - pz);
      const beam = new THREE.Mesh(new THREE.BoxGeometry(segLen, 0.6, 0.2), beamMat);
      beam.position.set(midX, 1.6, midZ);
      beam.rotation.y = Math.atan2(npx - px, npz - pz) - Math.PI / 2;
      this.scene.add(beam);

      // Afiches electorales de campaña pegados en las vallas perimetrales
      if (i % 4 === 0) {
        const posterMesh = new THREE.Mesh(
          new THREE.BoxGeometry(1.4, 2.1, 0.08),
          new THREE.MeshLambertMaterial({ map: (i % 8 === 0) ? poster1Tex : poster2Tex, flatShading: true })
        );
        posterMesh.position.set(midX * 0.98, 1.8, midZ * 0.98);
        posterMesh.rotation.y = Math.atan2(npx - px, npz - pz) - Math.PI / 2;
        this.scene.add(posterMesh);
      }

      // Barriles tóxicos y charcos radiactivos intercalados
      if (i % 2 === 0) {
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 1.6, 8), barrelMat);
        barrel.position.set(px * 0.96, 0.2, pz * 0.96);
        if (i % 4 === 0) {
          barrel.rotation.z = Math.PI / 3;
          barrel.position.y = -0.15;
        }
        this.scene.add(barrel);

        const sludge = new THREE.Mesh(new THREE.CircleGeometry(1.6 + (i % 3) * 0.4, 8), sludgeMat);
        sludge.rotation.x = -Math.PI / 2;
        sludge.position.set(px * 0.94, -0.55, pz * 0.94);
        this.scene.add(sludge);
      }
    }
  }

  buildPatoLemusBillboard() {
    const billboardGroup = new THREE.Group();
    billboardGroup.position.set(-26, 0, 36);
    billboardGroup.rotation.y = 0.35; // Orientado hacia el sendero

    const woodPillarMat = new THREE.MeshLambertMaterial({ color: 0x5d4037, flatShading: true });
    const metalMat = new THREE.MeshLambertMaterial({ color: 0x7f8c8d, flatShading: true });

    // Dos postes gigantes de soporte
    [-6.2, 6.2].forEach(x => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 12, 6), woodPillarMat);
      pillar.position.set(x, 5.0, -0.2);
      billboardGroup.add(pillar);
    });

    // Vigas traseras de andamio
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

  buildPatoLemusCampaignPodium() {
    // Podio electoral de campaña del Presidente Pato Lemus con tarima, megáfonos y figura de cartón
    const podiumGroup = new THREE.Group();
    podiumGroup.position.set(-18, 0, 48);
    podiumGroup.rotation.y = -0.25;

    const woodPlankMat = new THREE.MeshLambertMaterial({ color: 0xa0522d, flatShading: true });
    const redClothMat = new THREE.MeshLambertMaterial({ color: 0xd63031, flatShading: true });
    const goldMat = new THREE.MeshLambertMaterial({ color: 0xf1c40f, flatShading: true });
    const darkSuitMat = new THREE.MeshLambertMaterial({ color: 0x2d3436, flatShading: true });

    // Tarima de madera con dos escalones
    const stage = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.5, 4.2), woodPlankMat);
    stage.position.y = 0.25;
    podiumGroup.add(stage);

    const step = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.25, 1.2), woodPlankMat);
    step.position.set(0, 0.12, 2.3);
    podiumGroup.add(step);

    // Alfombra roja central
    const carpet = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 4.2), redClothMat);
    carpet.position.set(0, 0.52, 0);
    podiumGroup.add(carpet);

    // Atril con escudo presidencial y micrófono
    const lectern = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 0.8), woodPlankMat);
    lectern.position.set(0, 1.3, 0.8);
    podiumGroup.add(lectern);

    const lecternPlaque = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.6, 0.05),
      new THREE.MeshLambertMaterial({ map: Textures.createCampaignPoster1(), flatShading: true })
    );
    lecternPlaque.position.set(0, 1.45, 1.23);
    podiumGroup.add(lecternPlaque);

    // Micrófonos dorados de conferencia
    [-0.22, 0.22].forEach(x => {
      const micPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 4), goldMat);
      micPole.position.set(x, 2.2, 1.0);
      micPole.rotation.x = 0.3;
      podiumGroup.add(micPole);

      const micHead = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), darkSuitMat);
      micHead.position.set(x, 2.4, 1.12);
      podiumGroup.add(micHead);
    });

    // Torres de sonido / Megáfonos de campaña a los lados
    [-2.8, 2.8].forEach(x => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 4.5, 6), darkSuitMat);
      pole.position.set(x, 2.25, 0);
      podiumGroup.add(pole);

      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.8, 8), goldMat);
      horn.position.set(x, 4.2, 0.2);
      horn.rotation.x = Math.PI / 2;
      horn.rotation.y = (x < 0) ? 0.3 : -0.3;
      podiumGroup.add(horn);
    });

    // Figura recortada de cartón (Standee) a tamaño real de PATO LEMUS
    const cutoutGroup = new THREE.Group();
    cutoutGroup.position.set(0, 0.5, -0.4);

    // Cuerpo con traje presidencial
    const suitBody = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.4, 0.15), darkSuitMat);
    suitBody.position.y = 1.3;
    cutoutGroup.add(suitBody);

    // Corbata roja
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.08), redClothMat);
    tie.position.set(0, 1.3, 0.12);
    cutoutGroup.add(tie);

    // Cabeza de pato amarilla
    const duckHead = new THREE.Mesh(new THREE.SphereGeometry(0.48, 8, 8), new THREE.MeshLambertMaterial({ color: 0xf1c40f }));
    duckHead.position.set(0, 2.2, 0);
    cutoutGroup.add(duckHead);

    // Pico anaranjado grande y arrogante
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.65, 6), new THREE.MeshLambertMaterial({ color: 0xe67e22 }));
    beak.position.set(0, 2.1, 0.45);
    beak.rotation.x = Math.PI / 2;
    cutoutGroup.add(beak);

    // Sombrero de copa negro
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.08, 8), darkSuitMat);
    hatBrim.position.set(0, 2.6, 0);
    cutoutGroup.add(hatBrim);

    const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.6, 8), darkSuitMat);
    hatTop.position.set(0, 2.9, 0);
    cutoutGroup.add(hatTop);

    podiumGroup.add(cutoutGroup);

    // Gran cartel de fondo "PATO LEMUS 2026: EL CANDIDATO QUE CUAC-MPLE"
    const backdrop = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 3.2, 0.12),
      new THREE.MeshLambertMaterial({ map: Textures.createCampaignPoster2(), flatShading: true })
    );
    backdrop.position.set(0, 2.2, -1.8);
    podiumGroup.add(backdrop);

    this.scene.add(podiumGroup);
  }

  buildToxicDrainageEasterEgg() {
    // Zona de contaminación industrial y vertedero de TALACORP
    const toxicGroup = new THREE.Group();
    toxicGroup.position.set(-44, 0, -28);

    const concreteMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a, flatShading: true });
    const metalMat = new THREE.MeshLambertMaterial({ map: Textures.createHazardMetal(), flatShading: true });
    const toxicSludgeMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.9 });
    const barrelMat = new THREE.MeshLambertMaterial({ color: 0x1e272e, flatShading: true });

    // Muro de contención de hormigón
    const wall = new THREE.Mesh(new THREE.BoxGeometry(16, 5.5, 2.2), concreteMat);
    wall.position.set(0, 2.2, 0);
    toxicGroup.add(wall);

    // Tubería gigante de vertido de TALACORP saliendo del muro
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 5.0, 10), metalMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(0, 1.8, 2.2);
    toxicGroup.add(pipe);

    // Chorro de baba verde radiactiva cayendo de la tubería
    const flowGeo = new THREE.CylinderGeometry(1.1, 1.35, 2.8, 8);
    const flow = new THREE.Mesh(flowGeo, toxicSludgeMat);
    flow.position.set(0, 0.2, 4.4);
    flow.rotation.x = 0.25;
    toxicGroup.add(flow);

    // Gran estanque de lodo tóxico fluorescente
    const acidPool = new THREE.Mesh(new THREE.CircleGeometry(7.8, 16), toxicSludgeMat);
    acidPool.rotation.x = -Math.PI / 2;
    acidPool.position.set(0, -0.52, 6.0);
    toxicGroup.add(acidPool);

    // 4 Barriles tóxicos flotantes volcados en el ácido
    [
      { x: -3.2, z: 5.5, rotZ: 0.4 },
      { x: 3.5, z: 6.8, rotZ: -0.6 },
      { x: 1.2, z: 8.5, rotZ: 1.1 },
      { x: -2.0, z: 8.0, rotZ: -0.3 }
    ].forEach(b => {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 1.5, 8), barrelMat);
      barrel.position.set(b.x, -0.3, b.z);
      barrel.rotation.z = b.rotZ;
      toxicGroup.add(barrel);
    });

    // Cartel satírico oficial: "BALNEARIO DEL BIENESTAR PATO LEMUS - AGUA 100% MINERALIZADA"
    const signPolesMat = new THREE.MeshLambertMaterial({ color: 0x57606f, flatShading: true });
    [-2.2, 2.2].forEach(x => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 6), signPolesMat);
      pole.position.set(x, 1.3, 10.5);
      toxicGroup.add(pole);
    });

    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 2.8, 0.15),
      new THREE.MeshLambertMaterial({ map: Textures.createToxicWaterSign(), flatShading: true })
    );
    signBoard.position.set(0, 2.4, 10.5);
    toxicGroup.add(signBoard);

    this.scene.add(toxicGroup);
  }

  spawnNPCs() {
    // 1. Chippy la ardilla vendada llorando sobre su tocón talado
    this.npcs.push(new NPC(this.scene, {
      type: 'squirrel',
      name: 'CHIPPY LA ARDILLA',
      dialogue: '¡Snif... Maldita corporación TALACORP! El Presidente Pato Lemus prometió en campaña que solo podaría unas ramas secas, ¡y ahora van a poner un estacionamiento de 8 pisos sobre mi casa! ¡Usa el botón de hablar en pantalla si tienes un plan para detenerlos!',
      position: new THREE.Vector3(14.0, 0.5, 24.0),
      rotationY: -0.8
    }));

    // 2. Don Caparazón la tortuga de 120 años en huelga frente al podio de Pato Lemus
    this.npcs.push(new NPC(this.scene, {
      type: 'turtle',
      name: 'DON CAPARAZÓN',
      dialogue: 'Llevo 120 años en este pantano, jovencito. El Presidente Pato Lemus montó su podio de campaña ahí enfrente para presumir su MegaMall... ¡Vendió los derechos del bosque y del agua a TALACORP por dos sacos de maíz transgénico! ¡Sube a ese tronco y dale su merecido antes de que vacíen cemento!',
      position: new THREE.Vector3(-36.0, -0.5, 44.0),
      rotationY: 0.45
    }));

    // 3. Pepe la zarigüeya lastimada con muleta en el campamento de desplazados
    this.npcs.push(new NPC(this.scene, {
      type: 'opossum',
      name: 'PEPE LA ZARIGÜEYA',
      dialogue: '¡Esos buldóceres nos pasaron por encima! Nos dejaron sin madriguera pero los obreros de TALACORP tiraron monedas de oro por todos lados... Si juntas 10 monedas, ¡recibes una vida extra! ¡Venga a nuestro hogar, Froggy!',
      position: new THREE.Vector3(38.0, -0.5, -28.0),
      rotationY: 1.2
    }));

    // 4. Blinky el Pez Mutante de Tres Ojos en la laguna de agua contaminada (Easter Egg)
    this.npcs.push(new NPC(this.scene, {
      type: 'mutant_fish',
      name: 'BLINKY EL PEZ MUTANTE',
      dialogue: '¡Cof, cof! ¡Glub... glub! El Presidente Pato Lemus dice que las aguas residuales de TALACORP son "minerales energéticos para el cutis". ¡Ahora tengo tres ojos y brillo en la oscuridad! Si subes a la cima del árbol, ¡ciérrales la llave del desagüe!',
      position: new THREE.Vector3(-42.0, -0.6, -24.0),
      rotationY: 0.8
    }));
  }

  spawnCoins() {
    const coinPositions = [
      // Alrededor del inicio y camino hacia el árbol
      new THREE.Vector3(0, 0.2, 13.5),
      new THREE.Vector3(2.5, 0.2, 15.0),
      new THREE.Vector3(-2.5, 0.2, 15.0),
      new THREE.Vector3(0, 0.2, 18.0),
      new THREE.Vector3(3.0, 0.2, 20.0),
      new THREE.Vector3(-3.0, 0.2, 20.0),

      // Zona de Chippy la ardilla (Sur / Claro de tocones)
      new THREE.Vector3(12.0, 0.2, 22.0),
      new THREE.Vector3(14.0, 0.2, 21.5),
      new THREE.Vector3(16.0, 0.2, 23.5),
      new THREE.Vector3(15.0, 0.2, 26.0),
      new THREE.Vector3(18.0, 0.2, 24.0),

      // Complejo Político Pato Lemus (Suroeste: Valla, Podio y Don Caparazón)
      new THREE.Vector3(-22.0, 0.2, 34.0),
      new THREE.Vector3(-24.0, 0.2, 36.0),
      new THREE.Vector3(-26.0, 0.2, 38.0),
      new THREE.Vector3(-28.0, 0.2, 40.0),
      new THREE.Vector3(-18.0, 0.6, 46.5), // Sobre el podio de campaña
      new THREE.Vector3(-18.0, 0.6, 49.5),
      new THREE.Vector3(-20.0, 0.2, 51.0),
      new THREE.Vector3(-34.0, 0.2, 42.0), // Cerca de Don Caparazón
      new THREE.Vector3(-36.0, 0.2, 46.0),
      new THREE.Vector3(-38.0, 0.2, 43.0),

      // Zona de Contaminación Hídrica & Blinky el Pez Mutante (Noroeste)
      new THREE.Vector3(-40.0, 0.2, -20.0),
      new THREE.Vector3(-42.0, 0.2, -22.0),
      new THREE.Vector3(-44.0, 0.2, -25.0),
      new THREE.Vector3(-41.0, 0.2, -27.0),
      new THREE.Vector3(-45.0, 0.2, -22.0),
      new THREE.Vector3(-38.0, 0.2, -30.0),
      new THREE.Vector3(-44.0, 0.2, -32.0),

      // Zona de Refugiados y Pepe la Zarigüeya (Noreste)
      new THREE.Vector3(34.0, 0.2, -25.0),
      new THREE.Vector3(36.0, 0.2, -27.0),
      new THREE.Vector3(38.0, 0.2, -30.0),
      new THREE.Vector3(40.0, 0.2, -26.0),
      new THREE.Vector3(35.0, 0.2, -32.0),

      // Perímetro exterior y claros adicionales
      new THREE.Vector3(0, 0.2, 55.0),
      new THREE.Vector3(25.0, 0.2, 45.0),
      new THREE.Vector3(-48.0, 0.2, 10.0),
      new THREE.Vector3(50.0, 0.2, 5.0),
      new THREE.Vector3(20.0, 0.2, -45.0),
      new THREE.Vector3(-25.0, 0.2, -50.0),

      // En plataformas del tronco del árbol (ascenso)
      new THREE.Vector3(-4.5, 4.5, 10.5), // Escalón 1
      new THREE.Vector3(-8.2, 7.2, 8.8),   // Escalón 2
      new THREE.Vector3(3.5, 10.5, 9.8),  // Repisa siguiente
      new THREE.Vector3(8.5, 13.5, 6.0),
      new THREE.Vector3(9.5, 17.0, -1.0),
      new THREE.Vector3(5.5, 20.5, -8.0),
      new THREE.Vector3(-2.0, 24.5, -9.5),
      new THREE.Vector3(-7.5, 28.0, -5.5)
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

    // Interacción con NPCs al pulsar tecla E (Tongue)
    if (input && input.keys.tonguePressed) {
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
