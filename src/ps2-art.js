import * as THREE from 'three';

// Configuración global del Gran Tronco Sagrado (escala monumental estilo PS2)
export const TRUNK_CONFIG = {
  height: 56.0,
  radiusTop: 12.0,
  radiusBottom: 15.0,
  getRadiusAtY(y) {
    const t = Math.min(Math.max(y / this.height, 0), 1.0);
    return this.radiusBottom - t * (this.radiusBottom - this.radiusTop);
  }
};

// Texturas pintadas deterministas estilo PS2 (Jak & Daxter / Sly Cooper)
const cache = new Map();
export function paintedTexture(kind) {
  if (cache.has(kind)) return cache.get(kind);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const c = canvas.getContext('2d');
  let seed = 37;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  if (kind === 'orange_vest') {
    c.fillStyle = '#ff6b00';
    c.fillRect(0, 0, 128, 128);
    // Acolchado horizontal de chaleco político naranja
    for (let y = 0; y < 128; y += 22) {
      c.fillStyle = '#d35400';
      c.fillRect(0, y, 128, 3);
      c.fillStyle = '#ff852b';
      c.fillRect(0, y + 3, 128, 4);
    }
    // Cierre central oscuro
    c.fillStyle = '#222f3e';
    c.fillRect(61, 0, 6, 128);
  } else if (kind === 'ginger_hair') {
    c.fillStyle = '#d35400';
    c.fillRect(0, 0, 128, 128);
    for (let x = 0; x < 128; x += 6) {
      c.fillStyle = (x % 12 === 0) ? '#e67e22' : '#b84200';
      c.fillRect(x, 0, 4, 128);
    }
  } else {
    c.fillStyle = kind === 'bark' ? '#59402b' : '#67a436';
    c.fillRect(0, 0, 128, 128);
    if (kind === 'bark') {
      for (let x = -8; x < 136; x += 9) {
        const bend = rand() * 8;
        c.fillStyle = ['#302e25', '#795536', '#9a6b40', '#4a392a'][Math.floor(rand() * 4)];
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x + 5, 0);
        c.lineTo(x + bend + 3, 64);
        c.lineTo(x + 5, 128);
        c.lineTo(x - 2, 128);
        c.lineTo(x + bend - 2, 64);
        c.fill();
        c.strokeStyle = '#b0814c';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(x + 5, 0);
        c.lineTo(x + bend + 3, 64);
        c.lineTo(x + 5, 128);
        c.stroke();
      }
    }
    for (let i = 0; i < 180; i++) {
      c.fillStyle = kind === 'bark'
        ? (i % 2 ? '#1c302524' : '#e4b16d1c')
        : (i % 2 ? '#2c681c55' : '#cce66b55');
      c.fillRect(
        rand() * 128,
        rand() * 128,
        2 + rand() * 5,
        kind === 'bark' ? 3 + rand() * 12 : 2 + rand() * 4
      );
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  if (kind === 'bark') tex.repeat.set(8, 4);
  cache.set(kind, tex);
  return tex;
}

export function glowTexture() {
  if (cache.has('glow')) return cache.get('glow');
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, '#fff9db');
  g.addColorStop(0.12, '#ffe5a7cc');
  g.addColorStop(0.4, '#ffb64338');
  g.addColorStop(1, '#ff9b0000');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set('glow', t);
  return t;
}

export function dressTrunk(mesh) {
  const { height, radiusTop, radiusBottom } = TRUNK_CONFIG;
  const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 40, 18).toNonIndexed();
  const p = geo.attributes.position;
  const colors = [];
  const shade = new THREE.Color();

  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const a = Math.atan2(z, x);

    // Relieve orgánico de corteza + raíces contrafuertes en la base (y cerca de -height/2)
    const normY = (y + height * 0.5) / height; // 0 en la base, 1 en la cima
    const rootFlare = normY < 0.12 ? Math.pow(1 - normY / 0.12, 2) * 0.08 * (0.5 + 0.5 * Math.cos(a * 7)) : 0;
    const ridge = 0.972 + 0.028 * Math.cos(a * 16) + 0.014 * Math.sin(y * 0.45 + a * 5) + rootFlare;
    p.setXYZ(i, x * ridge, y, z * ridge);

    // Sombreado por vértice estilo PS2 (más musgoso abajo, madera cálida arriba)
    const mossFactor = normY < 0.18 ? (1 - normY / 0.18) * 0.18 : 0;
    const wave = Math.sin(a * 7) ** 2;
    shade.setRGB(
      0.68 + 0.18 * wave - mossFactor * 0.22,
      0.64 + 0.16 * wave + mossFactor * 0.08,
      0.51 + 0.14 * wave - mossFactor * 0.15
    );
    colors.push(shade.r, shade.g, shade.b);
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  mesh.geometry.dispose();
  mesh.geometry = geo;
  mesh.material.map = paintedTexture('bark');
  mesh.material.color.setHex(0xffffff);
  mesh.material.vertexColors = true;
}

export function dressPlatforms(platforms) {
  const edgeMat = new THREE.MeshLambertMaterial({ color: 0x5d432a, flatShading: true });
  const bandMat = new THREE.MeshLambertMaterial({ color: 0xc2914b, flatShading: true });
  for (const p of platforms) {
    const m = p.mesh;
    if (!m?.isMesh || m.geometry.type !== 'CylinderGeometry' || m.position.y > TRUNK_CONFIG.height - 1) continue;
    const { radiusTop: r, height: h } = m.geometry.parameters;
    if (r < 2.8 || r > 5.5) continue;
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.99, r * 0.72, 0.95, 14), edgeMat);
    skirt.position.y = -h / 2 - 0.45;
    m.add(skirt);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r * 0.95, 0.075, 4, 24), bandMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = h / 2 + 0.015;
    m.add(rim);
  }
}
