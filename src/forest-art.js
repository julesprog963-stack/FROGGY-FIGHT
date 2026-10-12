import * as THREE from 'three';
import { createLemusBanner } from './banner.js';

export function buildForestAtmosphere(scene) {
  const bark = new THREE.MeshLambertMaterial({ color: 0x214039, flatShading: true });
  const trunkGeometry = new THREE.CylinderGeometry(1.4, 2.6, 1, 6);
  for (let i = 0; i < 22; i++) {
    const angle = i * Math.PI * 2 / 22;
    const radius = 43 + (i % 4) * 8;
    const height = 42 + (i % 5) * 6;
    const tree = new THREE.Mesh(trunkGeometry, bark);
    tree.position.set(Math.sin(angle) * radius, height / 2 - 1, Math.cos(angle) * radius);
    tree.scale.y = height;
    scene.add(tree);
  }

  const poleMat = new THREE.MeshLambertMaterial({ color: 0x49341e, flatShading: true });
  [[-12, 5.5, 5], [12, 7, 5], [-15, 21, -6], [10, 30, -12]].forEach(([x, y, z]) => {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = Math.atan2(x, z);
    group.add(createLemusBanner(2.3, 4.6));
    const crossbar = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.16, 0.18), poleMat);
    crossbar.position.y = 2.4;
    group.add(crossbar);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 7, 5), poleMat);
    post.position.set(-1.35, -1, -0.18);
    group.add(post);
    scene.add(group);
  });

  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffd36c });
  const frameMat = new THREE.MeshLambertMaterial({ color: 0x3d3829, flatShading: true });
  [[2.7, 3.7, 11.8], [-5.6, 5.7, 10.8], [-9.1, 8.4, 8.7], [-10, 15.7, -4.2], [5, 31, -11]].forEach(([x, y, z], i) => {
    const lantern = new THREE.Group();
    lantern.position.set(x, y, z);
    lantern.add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.42), glowMat));
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.43, 0.24, 4), frameMat);
    cap.position.y = 0.4;
    lantern.add(cap);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 2.2, 5), poleMat);
    post.position.y = -1.4;
    lantern.add(post);
    scene.add(lantern);
    // Bound the lighting cost: distant lanterns only use luminous geometry.
    if (i < 3) {
      const light = new THREE.PointLight(0xffbb62, 5, 10, 1);
      light.position.set(x, y, z);
      scene.add(light);
    }
  });
}
