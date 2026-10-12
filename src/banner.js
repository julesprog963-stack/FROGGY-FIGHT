import * as THREE from 'three';
import bannerUrl from './assets/pato-lemus-banner.webp';

let sharedTexture;

function getBannerTexture() {
  if (sharedTexture) return sharedTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#12682c';
  ctx.fillRect(0, 0, 256, 512);
  sharedTexture = new THREE.CanvasTexture(canvas);
  sharedTexture.colorSpace = THREE.SRGBColorSpace;
  sharedTexture.magFilter = THREE.NearestFilter;
  const image = new Image();
  image.onload = () => {
    // Pad with the artwork's cloth edge; keep the duck emblem square.
    ctx.drawImage(image, 0, 0, image.width, 8, 0, 0, 256, 512);
    ctx.drawImage(image, 0, 90, 256, 256);
    sharedTexture.needsUpdate = true;
  };
  image.src = bannerUrl;
  return sharedTexture;
}

export function createLemusBanner(width = 2, height = 4) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, height / 2);
  shape.lineTo(width / 2, height / 2);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(0, -height / 2 + height * 0.17);
  shape.lineTo(-width / 2, -height / 2);
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape);
  const positions = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < positions.count; i++) {
    uv.setXY(i, positions.getX(i) / width + 0.5, positions.getY(i) / height + 0.5);
  }
  const banner = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
    map: getBannerTexture(), side: THREE.DoubleSide,
    emissive: 0x123b1c, emissiveIntensity: 0.16
  }));
  banner.name = 'pato-lemus-banner';
  return banner;
}
