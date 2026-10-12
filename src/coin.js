import * as THREE from 'three';
import { audio } from './audio.js';

export class Coin {
  constructor(scene, position) {
    this.scene = scene;
    this.basePos = position.clone();
    this.alive = true;
    this.time = Math.random() * Math.PI * 2;
    this.pickupRadius = 1.35;

    // Grupo visual de la moneda
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.basePos);

    // Malla principal de la moneda dorada (Cilindro plano giratorio)
    const coinGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.12, 16);
    coinGeo.rotateX(Math.PI / 2); // Orientar para que la cara redonda mire al frente
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xf1c40f,
      emissive: 0x7d6608,
      roughness: 0.25,
      metalness: 0.85,
      flatShading: true
    });
    const coinBody = new THREE.Mesh(coinGeo, coinMat);
    this.mesh.add(coinBody);

    // Borde brillante interior
    const rimGeo = new THREE.TorusGeometry(0.42, 0.04, 6, 16);
    const rimMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    this.mesh.add(rim);

    // Pequeño orbe brillante en el centro
    const starGeo = new THREE.OctahedronGeometry(0.18, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffeaa7 });
    const star = new THREE.Mesh(starGeo, starMat);
    this.mesh.add(star);

    this.scene.add(this.mesh);
  }

  update(dt, player) {
    if (!this.alive) return;

    this.time += dt * 3.2;
    // Giro continuo sobre su eje Y
    this.mesh.rotation.y += dt * 3.6;
    // Levitación suave arriba y abajo
    this.mesh.position.y = this.basePos.y + Math.sin(this.time) * 0.18;

    // Comprobación de recogida por Froggy
    const dist = player.position.distanceTo(this.mesh.position);
    if (dist < this.pickupRadius) {
      this.collect(player);
    }
  }

  collect(player) {
    this.alive = false;
    this.scene.remove(this.mesh);
    audio.playCoin();

    // Efecto de chispas doradas
    if (player.particles) {
      player.particles.spawnSparks(this.mesh.position, 12, 0xf1c40f);
    }

    // Sumar moneda al jugador
    player.collectCoin();
  }
}
