import * as THREE from 'three';

export class ThirdPersonCamera {
  constructor(camera, target) {
    this.camera = camera;
    this.target = target;

    this.currentPosition = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();

    this.yaw = 0;
    this.pitch = 0.35;
    this.distance = 11.5;

    this.minPitch = -0.1;
    this.maxPitch = 1.1;
    this.rotateSpeed = 0.003;

    // Sistema de Trauma & Screen Shake
    this.trauma = 0;
    this.shakeDecay = 1.6;
    this.baseFov = 65;
  }

  addTrauma(amount) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  handleMouseMove(deltaX, deltaY) {
    this.yaw -= deltaX * this.rotateSpeed;
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch + deltaY * this.rotateSpeed));
  }

  rotateCButtons(direction, dt) {
    this.yaw += direction * 2.8 * dt;
  }

  update(dt) {
    // Reducir trauma con el tiempo
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - dt * this.shakeDecay);
    }
    const shake = this.trauma * this.trauma; // no-lineal para impacto satisfactorio

    const targetPos = this.target.position.clone().add(new THREE.Vector3(0, 0.8, 0));

    const hDist = this.distance * Math.cos(this.pitch);
    const vDist = this.distance * Math.sin(this.pitch);

    const offsetX = Math.sin(this.yaw) * hDist;
    const offsetZ = Math.cos(this.yaw) * hDist;
    const offsetY = vDist;

    const idealCamPos = new THREE.Vector3(
      targetPos.x + offsetX,
      targetPos.y + offsetY,
      targetPos.z + offsetZ
    );

    // Evitar que la cámara atraviese el tronco central
    const distToTrunk = Math.hypot(idealCamPos.x, idealCamPos.z);
    if (distToTrunk < 9.5 && idealCamPos.y < 39) {
      const pushOut = new THREE.Vector2(idealCamPos.x, idealCamPos.z).normalize().multiplyScalar(9.8);
      idealCamPos.x = pushOut.x;
      idealCamPos.z = pushOut.y;
    }

    this.currentPosition.lerp(idealCamPos, dt * 7.5);
    this.currentLookAt.lerp(targetPos, dt * 9.5);

    // Aplicar temblor de pantalla (Screen Shake)
    if (shake > 0.001) {
      const shakeOffsetX = (Math.random() - 0.5) * shake * 1.4;
      const shakeOffsetY = (Math.random() - 0.5) * shake * 1.4;
      const shakeOffsetZ = (Math.random() - 0.5) * shake * 1.4;
      this.camera.position.set(
        this.currentPosition.x + shakeOffsetX,
        this.currentPosition.y + shakeOffsetY,
        this.currentPosition.z + shakeOffsetZ
      );
    } else {
      this.camera.position.copy(this.currentPosition);
    }

    this.camera.lookAt(this.currentLookAt);
  }
}
