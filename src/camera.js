import * as THREE from 'three';

function lerpAngle(current, target, factor) {
  let diff = (target - current) % (Math.PI * 2);
  if (diff < -Math.PI) diff += Math.PI * 2;
  if (diff > Math.PI) diff -= Math.PI * 2;
  return current + diff * factor;
}

export class ThirdPersonCamera {
  constructor(camera, target) {
    this.camera = camera;
    this.target = target;

    this.currentPosition = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();

    this.currentYaw = 0;
    this.manualYaw = 0;
    this.pitch = 0.32;
    this.distance = 11.2;

    this.minPitch = -0.05;
    this.maxPitch = 1.05;
    this.rotateSpeed = 0.003;

    // Sistema de Trauma & Screen Shake
    this.trauma = 0;
    this.shakeDecay = 1.6;
    this.baseFov = 65;

    // Inicializar posiciones si target existe
    if (this.target && this.target.position) {
      const p = this.target.position;
      const initialAngle = Math.atan2(p.x, p.z);
      this.currentYaw = initialAngle;
      this.currentPosition.set(
        p.x + Math.sin(initialAngle) * this.distance,
        p.y + 4.5,
        p.z + Math.cos(initialAngle) * this.distance
      );
      this.currentLookAt.copy(p).add(new THREE.Vector3(0, 0.8, 0));
    }
  }

  get yaw() {
    return this.currentYaw;
  }

  set yaw(val) {
    this.currentYaw = val;
  }

  addTrauma(amount) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  handleMouseMove(deltaX, deltaY) {
    this.manualYaw -= deltaX * this.rotateSpeed;
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch + deltaY * this.rotateSpeed));
  }

  rotateCButtons(direction, dt) {
    this.manualYaw += direction * 2.8 * dt;
  }

  update(dt) {
    // 1. Reducir trauma con el tiempo
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - dt * this.shakeDecay);
    }
    const shake = this.trauma * this.trauma;

    const targetPos = this.target.position.clone().add(new THREE.Vector3(0, 0.8, 0));
    const targetY = targetPos.y;

    // 2. Determinar ángulo deseado de cámara (Modo Órbita Inteligente alrededor del Tronco)
    let desiredYaw;
    if (targetY < 38.0) {
      // En el tronco: órbita cilíndrica natural. La cámara se sitúa radialmente detrás de Froggy.
      const playerOrbitAngle = Math.atan2(targetPos.x, targetPos.z);
      desiredYaw = playerOrbitAngle + this.manualYaw;

      // Si el jugador se desplaza alrededor del árbol, recentrar suavemente el manualYaw
      const isMoving = this.target.velocity && (Math.hypot(this.target.velocity.x, this.target.velocity.z) > 1.2);
      if (isMoving && Math.abs(this.manualYaw) > 0.01) {
        this.manualYaw = THREE.MathUtils.lerp(this.manualYaw, 0, dt * 0.75);
      }
    } else {
      // En la cima (Arena del Jefe): órbita libre o seguimiento en arena abierta
      desiredYaw = this.currentYaw + this.manualYaw;
      this.manualYaw = 0;
    }

    // Suavizado angular sin saltos de 360°
    this.currentYaw = lerpAngle(this.currentYaw, desiredYaw, dt * 6.5);

    // 3. Inclinación dinámica de pitch (durante caídas rápidas mira hacia abajo)
    let currentPitch = this.pitch;
    if (this.target.velocity && this.target.velocity.y < -4.0) {
      const dropFactor = Math.min(Math.abs(this.target.velocity.y) / 25.0, 1.0);
      currentPitch = THREE.MathUtils.lerp(this.pitch, Math.min(this.pitch + 0.18, this.maxPitch), dropFactor);
    }

    // 4. Calcular posición ideal de la cámara
    const hDist = this.distance * Math.cos(currentPitch);
    const vDist = this.distance * Math.sin(currentPitch);

    const offsetX = Math.sin(this.currentYaw) * hDist;
    const offsetZ = Math.cos(this.currentYaw) * hDist;
    const offsetY = vDist;

    let idealCamPos = new THREE.Vector3(
      targetPos.x + offsetX,
      targetPos.y + offsetY,
      targetPos.z + offsetZ
    );

    // 5. Prevención de colisión con el tronco central y anti-oclusión
    if (idealCamPos.y < 39.0) {
      const t = Math.min(Math.max(idealCamPos.y / 40.0, 0), 1.0);
      const currentTrunkRadius = 10.5 - t * 2.0;
      const minCamRadius = currentTrunkRadius + 1.2;

      // Comprobación A: ¿La cámara misma está dentro del tronco?
      const camDistToCenter = Math.hypot(idealCamPos.x, idealCamPos.z);
      if (camDistToCenter < minCamRadius) {
        const nx = idealCamPos.x / Math.max(camDistToCenter, 0.001);
        const nz = idealCamPos.z / Math.max(camDistToCenter, 0.001);
        idealCamPos.x = nx * minCamRadius;
        idealCamPos.z = nz * minCamRadius;
      }

      // Comprobación B: ¿El rayo entre Froggy y la cámara corta el tronco? (Anti-Oclusión)
      const dx = idealCamPos.x - targetPos.x;
      const dz = idealCamPos.z - targetPos.z;
      const rayLenSq = dx * dx + dz * dz;
      if (rayLenSq > 0.01) {
        const rayT = Math.max(0, Math.min(1, -(targetPos.x * dx + targetPos.z * dz) / rayLenSq));
        const closestRayX = targetPos.x + rayT * dx;
        const closestRayZ = targetPos.z + rayT * dz;
        const distRayToCenter = Math.hypot(closestRayX, closestRayZ);

        if (distRayToCenter < currentTrunkRadius + 0.5) {
          // El tronco se interpone: forzar la cámara al vector radial exterior de Froggy
          const pAngle = Math.atan2(targetPos.x, targetPos.z);
          idealCamPos.x = targetPos.x + Math.sin(pAngle) * hDist;
          idealCamPos.z = targetPos.z + Math.cos(pAngle) * hDist;
          this.currentYaw = pAngle;
          this.manualYaw = 0;
        }
      }
    }

    // 6. Look-At dinámico con anticipación (Look-Ahead)
    const lookAtTarget = targetPos.clone();
    if (this.target.velocity) {
      lookAtTarget.x += this.target.velocity.x * 0.12;
      lookAtTarget.z += this.target.velocity.z * 0.12;
      if (this.target.velocity.y < -3.0) {
        lookAtTarget.y += Math.max(-2.2, this.target.velocity.y * 0.07);
      }
    }

    // 7. Interpolación suave
    this.currentPosition.lerp(idealCamPos, dt * 8.0);
    this.currentLookAt.lerp(lookAtTarget, dt * 10.0);

    // 8. Aplicar temblor de pantalla (Screen Shake)
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
