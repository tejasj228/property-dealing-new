import { BoxGeometry, CatmullRomCurve3, ConeGeometry, CylinderGeometry, ExtrudeGeometry, Group, InstancedMesh, Mesh, MeshStandardMaterial, Object3D, Shape, TubeGeometry, Vector3 } from 'three';
import { createDetailKit } from './scene-details.mjs';
import { disposeSpatialModel } from './spatial-models.mjs';
import { layoutProperties, mapBounds, mapRandom, mapSeed } from './property-map-layout.mjs';
import { addMapArchitecture, mapArchitectureKind } from './map-architecture.mjs';
export { layoutProperties } from './property-map-layout.mjs';
export const propertyColours = { residential: '#44886a', commercial: '#c58a51', other: '#798994' };

export function framePropertyMapCamera(camera, width, height, bounds, angle = .16, zoom = 1) {
  if (!width || !height) return;
  const size = typeof bounds === 'number' ? { width: 22, depth: bounds } : bounds;
  const distance = Math.max(30, Math.max(size.width, size.depth) * 1.7), elevation = Math.atan(.95), aspect = width / height;
  camera.far = distance * 4;
  camera.position.set(Math.sin(angle) * distance, distance * .95, Math.cos(angle) * distance); camera.lookAt(0, .3, 0);
  const projectedWidth = (size.width * Math.cos(angle) + size.depth * Math.abs(Math.sin(angle))) / 2;
  const projectedHeight = (size.depth * Math.cos(angle) + size.width * Math.abs(Math.sin(angle))) * Math.sin(elevation) / 2 + 1.8;
  const horizontalPadding = Math.min(60, width * .12), verticalPadding = 55;
  const halfWidth = Math.max(projectedWidth / (1 - 2 * horizontalPadding / width), projectedHeight * aspect / (1 - 2 * verticalPadding / height)) / zoom;
  camera.left = -halfWidth; camera.right = halfWidth; camera.top = halfWidth / aspect; camera.bottom = -halfWidth / aspect;
  camera.updateProjectionMatrix(); camera.updateMatrixWorld();
}
const outlines = [
  [[-1.8,-1.1],[1.65,-1.1],[1.8,.9],[-1.5,1.1]],
  [[-1.6,-1.2],[1.7,-.95],[1.4,1.15],[-1.7,1]],
  [[-1.65,-.8],[-1.1,-1.2],[1.7,-1],[1.7,.85],[.95,1.2],[-1.65,1.05]],
  [[-1.7,-1.1],[.85,-1.1],[1.7,-.35],[1.4,1.1],[-1.7,1.1]],
  [[-1.45,-1.2],[1.55,-1.2],[1.8,.2],[.8,1.2],[-1.8,.85]],
];
function parcelGeometry(points) {
  const shape = new Shape(); points.forEach(([x,z],i) => i ? shape.lineTo(x,-z) : shape.moveTo(x,-z)); shape.closePath();
  const geometry = new ExtrudeGeometry(shape, { depth:.14, bevelEnabled:false }); geometry.rotateX(-Math.PI / 2); return geometry;
}
export function createPropertyMapModel(properties, compact = false) {
  const model = new Group(), kit = createDetailKit(), plots = layoutProperties(properties), bounds = mapBounds(plots);
  const { width, depth } = bounds;
  kit.box(model, 'stone', [width,.6,depth], [0,-.4,0]); kit.box(model, 'grass', [width-.2,.1,depth-.2], [0,-.03,0]);
  const roadMaterial = new MeshStandardMaterial({ color:'#acbcb0',roughness:1 }), dashMaterial = new MeshStandardMaterial({ color:'#e8eee1',roughness:1 });
  const dashGeometry = new BoxGeometry(.24,.012,.05), markerGeometry = new CylinderGeometry(.18,.28,.07,12);
  const plotGeometries = outlines.map(parcelGeometry), colours = Object.fromEntries(Object.entries(propertyColours).map(([key,color]) => [key,new MeshStandardMaterial({color,roughness:.9})]));
  const cars = [], rows = [...new Set(plots.map(plot => plot.gz))].sort((a,b)=>a-b);
  const centerZ = plots.length ? plots[0].gz * 6.2 - plots[0].z : 0;
  for (const [index,row] of rows.entries()) {
    const seed = mapSeed('street-'+row), z = row * 6.2 - centerZ + 2.5;
    const curve = new CatmullRomCurve3(Array.from({length:7},(_,i)=>new Vector3(-width/2+.25+i*(width-.5)/6,.06,z+(mapRandom(seed,i)-.5)*.8)));
    const road = new Mesh(new TubeGeometry(curve,compact?32:52,.47,6,false),roadMaterial); road.scale.y=.07; road.position.y=.1; model.add(road);
    for(let i=1;i<Math.min(80,Math.ceil(width*1.5));i++) { const t=i/Math.min(80,Math.ceil(width*1.5)), p=curve.getPoint(t), tangent=curve.getTangent(t), dash=new Mesh(dashGeometry,dashMaterial);dash.position.set(p.x,.15,p.z);dash.rotation.y=-Math.atan2(tangent.z,tangent.x);model.add(dash); }
    if(index<4) cars.push({car:kit.car(model,0,z,Math.PI/2,index%2?'green':'ivory'),curve});
  }
  // A meandering side lane joins the district roads; each block has a different frontage.
  if(rows.length>1) {
    const side = new CatmullRomCurve3(Array.from({length:rows.length+1},(_,i)=>new Vector3(width/2-2.3+Math.sin(i*1.8)*.3,.06,-depth/2+1.5+i*(depth-3)/(rows.length))));
    const road=new Mesh(new TubeGeometry(side,Math.min(100,rows.length*12),.38,6,false),roadMaterial);road.scale.y=.07;road.position.y=.1;model.add(road);
  }
  const markerPositions = [], structures = [];
  for(const plot of plots) {
    const group = new Group();group.position.set(plot.x,0,plot.z);group.rotation.y=plot.rotation;group.scale.set(plot.scaleX,1,plot.scaleZ);model.add(group);
    const base=new Mesh(plotGeometries[plot.shape],kit.materials.ivory);base.scale.set(1.055,.45,1.075);base.position.y=.04;group.add(base);
    const tile=new Mesh(plotGeometries[plot.shape],colours[plot.type]||colours.other);tile.position.y=.1;group.add(tile);
    for(const [x,z] of outlines[plot.shape]) kit.box(group,'ivory',[.045,.27,.045],[x,.29,z]);
    const kind = mapArchitectureKind(properties[plot.index], plot.seed);
    const roofHeight = addMapArchitecture(kit, group, { kind, seed:plot.seed, compact });
    const markerHeight = kind === 'plot' ? .75 : roofHeight + .38;
    const pin=new Mesh(markerGeometry,colours[plot.type]||colours.other);pin.position.set(plot.x,markerHeight-.08,plot.z);model.add(pin);
    kit.box(model,'ivory',[.025,.3,.025],[plot.x,markerHeight-.22,plot.z]);
    markerPositions.push({...plot,position:new Vector3(plot.x,markerHeight,plot.z)});
    structures.push({id:plot.id,kind});
  }
  // A small unmarked residential corner keeps the setting varied even with only
  // one or two published listings. It is scenery, not an invented property.
  const neighbourhood = new Group(); neighbourhood.position.set(width/2-3.6,0,-depth/2+2.1);
  neighbourhood.scale.setScalar(.72); neighbourhood.rotation.y=-.12; model.add(neighbourhood);
  addMapArchitecture(kit,neighbourhood,{kind:'building',seed:0,compact});
  // Scenery is a conceptual model, not a claim about a listing's actual amenities.
  const treeCount=Math.min(compact?22:38,Math.max(16,plots.length*2+10));
  for(let i=0;i<treeCount;i++) {
    const seed=mapSeed('tree-'+i), side=i%4, t=mapRandom(seed,1), inset=1+mapRandom(seed,2)*.8;
    let x=side<2?-width/2+1+t*(width-2):(side===2?-width/2+inset:width/2-inset);
    let z=side<2?(side===0?-depth/2+inset:depth/2-inset):-depth/2+1+t*(depth-2);
    const scale=.55+mapRandom(seed,3)*.55; kit.tree(model,x,z,scale);
    const crown=model.children[model.children.length-1];crown.scale.set(.75+mapRandom(seed,4)*.6,.8+mapRandom(seed,5)*.7,.8+mapRandom(seed,6)*.4);crown.rotation.y=mapRandom(seed,7)*Math.PI;
  }
  kit.round(model,'water',[1.1,.025,.6],[-width/2+2.5,.09,-depth/2+2]); kit.bench(model,-width/2+3.6,-depth/2+1.8,-.2);
  const grass = new InstancedMesh(new ConeGeometry(.05,.3,3),new MeshStandardMaterial({color:'#719566',roughness:1}),compact?90:180);grass.name='map-grass';model.add(grass);
  const blade = new Object3D(), grassSpots=Array.from({length:grass.count},(_,i)=>{
    const seed=mapSeed('grass-'+i), edge=i%4,t=mapRandom(seed,0), inset=.4+mapRandom(seed,1)*.5;
    return {x:edge<2?-width/2+1+t*(width-2):(edge===2?-width/2+inset:width/2-inset),z:edge<2?(edge===0?-depth/2+inset:depth/2-inset):-depth/2+1+t*(depth-2),scale:.6+mapRandom(seed,2)*.7};
  });
  function update(seconds,reduced) {
    kit.animate(seconds,reduced);
    grassSpots.forEach((spot,i)=>{blade.position.set(spot.x,.16,spot.z);blade.scale.setScalar(spot.scale);blade.rotation.set(0,i*2.4,reduced?.06:Math.sin(seconds*1.2+i*.4)*.14);blade.updateMatrix();grass.setMatrixAt(i,blade.matrix);});grass.instanceMatrix.needsUpdate=true;
    cars.forEach(({car,curve},i)=>{const t=reduced?.28+i*.05:(seconds*.022+i*.27+.1)%1,p=curve.getPoint(t),tangent=curve.getTangent(t);car.position.set(p.x,.14,p.z);car.rotation.y=Math.atan2(tangent.x,tangent.z);car.scale.setScalar(Math.min(1,t*20,(1-t)*20));car.userData.wheels.forEach(wheel=>{wheel.rotation.x=reduced?0:seconds*2;});});
  }
  // Preserve animated cars, branches and light pools while batching every static parcel.
  model.updateMatrixWorld(true);const batches=new Map();
  model.traverse(object=>{if(!object.isMesh||object.isInstancedMesh||object.userData.nightOnly)return;for(let parent=object.parent;parent;parent=parent.parent)if(parent.userData.animated)return;const key=object.geometry.uuid+':'+object.material.uuid;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(object);});
  for(const meshes of batches.values()){if(meshes.length<2)continue;const batch=new InstancedMesh(meshes[0].geometry,meshes[0].material,meshes.length);meshes.forEach((mesh,i)=>{batch.setMatrixAt(i,mesh.matrixWorld);mesh.removeFromParent();});batch.instanceMatrix.needsUpdate=true;model.add(batch);}
  update(0,true);
  return {model,markerPositions,structures,bounds,depth,update,dispose:()=>disposeSpatialModel(model,{geometries:[...kit.resources.geometries,markerGeometry,...plotGeometries],materials:[...kit.resources.materials,roadMaterial,dashMaterial,...Object.values(colours)]})};
}
