import fs from 'node:fs';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
import { MeshStandardMaterial } from 'three';
const material=new MeshStandardMaterial(), volume=new MarchingCubes(30,material,false,false,10000);
// A connected cumulus volume with a flatter base and uneven, billowing crest.
for(const [x,y,z,strength] of [[.25,.46,.5,.6],[.4,.5,.48,.9],[.53,.59,.5,.8],[.66,.5,.51,.75],[.78,.44,.49,.4],[.48,.43,.58,.45],[.58,.44,.39,.4]]) volume.addBall(x,y,z,strength,14);
volume.update();
const count=volume.geometry.drawRange.count, positions=volume.geometry.attributes.position.array, normals=volume.geometry.attributes.normal.array;
let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
for(let i=0;i<count*3;i++){const axis=i%3;min[axis]=Math.min(min[axis],positions[i]);max[axis]=Math.max(max[axis],positions[i]);}
const packed=new Int16Array(count*6);
for(let i=0;i<count;i++) {
 for(let axis=0;axis<3;axis++) {
  const index=i*3+axis, center=(min[axis]+max[axis])/2, radius=(max[axis]-min[axis])/2;
  packed[index]=Math.round((positions[index]-center)/radius*32767);
 }
 const adjusted=[0,1,2].map(axis=>normals[i*3+axis]*(max[axis]-min[axis])/2/[.89,.32,.38][axis]);
 const length=Math.hypot(...adjusted)||1;
 for(let axis=0;axis<3;axis++)packed[count*3+i*3+axis]=Math.round(adjusted[axis]/length*32767);
}
const encoded=Buffer.from(packed.buffer).toString('base64');
fs.writeFileSync(new URL('../components/landing/cloud-volume.mjs',import.meta.url),`// Generated offline by scripts/build-cloud-volume.mjs; no meshing during page load.\nimport { BufferGeometry, Float32BufferAttribute } from 'three';\nconst data='${encoded}';\nlet decoded;\nexport function createCloudGeometry(){\n if(!decoded){const raw=atob(data), bytes=Uint8Array.from(raw,c=>c.charCodeAt(0)), view=new DataView(bytes.buffer), count=${count};const positions=new Float32Array(count*3), normals=new Float32Array(count*3);for(let i=0;i<count*3;i++){positions[i]=view.getInt16(i*2,true)/32767*[.89,.32,.38][i%3];normals[i]=view.getInt16((count*3+i)*2,true)/32767;}decoded={positions,normals};}\n const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(decoded.positions,3));geometry.setAttribute('normal',new Float32BufferAttribute(decoded.normals,3));return geometry;\n}\n`);
volume.geometry.dispose();material.dispose();console.log(`Cloud: ${count/3} triangles; ${Math.round(encoded.length/1024)}KB source, generated offline.`);
