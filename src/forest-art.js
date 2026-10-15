import * as THREE from 'three';
import { glowTexture } from './ps2-art.js';
import { createLemusBanner } from './banner.js';

export function buildForestAtmosphere(scene) {
  const animated = [];
  let time = 0;
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
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture(),color:0xffc366,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
    halo.scale.set(3.3,3.3,1); lantern.add(halo);
    animated.push({lantern,halo,phase:i*1.7});
    if (i < 3) {
      const light = new THREE.PointLight(0xffbb62, 13, 12, 1.5);
      light.position.set(x, y, z);
      scene.add(light);
    }
  });
  // Layered canopy clusters share one instanced mesh, including on mobile.
  const foliage = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),
    new THREE.MeshLambertMaterial({color:0x527b3a,flatShading:true}), 180);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  for(let i=0;i<180;i++) {
    const angle=i*2.39996, radius=24+(i%13)*2.9;
    const y=i<110 ? 1+(i%7)*1.5 : 35+(i%9)*2.4;
    dummy.position.set(Math.sin(angle)*radius,y,Math.cos(angle)*radius);
    dummy.scale.set(2.4+(i%3),1.4+(i%4)*.4,2.8+(i%5)*.4);
    dummy.rotation.set(i*.3,i*.7,i*.1);dummy.updateMatrix();
    foliage.setMatrixAt(i,dummy.matrix);
    color.setHex([0x3b673e,0x507c40,0x2d5946,0x77954b][i%4]);foliage.setColorAt(i,color);
  }
  scene.add(foliage);
  const motesGeo = new THREE.BufferGeometry();
  const positions=[];
  for(let i=0;i<70;i++){const a=i*2.39996,r=15+i%18;positions.push(Math.sin(a)*r,2+(i*7%40),Math.cos(a)*r);}
  motesGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const motes=new THREE.Points(motesGeo,new THREE.PointsMaterial({color:0xffd37b,size:.12,transparent:true,opacity:.7,depthWrite:false}));
  scene.add(motes);
  return { update(dt) {
    time+=dt;
    for(const {lantern,halo,phase} of animated){
      lantern.rotation.z=Math.sin(time*.8+phase)*.015;
      halo.material.opacity=.7+Math.sin(time*2.1+phase)*.12;
    }
    motes.rotation.y=time*.008;
    motes.position.y=Math.sin(time*.4)*.35;
  }};
}
