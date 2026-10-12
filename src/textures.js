import * as THREE from 'three';

// Generador de texturas procedurales estilo N64 / Rareware con efecto pixelado crunch
export const Textures = {
  // Corteza de árbol grueso
  createTreeBark() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#4a2e16';
    ctx.fillRect(0, 0, 64, 64);
    
    // Franjas de corteza
    for (let x = 0; x < 64; x += 4) {
      const shade = Math.sin(x * 0.4) * 20;
      ctx.fillStyle = `rgb(${74 + shade}, ${46 + shade * 0.7}, ${22 + shade * 0.4})`;
      ctx.fillRect(x, 0, 3, 64);
    }
    
    // Nudos y grietas pixeladas
    for (let i = 0; i < 20; i++) {
      const rx = (i * 17) % 64;
      const ry = (i * 23) % 64;
      ctx.fillStyle = '#2b1706';
      ctx.fillRect(rx, ry, 4, 8);
      ctx.fillStyle = '#6b4220';
      ctx.fillRect(rx + 2, ry + 1, 2, 6);
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
  },

  // Anillos del tocón talado con marcas de motosierra
  createWoodRings() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(0, 0, 128, 128);
    
    // Anillos concéntricos
    ctx.lineWidth = 2;
    for (let r = 8; r < 60; r += 5) {
      ctx.strokeStyle = (r % 10 === 0) ? '#a9714b' : '#bc8a5f';
      ctx.beginPath();
      ctx.arc(64, 64, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Grietas y marcas de sierra corporativa
    ctx.strokeStyle = '#4a2810';
    ctx.lineWidth = 1;
    for (let a = 0; a < Math.PI * 2; a += 0.8) {
      ctx.beginPath();
      ctx.moveTo(64, 64);
      ctx.lineTo(64 + Math.cos(a) * 58, 64 + Math.sin(a) * 58);
      ctx.stroke();
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
  },

  // Textura de hoja estilizada de selva
  createLeafTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Verde base vibrante estilo N64
    ctx.fillStyle = '#38b000';
    ctx.fillRect(0, 0, 64, 64);
    
    // Nervadura central
    ctx.fillStyle = '#70e000';
    ctx.fillRect(30, 0, 4, 64);
    
    // Nervaduras laterales diagonales
    ctx.strokeStyle = '#9ef01a';
    ctx.lineWidth = 2;
    for (let y = 8; y < 64; y += 10) {
      ctx.beginPath();
      ctx.moveTo(32, y);
      ctx.lineTo(8, y - 6);
      ctx.moveTo(32, y);
      ctx.lineTo(56, y - 6);
      ctx.stroke();
    }
    
    // Borde sombreado cartoon
    ctx.strokeStyle = '#007200';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 64, 64);
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
  },

  // Metal industrial TALACORP con franjas de peligro amarillo/negro
  createHazardMetal() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#495057';
    ctx.fillRect(0, 0, 64, 64);
    
    // Franja de peligro
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(0, 20, 64, 24);
    
    ctx.fillStyle = '#111111';
    for (let x = -20; x < 84; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x + 10, 20);
      ctx.lineTo(x + 2, 44);
      ctx.lineTo(x - 8, 44);
      ctx.closePath();
      ctx.fill();
    }
    
    // Remaches y tornillos
    ctx.fillStyle = '#ced4da';
    ctx.fillRect(4, 4, 3, 3);
    ctx.fillRect(57, 4, 3, 3);
    ctx.fillRect(4, 57, 3, 3);
    ctx.fillRect(57, 57, 3, 3);
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
  },

  // Baba tóxica de fumigante verde fosforescente
  createToxicSlime() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 64, 64);
    
    ctx.fillStyle = '#10b981';
    for (let i = 0; i < 8; i++) {
      const x = ((i * 19) % 50) + 7;
      const y = ((i * 27) % 50) + 7;
      const r = (i % 3 + 2) * 3;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.fillStyle = '#a7f3d0';
    for (let i = 0; i < 5; i++) {
      const x = ((i * 23) % 46) + 9;
      const y = ((i * 31) % 46) + 9;
      ctx.fillRect(x, y, 3, 3);
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
  },

  // Sombra de punto (blob shadow)
  createBlobShadow() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
    grad.addColorStop(0, 'rgba(10, 20, 10, 0.7)');
    grad.addColorStop(0.7, 'rgba(10, 20, 10, 0.35)');
    grad.addColorStop(1, 'rgba(10, 20, 10, 0)');
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  },

  // Cartel gigante publicitario estilo municipal / político de Pato Lemus
  createBillboardTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Fondo tablero de construcción
    ctx.fillStyle = '#f5f6fa';
    ctx.fillRect(0, 0, 512, 256);

    // Marco exterior de obra
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#e67e22';
    ctx.strokeRect(6, 6, 500, 244);

    // Encabezado corporativo TALACORP
    ctx.fillStyle = '#d35400';
    ctx.fillRect(12, 12, 488, 44);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ TALACORP INVERSIONES & DESARROLLO ★', 256, 42);

    // Anuncio principal
    ctx.fillStyle = '#c0392b';
    ctx.font = 'bold 32px monospace, sans-serif';
    ctx.fillText('PRÓXIMAMENTE AQUÍ:', 256, 92);

    // Nombre del Centro Comercial y Presidente Pato Lemus
    ctx.fillStyle = '#2c3e50';
    ctx.font = '900 36px monospace, sans-serif';
    ctx.fillText('MEGAMALL & PLAZA', 256, 136);

    ctx.fillStyle = '#27ae60';
    ctx.font = '900 34px monospace, sans-serif';
    ctx.fillText('“PRESIDENTE PATO LEMUS”', 256, 178);

    // Lema de campaña
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(12, 196, 488, 46);
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 20px monospace, sans-serif';
    ctx.fillText('“¡EL PROGRESO NO SE DETIENE!” (100% PAVIMENTADO)', 256, 226);

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.LinearFilter;
    return tex;
  },

  // Franjas diagonales de peligro (Hazard Stripes) amarillo y negro
  createHazardStripes() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(0, 0, 64, 64);

    ctx.fillStyle = '#1e272e';
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.lineTo(16, 0);
    ctx.lineTo(32, 0);
    ctx.lineTo(0, 32);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 48);
    ctx.lineTo(48, 0);
    ctx.lineTo(64, 0);
    ctx.lineTo(0, 64);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(16, 64);
    ctx.lineTo(64, 16);
    ctx.lineTo(64, 32);
    ctx.lineTo(32, 64);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(48, 64);
    ctx.lineTo(64, 48);
    ctx.lineTo(64, 64);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
  }
};
