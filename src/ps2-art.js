import * as THREE from 'three';

// Small, deterministic painted textures; shared across the scene.
const cache = new Map();
export function paintedTexture(kind) {
  if (cache.has(kind)) return cache.get(kind);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const c = canvas.getContext('2d');
  let seed = 37;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  c.fillStyle = kind === 'bark' ? '#59402b' : '#67a436';
  c.fillRect(0, 0, 128, 128);
  if (kind === 'bark') {
    for (let x = -8; x < 136; x += 9) {
      const bend = rand() * 8;
      c.fillStyle = ['#302e25', '#795536', '#9a6b40', '#4a392a'][Math.floor(rand()*4)];
      c.beginPath(); c.moveTo(x,0); c.lineTo(x+5,0); c.lineTo(x+bend+3,64); c.lineTo(x+5,128); c.lineTo(x-2,128); c.lineTo(x+bend-2,64); c.fill();
      c.strokeStyle = '#b0814c'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(x+5,0); c.lineTo(x+bend+3,64); c.lineTo(x+5,128); c.stroke();
    }
  }
  for (let i=0;i<180;i++) {
    c.fillStyle = kind === 'bark' ? (i%2 ? '#1c30251c' : '#e4b16d18') : (i%2 ? '#2c681c55' : '#cce66b55');
    c.fillRect(rand()*128,rand()*128,2+rand()*5,kind==='bark'?3+rand()*12:2+rand()*4);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  if (kind==='bark') tex.repeat.set(6,3);
  cache.set(kind,tex);
  return tex;
}

export function glowTexture() {
  if(cache.has('glow')) return cache.get('glow');
  const c=document.createElement('canvas'); c.width=c.height=64;
  const ctx=c.getContext('2d');
  const g=ctx.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'#fff9db');g.addColorStop(.12,'#ffe5a7cc');g.addColorStop(.4,'#ffb64338');g.addColorStop(1,'#ff9b0000');
  ctx.fillStyle=g;ctx.fillRect(0,0,64,64);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;cache.set('glow',t);return t;
}

export function dressTrunk(mesh) {
  // All relief stays inside the existing circular collision envelope.
  const geo=new THREE.CylinderGeometry(8.5,10.5,40,32,12).toNonIndexed();
  const p=geo.attributes.position, colors=[];
  const shade=new THREE.Color();
  for(let i=0;i<p.count;i++) {
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x);
    const ridge=.975+.025*Math.cos(a*16)+.012*Math.sin(y*.6+a*5);
    p.setXYZ(i,x*ridge,y,z*ridge);
    shade.setRGB(.70+.18*Math.sin(a*7)**2,.65+.16*Math.sin(a*7)**2,.53+.14*Math.sin(a*7)**2);
    colors.push(shade.r,shade.g,shade.b);
  }
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
  mesh.geometry.dispose();mesh.geometry=geo;
  mesh.material.map=paintedTexture('bark');mesh.material.color.setHex(0xffffff);mesh.material.vertexColors=true;
}

export function dressPlatforms(platforms) {
  const edgeMat=new THREE.MeshLambertMaterial({color:0x5d432a,flatShading:true});
  const bandMat=new THREE.MeshLambertMaterial({color:0xc2914b,flatShading:true});
  for(const p of platforms) {
    const m=p.mesh;
    if(!m?.isMesh || m.geometry.type!=='CylinderGeometry' || m.position.y>39) continue;
    const {radiusTop:r,height:h}=m.geometry.parameters;
    if(r<3 || r>4) continue;
    const skirt=new THREE.Mesh(new THREE.CylinderGeometry(r*.99,r*.72,.85,12),edgeMat);
    skirt.position.y=-h/2-.4;m.add(skirt);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(r*.95,.065,3,24),bandMat);
    rim.rotation.x=Math.PI/2;rim.position.y=h/2+.012;m.add(rim);
  }
}
