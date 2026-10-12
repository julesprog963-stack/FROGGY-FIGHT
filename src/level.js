import * as THREE from 'three';
import { Textures } from './textures.js';
import { TiltingLeaf, SteppingLPlatform, HangingSwingPlatform, TongueAnchor } from './leaf.js';
import { SwampFly, BarkBeetle, PatrolWasp } from './bugs.js';

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

  update(dt, frog) {
    this.tiltingLeaves.forEach(leaf => leaf.update(dt));
    this.hangingPlatforms.forEach(p => p.update(dt));
    this.anchors.forEach(a => a.update(dt));

    this.bugs.forEach(bug => {
      if (bug.type === 'fly') bug.update(dt);
      else if (bug.type === 'beetle') bug.update(dt, frog.position);
      else if (bug.type === 'wasp') bug.update(dt, frog);
    });

    this.checkpoints.forEach(cp => {
      if (frog.position.distanceTo(cp) < 3.2 && cp.y > frog.lastCheckpoint.y + 1) {
        frog.setCheckpoint(cp);
      }
    });
  }
}
