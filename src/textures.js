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

  // Cartel gigante publicitario estilo estatal / político de Pato Lemus (Gobernador)
  createBillboardTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Fondo blanco/naranja de obra estatal
    ctx.fillStyle = '#fff7ed';
    ctx.fillRect(0, 0, 512, 256);

    // Marco exterior naranja vibrante
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#ff6b00';
    ctx.strokeRect(6, 6, 500, 244);

    // Encabezado corporativo TALACORP & GOBIERNO
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(12, 12, 488, 44);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 21px monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ GOBIERNO DEL PANTANO & TALACORP ★', 256, 41);

    // Retrato 2D de Pato Lemus a la izquierda del cartel
    // Camisa blanca y chaleco naranja
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(30, 145, 92, 55);
    ctx.fillStyle = '#ff6b00';
    ctx.fillRect(42, 145, 68, 55);
    // Cabeza de pato blanca
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(76, 112, 32, 0, Math.PI * 2);
    ctx.fill();
    // Cabello pelirrojo/cobrizo peinado de lado
    ctx.fillStyle = '#d35400';
    ctx.beginPath();
    ctx.arc(74, 96, 31, Math.PI, Math.PI * 2.1);
    ctx.fill();
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(52, 74, 52, 16);
    // Pico sonriente naranja
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(92, 108);
    ctx.lineTo(132, 116);
    ctx.lineTo(92, 128);
    ctx.closePath();
    ctx.fill();
    // Ojo azul expresivo
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.arc(86, 104, 5, 0, Math.PI * 2);
    ctx.fill();

    // Textos principales a la derecha
    ctx.fillStyle = '#c2410c';
    ctx.font = 'bold 24px monospace, sans-serif';
    ctx.fillText('OBRA INSIGNIA EN CONSTRUCCIÓN:', 305, 88);

    ctx.fillStyle = '#1e293b';
    ctx.font = '900 32px monospace, sans-serif';
    ctx.fillText('GRAN MEGAMALL', 305, 130);

    ctx.fillStyle = '#ff6b00';
    ctx.font = '900 30px monospace, sans-serif';
    ctx.fillText('“GOBERNADOR PATO LEMUS”', 305, 172);

    // Lema de campaña naranja
    ctx.fillStyle = '#ff6b00';
    ctx.fillRect(12, 196, 488, 46);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 19px monospace, sans-serif';
    ctx.fillText('“¡AL ESTILO TALACORP: 100% CEMENTO Y CERO ÁRBOLES!”', 256, 225);

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
  },

  // Afiche electoral de campaña del Gobernador Pato Lemus (Chaleco naranja y tupé pelirrojo)
  createCampaignPoster1() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');

    // Fondo naranja vibrante de campaña
    ctx.fillStyle = '#ff6b00';
    ctx.fillRect(0, 0, 256, 384);

    // Marco blanco y azul Jalisco
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(5, 5, 246, 374);

    // Encabezado
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ GOBERNADOR DEL PANTANO ★', 128, 40);

    // Fondo circular azul detrás del retrato
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(128, 125, 62, 0, Math.PI * 2);
    ctx.fill();

    // Camisa blanca con mangas arremangadas y chaleco naranja acolchado
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(74, 155, 108, 62);
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(90, 155, 76, 62);
    // Escudo dorado en el chaleco
    ctx.fillStyle = '#facc15';
    ctx.fillRect(140, 168, 14, 16);

    // Cabeza de pato blanca
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(128, 116, 40, 0, Math.PI * 2);
    ctx.fill();

    // Tupé pelirrojo/cobrizo peinado de lado
    ctx.fillStyle = '#d35400';
    ctx.beginPath();
    ctx.arc(125, 96, 38, Math.PI * 0.95, Math.PI * 2.08);
    ctx.fill();
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.moveTo(95, 82);
    ctx.lineTo(165, 68);
    ctx.lineTo(158, 98);
    ctx.closePath();
    ctx.fill();

    // Pico naranja sonriente
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(148, 112);
    ctx.lineTo(202, 122);
    ctx.lineTo(148, 136);
    ctx.closePath();
    ctx.fill();

    // Ojo azul confiado y ceja pelirroja
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.arc(142, 106, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(144, 104, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b84200';
    ctx.fillRect(132, 93, 20, 5);

    // Nombre en letras gigantes
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 30px monospace, sans-serif';
    ctx.fillText('PATO LEMUS', 128, 250);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 17px monospace, sans-serif';
    ctx.fillText('GOBERNADOR 2024 - 2030', 128, 278);

    // Eslogan satírico
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(15, 300, 226, 62);
    ctx.fillStyle = '#ea580c';
    ctx.font = 'bold 14px monospace, sans-serif';
    ctx.fillText('“¡AL ESTILO PANTANO!”', 128, 324);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 12px monospace, sans-serif';
    ctx.fillText('¡PURO CHALECO NARANJA Y MOTOSIERRA!', 128, 346);

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.LinearFilter;
    return tex;
  },

  // Afiche publicitario de progreso TALACORP & Lemus
  createCampaignPoster2() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, 256, 384);

    ctx.lineWidth = 8;
    ctx.strokeStyle = '#f39c12';
    ctx.strokeRect(4, 4, 248, 376);

    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(10, 10, 236, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TALACORP & GOBIERNO', 128, 36);

    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 22px monospace, sans-serif';
    ctx.fillText('CONVIRTIENDO', 128, 85);
    ctx.fillText('CHARCOS EN', 128, 115);
    ctx.font = '900 24px monospace, sans-serif';
    ctx.fillStyle = '#e67e22';
    ctx.fillText('MEGAMALLS', 128, 145);

    // Icono excavadora amarilla simplificada
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(80, 175, 96, 45);
    ctx.fillStyle = '#34495e';
    ctx.fillRect(95, 155, 45, 30);
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(70, 215, 116, 20);

    ctx.fillStyle = '#ecf0f1';
    ctx.font = 'bold 15px monospace, sans-serif';
    ctx.fillText('¡PROGRESO 100% GARANTIZADO!', 128, 275);

    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(15, 305, 226, 50);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px monospace, sans-serif';
    ctx.fillText('PROHIBIDO CROAR', 128, 328);
    ctx.fillText('SIN PERMISO MUNICIPAL', 128, 346);

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.LinearFilter;
    return tex;
  },

  // Cartel satírico de aguas termales / contaminación
  createToxicWaterSign() {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Fondo verde tóxico con borde de peligro
    ctx.fillStyle = '#0652dd';
    ctx.fillRect(0, 0, 384, 256);

    ctx.lineWidth = 10;
    ctx.strokeStyle = '#ff9f1a';
    ctx.strokeRect(5, 5, 374, 246);

    ctx.fillStyle = '#ff3838';
    ctx.fillRect(12, 12, 360, 42);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ RESERVA HIDROLÓGICA MUNICIPAL ⚠', 192, 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px monospace, sans-serif';
    ctx.fillText('“BALNEARIO DEL BIENESTAR”', 192, 85);
    ctx.fillStyle = '#fffa65';
    ctx.font = 'bold 20px monospace, sans-serif';
    ctx.fillText('PROPIEDAD DE PATO LEMUS & TALACORP', 192, 115);

    ctx.fillStyle = '#17c0eb';
    ctx.fillRect(16, 135, 352, 45);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 15px monospace, sans-serif';
    ctx.fillText('AGUA 100% ENRIQUECIDA', 192, 155);
    ctx.font = '12px monospace, sans-serif';
    ctx.fillText('(40% Uranio, 60% Vertido Industrial Aprobado)', 192, 172);

    ctx.fillStyle = '#ff3838';
    ctx.font = 'bold 14px monospace, sans-serif';
    ctx.fillText('“Los peces de 3 ojos son muestra de abundancia”', 192, 215);
    ctx.fillStyle = '#c7ecee';
    ctx.font = '11px monospace, sans-serif';
    ctx.fillText('- Ministerio de Turismo & Desecho -', 192, 235);

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.LinearFilter;
    return tex;
  },

  // Traje diplomático azul marino con rayas finas (Pato Lemus en la referencia)
  createNavyPinstripe() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Azul marino oscuro elegante exacto a la referencia (#1a2842)
    ctx.fillStyle = '#18243b';
    ctx.fillRect(0, 0, 64, 64);

    // Rayas verticales finas en azul grisáceo suave (#4d688a)
    ctx.fillStyle = '#486588';
    for (let x = 3; x < 64; x += 10) {
      ctx.fillRect(x, 0, 1.5, 64);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
  },

  // Corbata oscura con lunares rojos sutiles (Pato Lemus en la referencia)
  createPolkaDotTie() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    // Fondo gris azulado oscuro (#1a222d)
    ctx.fillStyle = '#161d27';
    ctx.fillRect(0, 0, 32, 32);

    // Lunares rojos rubí (#c0392b)
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(8, 8, 2.2, 0, Math.PI * 2);
    ctx.arc(24, 8, 2.2, 0, Math.PI * 2);
    ctx.arc(16, 20, 2.2, 0, Math.PI * 2);
    ctx.arc(8, 28, 2.2, 0, Math.PI * 2);
    ctx.arc(24, 28, 2.2, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
  },

  // Metal industrial con remaches y óxido para los Talabots
  createTalabotMetal() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#353b48';
    ctx.fillRect(0, 0, 64, 64);

    // Franja de peligro amarilla
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(0, 22, 64, 20);
    ctx.fillStyle = '#2f3640';
    for (let x = -10; x < 74; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, 22);
      ctx.lineTo(x + 8, 22);
      ctx.lineTo(x + 2, 42);
      ctx.lineTo(x - 6, 42);
      ctx.fill();
    }

    // Remaches plateados
    ctx.fillStyle = '#dcdde1';
    [6, 58].forEach(x => {
      [6, 58].forEach(y => {
        ctx.fillRect(x, y, 3, 3);
      });
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
  },

  // Letras Z cómica estilo pixel-art para el sueño de Frogbert
  createZzzTexture(text = 'Z') {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 64, 64);

    // Fondo circular suave de burbuja
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.fill();

    // Sombra del texto
    ctx.font = '900 36px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0f2027';
    ctx.fillText(text, 34, 34);

    // Texto celeste brillante
    ctx.fillStyle = '#74b9ff';
    ctx.fillText(text, 32, 32);

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
  }
};
