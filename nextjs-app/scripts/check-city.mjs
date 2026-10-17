import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Raycaster, Vector2, Vector3, Matrix4 } from 'three';
import { createCity, createCityCamera, frameCityCamera } from '../components/landing/city-model.mjs';
import { CITY_DISTRICTS } from '../components/landing/city-districts.mjs';
test('city selection resolves projected clicks and highlights the matching category',()=>{
 const city=createCity(),camera=createCityCamera();frameCityCamera(camera,1000,700);city.model.updateMatrixWorld(true);
 for(const type of CITY_DISTRICTS){
  const hit=city.hitAreas.find(mesh=>mesh.userData.cityZone===type.id);
  const position=hit.getWorldPosition(new Vector3()).project(camera),ray=new Raycaster();ray.setFromCamera(new Vector2(position.x,position.y),camera);
  assert.equal(ray.intersectObjects(city.hitAreas,false)[0].object.userData.cityZone,type.id);
  city.select(type.id);let selected=0;city.model.traverse(o=>{if(o.name==='district-selection'&&o.visible){assert.equal(o.parent.userData.cityZone,type.id);selected++;}});assert.ok(selected>0);
  assert.ok(type.href.startsWith('/properties'));
 }
 city.select(null);city.model.traverse(o=>{if(o.name==='district-selection')assert.equal(o.visible,false);});city.dispose();
});
test('city fits desktop and mobile frames across drag limits',()=>{
 const city=createCity(),camera=createCityCamera();
 for(const aspect of [.8,1.4,2.2,3])for(const yaw of [-.92,0,.92])for(const pitch of [-.18,.18]) {
  city.update(.5,false,12);city.model.rotation.y+=yaw;city.model.rotation.x=pitch;city.model.updateMatrixWorld(true);frameCityCamera(camera,aspect*1000,1000);
  city.model.traverse(o=>{
   if(!o.isMesh||o.material.visible===false)return;
   if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();const bounds=o.geometry.boundingBox;
   for(let i=0;i<(o.isInstancedMesh?o.count:1);i++){
    const matrix=new Matrix4();if(o.isInstancedMesh){o.getMatrixAt(i,matrix);matrix.premultiply(o.matrixWorld);}else matrix.copy(o.matrixWorld);
    const positions=o.geometry.attributes.position;
    const vertices=o.isInstancedMesh?null:Array.from({length:positions.count},(_,v)=>new Vector3().fromBufferAttribute(positions,v));
    const corners=[];if(!vertices)for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])corners.push(new Vector3(x,y,z));
    for(const vertex of vertices||corners){
     const point=vertex.clone().applyMatrix4(matrix).project(camera);assert.ok(Math.abs(point.x)<.99&&Math.abs(point.y)<.99,`city bounds ${aspect} ${point.x},${point.y}`);
    }
   }
  });
 }
 city.dispose();
});
test('city motion freezes with reduced motion and resources release once',()=>{
 const city=createCity({compact:true});const snapshots=[];
 for(const t of [0,5,50]){city.update(t/50,true,t);city.model.updateMatrixWorld(true);const pose=[];city.model.traverse(o=>pose.push(...o.matrixWorld.elements));snapshots.push(pose);}
 assert.deepEqual(snapshots[0],snapshots[1]);assert.deepEqual(snapshots[0],snapshots[2]);
 const resources=new Set();let draws=0;city.model.traverse(o=>{if(o.geometry)resources.add(o.geometry);if(o.material)resources.add(o.material);if(o.isMesh)draws++;});
 assert.ok(draws<400,`bounded city draws: ${draws}`);
 const disposed=new Map();resources.forEach(r=>r.addEventListener('dispose',()=>disposed.set(r,(disposed.get(r)||0)+1)));
 city.dispose();resources.forEach(r=>assert.equal(disposed.get(r),1));
});

test('expanded city has stable irregular land, varied plots and distinct architectural forms',()=>{
 const a=createCity(),b=createCity();assert.equal(a.hitAreas.length,18);
 const forms=['cylindrical-office','terraced-office','pitched-roof-home','courtyard-villa','warehouse-and-showroom','apartment-building'];
 forms.forEach(name=>assert.ok(a.model.getObjectByName(name),name));
 const land=a.model.getObjectByName('irregular-city-foundation');
 assert.deepEqual(land.geometry.attributes.position.array,b.model.getObjectByName('irregular-city-foundation').geometry.attributes.position.array);
 const plots=[];let roads=0;
 a.model.traverse(o=>{if(o.name==='surveyed-irregular-plot')plots.push(o.geometry);if(o.name==='curved-road')roads++;});
 assert.ok(plots.length>=15);assert.ok(roads>=5);
 assert.ok(new Set(plots.map(g=>Array.from(g.attributes.position.array).join(','))).size>8);
 for(const g of plots){assert.ok(Array.from(g.attributes.normal.array).every(Number.isFinite));}
 a.dispose();b.dispose();
});
