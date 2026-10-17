import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Raycaster, Vector2, Vector3, Matrix4 } from 'three';
import { createCity, createCityCamera, frameCityCamera, CITY_OVERSCAN } from '../components/landing/city-model.mjs';
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
test('overscanned city fits at maximum zoom across desktop, mobile and drag limits',()=>{
 const city=createCity(),camera=createCityCamera();
 for(const aspect of [.8,1.4,2.2,3])for(const yaw of [-.92,0,.92])for(const pitch of [-.18,.18]) for(const time of [0,12,36,43]) {
  city.update(.5,false,time);city.model.rotation.y+=yaw;city.model.rotation.x=pitch;city.model.updateMatrixWorld(true);frameCityCamera(camera,aspect*1000,1000,CITY_OVERSCAN);camera.zoom=1.45;camera.updateProjectionMatrix();
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
 const a=createCity(),b=createCity();assert.equal(a.hitAreas.length,15);
 const forms=['cylindrical-office','terraced-office','pitched-roof-home','courtyard-villa','warehouse-and-showroom','apartment-building'];
 forms.forEach(name=>assert.ok(a.model.getObjectByName(name),name));
 const land=a.model.getObjectByName('irregular-city-foundation');
 assert.deepEqual(land.geometry.attributes.position.array,b.model.getObjectByName('irregular-city-foundation').geometry.attributes.position.array);
 const plots=[];let roads=0;
 a.model.traverse(o=>{if(o.name==='surveyed-irregular-plot')plots.push(o.geometry);if(o.name==='curved-road')roads++;});
 assert.ok(plots.length>=12);assert.ok(roads>=5);
 assert.ok(new Set(plots.map(g=>Array.from(g.attributes.position.array).join(','))).size>8);
 for(const g of plots){assert.ok(Array.from(g.attributes.normal.array).every(Number.isFinite));}
 a.dispose();b.dispose();
});

const {flightPosition}=await import('../components/landing/city-landmarks.mjs');
const {clearOfRoads}=await import('../components/landing/road-clearance.mjs');
const {createPropertyMapModel}=await import('../components/landing/property-map-model.mjs');
test('airport flight is continuous, lands and stays static under reduced motion',()=>{
 for(let t=0;t<48;t+=.05){const p=flightPosition(t),next=flightPosition(t+.05);assert.ok(p.distanceTo(next)<.3,`flight jump at ${t}`);assert.ok(p.y>=.5);}
 for(const t of [8,11,18,24])assert.equal(flightPosition(t).y,.51);
 assert.ok(flightPosition(36).y>3);assert.deepEqual(flightPosition(0,true),flightPosition(40,true));
 const city=createCity();for(const name of ['airport','airport-aircraft','large-city-park','shopping-mall','indian-street-market'])assert.ok(city.model.getObjectByName(name));city.dispose();
});
test('property map trees avoid all road corridors across inventory sizes',()=>{
 for(const count of [2,6,20,50]){
  const map=createPropertyMapModel(Array.from({length:count},(_,i)=>({id:String(i),propertyType:i%2?'commercial':'residential'})),true);
  let trees=0;map.model.traverse(o=>{if(o.name==='botanical-tree'){trees++;assert.ok(clearOfRoads(o.position.x,o.position.z,.95,map.roadCorridors));}});
  assert.ok(trees>0);map.dispose();
 }
});

test('overscan preserves the city apparent size at normal zoom',()=>{
 const normal=createCityCamera(),expanded=createCityCamera();
 frameCityCamera(normal,1000,700);frameCityCamera(expanded,1700,1190,CITY_OVERSCAN);
 const a=new Vector3(8,2,3).project(normal),b=new Vector3(8,2,3).project(expanded);
 assert.ok(Math.abs(a.x*500-b.x*850)<.00001);assert.ok(Math.abs(a.y*350-b.y*595)<.00001);
});
