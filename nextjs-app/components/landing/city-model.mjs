import { addCityLandmarks } from './city-landmarks.mjs';
import { roadCorridor, clearOfRoads } from './road-clearance.mjs';
import { Box3, Vector2, BoxGeometry, BufferGeometry, CatmullRomCurve3, ExtrudeGeometry, Float32BufferAttribute, Shape, Group, LineLoop, LineBasicMaterial, Mesh, MeshBasicMaterial, OrthographicCamera, Vector3 } from 'three';
import { createDetailKit } from './scene-details.mjs';
import { batchSceneMeshes } from './scene-batching.mjs';
import { disposeSpatialModel } from './spatial-models.mjs';
import { createFleet } from './vehicle-fleet.mjs';
import { addConstructionSite } from './construction-site.mjs';
import { createCrowd } from './city-crowd.mjs';

import { CITY_DISTRICTS } from './city-districts.mjs';

export function createCityCamera() {
  const camera=new OrthographicCamera(-11,11,9,-9,.1,100);
  camera.position.set(17,17,21);camera.lookAt(0,.7,0);camera.updateMatrixWorld();return camera;
}
export const CITY_OVERSCAN = 1.7;
export function frameCityCamera(camera,width,height,overscan=1) {
  const aspect=width/Math.max(1,height), half=Math.max(22,17*aspect)*overscan;
  camera.left=-half;camera.right=half;camera.top=half/aspect;camera.bottom=-half/aspect;camera.updateProjectionMatrix();
}

// A fictional district atlas. These buildings never represent available listings.
export function createCity({compact=false}={}) {
  const world=new Group(),model=new Group();world.name='illustrative-city';world.add(model);
  const t=createDetailKit({compact:true,rounded:false,forest:true}), hitAreas=[], outlines=[], routes=[];let site=null;
  const hitGeometry=new BoxGeometry(1,1,1), hitMaterial=new MeshBasicMaterial({visible:false});
  const extraGeometries=[],roadCorridors=[];
  const parcelLineMaterial=new LineBasicMaterial({color:'#958c74'});
  const outlineMaterial=new LineBasicMaterial({color:'#f5d47c',depthTest:false});
  const b=(material,size,pos,parent=model)=>t.box(parent,material,size,pos);
  const random=n=>{const v=Math.sin(n*127.1+41.7)*43758.5453;return v-Math.floor(v);};
  const warp=(x,z)=>[x+Math.sin(z*.34)*.65,z+Math.sin(x*.24)*.65];
  function parcel(parent,points,material,height=.08,y=.08,name='city-parcel') {
    const shape=new Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
    const geometry=new ExtrudeGeometry(shape,{depth:height,bevelEnabled:false});geometry.rotateX(-Math.PI/2);extraGeometries.push(geometry);
    const mesh=new Mesh(geometry,t.materials[material]);mesh.position.y=y;mesh.name=name;mesh.receiveShadow=true;mesh.castShadow=height>.1;parent.add(mesh);return mesh;
  }
  const boundary=[[-14,-3],[-14,-11],[-12,-18],[8,-18.5],[13.8,-16],[14.2,-10],[12.7,-7.6],[14,-3.8],[13.5,.4],[14.4,4.1],[12.5,7.4],[8.3,9.4],[3.5,9.9],[-.6,9],[-5.1,10],[-9.8,8.3],[-13,5.3],[-13.6,.8]];
  parcel(model,boundary,'stone',.42,-.4,'irregular-city-foundation');
  parcel(model,boundary.map(([x,z])=>[x*.993,z*.993]),'grass',.065,.02,'irregular-city-terrain');
  function ribbon(curve,width,material,y,name) {
    const steps=100, vertices=[],indices=[],uvs=[];
    for(let i=0;i<=steps;i++) {
      const p=curve.getPointAt(i/steps),v=curve.getTangentAt(i/steps),nx=-v.z*width/2,nz=v.x*width/2;
      vertices.push(p.x-nx,y,p.z-nz,p.x+nx,y,p.z+nz);uvs.push(0,i/steps*12,1,i/steps*12);
      if(i<steps){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
    }
    const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();extraGeometries.push(geometry);
    const mesh=new Mesh(geometry,t.materials[material]);mesh.name=name;mesh.receiveShadow=true;model.add(mesh);return mesh;
  }
  function road(points,closed=false,width=.58) {
    const curve=new CatmullRomCurve3(points.map(([x,z])=>new Vector3(x,0,z)),closed,'centripetal');
    roadCorridors.push(roadCorridor(curve,width/2));
    ribbon(curve,width+.22,'stone',.10,'curved-pavement');ribbon(curve,width,'road',.12,'curved-road');
    const count=Math.floor(curve.getLength()/.8);
    for(let i=0;i<count;i++) {const p=curve.getPointAt(i/count),v=curve.getTangentAt(i/count);const dash=b('paint',[.025,.009,.3],[p.x,.132,p.z]);dash.rotation.y=Math.atan2(v.x,v.z);}
    return curve;
  }
  // A winding ring road and offset neighbourhood streets replace the square grid.
  const ring=road([[-12.7,-3],[-11.9,-6.9],[-7.5,-7.9],[-1,-7.7],[5.8,-7.8],[11.6,-6.8],[12.6,-2.8],[12.2,2.8],[11.4,6.7],[6.6,7.8],[.5,7.5],[-5.9,8],[-11.3,6.3],[-12.5,2]],true,.7);
  for(const z of [-2.5,2.5])routes.push(road([-12.5,-8,-4,0,4,8,12.3].map(x=>warp(x,z))));
  for(const x of [-8,-4,0,4,8]) {
    const segments=x===-4?[[-7.7,-5,-2.5]]:x===4?[[-7.7,-5,-2.5],[2.5,5,7.7]]:[[-7.7,-5,-2.5,0,2.5,5,7.7]];
    segments.forEach(zs=>road(zs.map(z=>warp(x,z)),false,.46));
  }
  road([[7.5,-7.8],[8,-9.1],[7,-10]],false,.65);
  // The canal runs between the ring road and the land edge, starting and ending inside the land.
  const river=new CatmullRomCurve3([[-8.8,8.05],[-6.4,8.9],[-2,8.25],[2.8,8.6],[6.4,8.9],[9.4,8.05]].map(([x,z])=>new Vector3(x,0,z)));
  ribbon(river,.55,'stone',.104,'canal-bank');ribbon(river,.4,'water',.115,'curving-canal');
  function tower(parent,x,z,height,office=false,width=1.08) {
    const g=new Group();g.name=office?'office-building':'apartment-building';g.position.set(x,.21,z);parent.add(g);
    b('ivory',[width,height,width],[0,height/2,0],g);
    b('stone',[width+.12,.09,width+.12],[0,height+.05,0],g);
    for(let floor=.3;floor<height-.1;floor+=(compact?.5:.36)) {
      for(const side of [-1,1]) {
        b('glass',[width*.78,.23,.025],[0,floor,side*(width/2+.012)],g);
        b('glass',[.025,.23,width*.72],[side*(width/2+.012),floor,0],g);
        if(!office)b('stone',[width+.11,.045,.17],[0,floor-.13,side*(width/2+.04)],g);
      }
      if(office)b('metal',[width+.025,.025,width+.025],[0,floor-.14,0],g);
    }
    // Facade rhythm: piers split residential strips into rooms, mullions grid the offices,
    // with balcony rails and wall-mounted AC units below some windows.
    const bays=office?[-.36,-.24,-.12,0,.12,.24,.36]:[-.2,0,.2];
    for(let floor=.3,level=0;floor<height-.1;floor+=(compact?.5:.36),level++)for(const side of [-1,1])for(const bay of bays) {
      const pier=office?[.014,.23,.03]:[.032,.23,.04],material=office?'metal':'ivory',offset=width/2+(office?.022:.026);
      b(material,pier,[bay*width,floor,side*offset],g);b(material,[pier[2],pier[1],pier[0]],[side*offset,floor,bay*width],g);
      if(!office&&bay!==0&&random(x*13+z*7+level*3+side+bay*5)>.62)b('silver',[.04,.055,.07],[side*(width/2+.025),floor-.165,bay*width+.07],g);
    }
    if(!office)for(let floor=.3;floor<height-.1;floor+=(compact?.5:.36))for(const side of [-1,1])b('metal',[width+.1,.035,.012],[0,floor-.085,side*(width/2+.12)],g);
    // Parapet, stair headroom, black rooftop water tanks or plant and condenser units.
    for(const side of [-1,1]){b('ivory',[width+.12,.09,.035],[0,height+.14,side*(width/2+.043)],g);b('ivory',[.035,.09,width+.05],[side*(width/2+.043),height+.14,0],g);}
    b('dark',[.25,.25,.3],[-.16,height+.2,0],g);b('metal',[.3,.04,.35],[-.16,height+.34,0],g);
    if(office){for(const dx of [.12,.32]){b('silver',[.15,.1,.17],[dx,height+.15,-.25],g);b('dark',[.11,.012,.11],[dx,height+.206,-.25],g);}b('glass',[.4,.025,.4],[.2,height+.13,.18],g);}
    else for(const [dx,dz] of [[.24,-.22],[.24,.08],[.05,-.3]]){t.round(g,'dark',[.075,.13,.075],[dx*width,height+.165,dz*width]);t.round(g,'dark',[.078,.012,.078],[dx*width,height+.236,dz*width]);}
    b('glass',[.34,.3,.035],[0,.16,width/2+.02],g);b('stone',[.5,.03,.18],[0,.32,width/2+.1],g);
    return g;
  }
  function shop(parent,x,z) {
    const g=tower(parent,x,z,.65,true,1.12);g.name='retail-frontage';
    b('green',[1.22,.065,.4],[0,.58,.61],g);b('ivory',[.6,.11,.025],[0,.51,.62],g);
  }
  function park(parent) {
    b('sand',[.3,.025,3.05],[0,.205,0],parent);b('sand',[3.05,.025,.3],[0,.205,0],parent);
    t.round(parent,'stone',[.52,.08,.52],[0,.25,0]);t.round(parent,'water',[.43,.04,.43],[0,.31,0]);
    for(const x of [-1.05,1.05])for(const z of [-1.05,1.05])t.tree(parent,x,z,.57);
    t.bench(parent,-.7,.38,Math.PI/2);t.bench(parent,.7,-.38,-Math.PI/2);
  }
  function villa(parent,x,z,modern=false) {
    const g=new Group();g.name=modern?'courtyard-villa':'pitched-roof-home';g.position.set(x,.21,z);parent.add(g);
    b('ivory',[.95,.62,.86],[0,.31,0],g);b('glass',[.67,.34,.025],[0,.33,.44],g);
    b('trunk',[.14,.52,.04],[.37,.28,.46],g);
    if(!modern) {
      // Low compound wall with a gate opening on the street side.
      for(const side of [-1,1]){b('stone',[.035,.14,1.12],[side*.6,.07,.05],g);b('stone',[.42,.14,.035],[side*.39,.07,.6],g);}
      b('stone',[1.24,.14,.035],[0,.07,-.5],g);b('metal',[.36,.1,.012],[0,.08,.6],g);
    }
    if(modern) {
      t.round(g,'dark',[.06,.1,.06],[-.38,1.2,-.3]);
      b('stone',[1.05,.07,1],[0,.67,0],g);b('ivory',[.42,.4,.6],[-.26,.9,-.12],g);
      b('glass',[.43,.26,.03],[-.26,.91,.19],g);b('stone',[.55,.06,.72],[-.26,1.12,-.12],g);
      b('trunk',[.6,.04,.55],[.38,.15,.67],g);
      for(let i=0;i<5;i++)b('trunk',[.035,.04,.6],[.12+i*.13,.64,.67],g);
    } else {
      for(const side of [-1,1]) {const roof=b('trunk',[.64,.07,1.08],[side*.25,.76,0],g);roof.rotation.z=-side*.48;}
      b('stone',[.14,.34,.16],[-.24,.9,-.22],g);
    }
    return g;
  }
  function roundTower(parent,x,z,height) {
    const g=new Group();g.name='cylindrical-office';g.position.set(x,.21,z);parent.add(g);
    t.round(g,'glass',[.59,height,.59],[0,height/2,0]);
    for(let y=.2;y<=height;y+=.38)t.round(g,'ivory',[.62,.055,.62],[0,y,0]);
    for(let a=0;a<Math.PI*2;a+=Math.PI/4)b('metal',[.026,height,.026],[Math.cos(a)*.6,height/2,Math.sin(a)*.6],g);
    t.round(g,'stone',[.65,.1,.65],[0,height+.04,0]);b('metal',[.035,.7,.035],[0,height+.39,0],g);
  }
  function steppedTower(parent,x,z,height) {
    const g=new Group();g.name='terraced-office';g.position.set(x,.21,z);parent.add(g);
    for(let level=0;level<3;level++) {
      const width=1.4-level*.28,y=level*height/3;
      b('ivory',[width,height/3,width],[0,y+height/6,0],g);
      b('glass',[width*.8,height/3*.76,.025],[0,y+height/6,width/2+.014],g);
      b('glass',[.025,height/3*.76,width*.8],[width/2+.014,y+height/6,0],g);
      b('stone',[width+.1,.055,width+.1],[0,y+height/3,0],g);
    }
  }
  const blocks=[];
  const types=[['society','commercial','commercial','commercial','society','plots'],['society','park','society','commercial','commercial','plots'],['society','society','plots','park','plots','plots']];
  for(let row=0;row<3;row++)for(let col=0;col<6;col++) {
    const index=row*6+col,[x,z]=warp(-10+col*4,-5+row*5);
    blocks.push({x:x+(random(index+1)-.5)*.34,z:z+(random(index+8)-.5)*.55,type:types[row][col],style:index});
  }
  blocks.forEach(({x,z,type,style:index})=>{
    if([7,8,9,10,13,14].includes(index))return;
    const district=new Group();district.name=`city-block-${index}`;district.position.set(x,0,z);district.rotation.y=(random(index+17)-.5)*.18;
    district.userData.cityZone=type==='park'?'society':type;model.add(district);
    // Each block shrinks, and nudges if needed, until its whole footprint sits clear of
    // the surrounding streets; the largest clear fit nearest the planned spot wins.
    const w=1.45+random(index+32)*.13,d0=1.65+random(index+48)*.22,cos=Math.cos(district.rotation.y),sin=Math.sin(district.rotation.y);
    const shapeAt=scale=>[[-w,-d0+.28],[-w+.3,-d0],[w-.24,-d0*.94],[w,-d0*.5],[w-.12,d0*.78],[w-.43,d0],[-w,d0-.16]].map(([px,pz])=>[px*scale,pz*scale]);
    const clear=(scale,ox,oz)=>{const points=shapeAt(scale);return points.every(([px,pz],i)=>{const [qx,qz]=points[(i+1)%points.length];return [0,.25,.5,.75].every(t=>{const fx=px+(qx-px)*t,fz=pz+(qz-pz)*t;return clearOfRoads(x+ox+fx*cos+fz*sin,z+oz-fx*sin+fz*cos,.06,roadCorridors);});});};
    let fit=0,shift=[0,0];
    for(const radius of [0,.15,.3,.45,.6])for(let a=0;a<(radius?8:1);a++){const ox=Math.cos(a*Math.PI/4)*radius,oz=Math.sin(a*Math.PI/4)*radius;let scale=1;while(scale>.6&&!clear(scale,ox,oz))scale-=.02;if(scale>fit+.04){fit=scale;shift=[ox,oz];}}
    district.position.x+=shift[0];district.position.z+=shift[1];district.scale.setScalar(fit);
    const d=d0;
    const footprint=[[-w,-d+.28],[-w+.3,-d],[w-.24,-d*.94],[w,-d*.5],[w-.12,d*.78],[w-.43,d],[-w,d-.16]];
    parcel(district,footprint,'stone',.065,.1,'district-footprint');parcel(district,footprint.map(([x,z])=>[x*.94,z*.94]),type==='plots'?'sand':'grass',.025,.165,'district-landscape');
    if(type==='park') park(district);
    else if(type==='society') {
      if(index===0||index===8) {
        for(const dx of [-.72,.72])tower(district,dx,-.55,index===8?2.8:1.9,false,.88);
        b('water',[1.5,.035,.52],[0,.22,.77],district);t.bench(district,0,1.3);
      } else if(index===4) {
        const wing=tower(district,-.6,0,1.4,false,.9);wing.scale.z=2.15;
        const cross=tower(district,.35,-.65,1.4,false,.9);cross.scale.x=1.65;
        t.tree(district,.65,.72,.48);
      } else if(index===6) {
        // A gated high-rise society, the familiar Greater Noida skyline.
        for(const [dx,dz,height] of [[-.72,-.72,3.05],[.62,-.78,3.35],[-.05,.62,2.75]])tower(district,dx,dz,height,false,.74);
        b('water',[.7,.03,.36],[.72,.21,.55],district);t.bench(district,.75,1.05);
      } else {
        villa(district,-.63,-.72,index%2===0);villa(district,.64,.67,index%2!==0);
        if(index===13)villa(district,.65,-.7,true);
        b('sand',[.2,.02,3],[0,.205,0],district);
      }
    } else if(type==='commercial') {
      if(index===1) {roundTower(district,-.45,-.45,3.45);shop(district,.55,1.05);}
      else if(index===2) {steppedTower(district,-.55,-.45,3.1);tower(district,.8,.65,1.6,true,.8);}
      else if(index===3) {
        const hall=new Group();hall.name='warehouse-and-showroom';hall.position.set(0,.2,0);district.add(hall);
        b('ivory',[2.15,.8,1.65],[0,.4,0],hall);b('glass',[1.7,.55,.025],[0,.4,.84],hall);
        for(const side of [-1,1]){const roof=b('metal',[1.22,.06,1.82],[side*.53,.94,0],hall);roof.rotation.z=-side*.25;}
        for(let i=0;i<4;i++)b('glass',[.3,.035,.48],[-.7+i*.46,1.12,-.2],hall);
      } else {
        tower(district,-.65,-.65,2.05,true,.98);shop(district,-.6,.95);shop(district,.7,.95);
        const building=tower(district,.72,-.6,1.15,true,.8);building.rotation.y=.16;
      }
    } else {
      const parcels=index%2 ? [
        [[-1.27,-1.4],[.05,-1.5],[.42,-.28],[-1.24,-.05]],
        [[.2,-1.48],[1.26,-1.3],[1.3,.05],[.57,-.22]],
        [[-1.2,.12],[.5,-.05],[1.22,.24],[.9,1.4],[-.95,1.48]],
      ] : [
        [[-1.3,-1.38],[1.18,-1.34],[.85,-.05],[-1.2,.22]],
        [[-1.18,.4],[.16,.2],[.26,1.42],[-.94,1.45]],
        [[.35,.15],[1.25,.02],[1.12,1.2],[.45,1.44]],
      ];
      parcels.forEach((points,i)=>{
        const variation=.84+random(index*11+i)*.13;
        const shape=points.map(([x,z])=>[x*variation,z*variation]);
        parcel(district,shape,i%2?'grass':'sand',.035,.21,'surveyed-irregular-plot');
        const geometry=new BufferGeometry().setFromPoints(shape.map(([x,z])=>new Vector3(x,.26,z)));extraGeometries.push(geometry);
        const line=new LineLoop(geometry,parcelLineMaterial);district.add(line);
        shape.forEach(([x,z])=>b('ivory',[.035,.16,.035],[x,.32,z],district));
      });
      if(index===16) site=addConstructionSite(t,district,{x:-.15,y:.245,z:-.1,scale:.72,floors:7,rotation:.3});
    }
    const h=type==='commercial'?4.3:type==='society'?3.2:.5;
    const hit=new Mesh(hitGeometry,hitMaterial);hit.userData.cityZone=district.userData.cityZone;hit.scale.set(3.25,h,3.8);hit.position.y=h/2;district.add(hit);hitAreas.push(hit);
    const geometry=new BufferGeometry().setFromPoints(footprint.map(([x,z])=>new Vector3(x,.23,z)));extraGeometries.push(geometry);
    const outline=new LineLoop(geometry,outlineMaterial);outline.renderOrder=5;outline.visible=false;outline.name='district-selection';district.add(outline);outlines.push({outline,type:district.userData.cityZone});
    if(type!=='park')t.tree(district,-1.25,1.38,.38+random(index)*.15);
    // Trees line each compound just inside its boundary, clear of its buildings.
    if(type!=='park'&&type!=='plots'){
      district.updateMatrixWorld(true);const inverse=district.matrixWorld.clone().invert(),built=[];
      district.children.forEach(child=>{if(child.isGroup&&child.name&&child.name!=='botanical-tree'){const box=new Box3().setFromObject(child).applyMatrix4(inverse);if(!box.isEmpty())built.push(box.expandByScalar(.18));}});
      const ring=footprint.map(([x,z])=>new Vector3(x*.8,.5,z*.8));
      ring.forEach((a,i)=>{const c=ring[(i+1)%ring.length],steps=Math.floor(a.distanceTo(c)/.62);for(let k=0;k<steps;k++){const p=a.clone().lerp(c,(k+.5)/steps);if(!built.some(box=>box.containsPoint(p)))t.tree(district,p.x,p.z,.3+random(index*31+i*7+k)*.16);}});
    }
  });
  for(let i=0;i<18;i++) {
    const p=ring.getPointAt(i/18),v=ring.getTangentAt(i/18),x=p.x-v.z*.55,z=p.z+v.x*.55;
    b('metal',[.035,.8,.035],[x,.5,z]);b('lamp',[.2,.045,.12],[x,.92,z]);
    t.tree(model,x-v.z*.35,z+v.x*.35,.5+random(i+90)*.15);
  }
  // Avenue trees on both kerbs of the ring and cross streets, and a green belt between
  // the ring road and the edge of the land. Anything too close to a carriageway is
  // removed below, before the forest is merged into two draws.
  const avenue=[];
  for(let i=0;i<60;i++){const u=(i+.5)/60,p=ring.getPointAt(u),v=ring.getTangentAt(u);for(const offset of [.95,-.95,1.55+random(i)*.5,-1.55-random(i+3)*.5])avenue.push(t.tree(model,p.x-v.z*offset,p.z+v.x*offset,.4+random(i*3+1)*.22));}
  routes.forEach((curve,r)=>{for(let i=0;i<24;i++){const u=(i+.5)/24,p=curve.getPointAt(u),v=curve.getTangentAt(u),side=i%2?1:-1;avenue.push(t.tree(model,p.x+v.z*.86*side,p.z-v.x*.86*side,.36+random(r*40+i)*.14));}});
  // Two-way traffic keeps to the left on the ring and the two cross streets: hatchbacks,
  // SUVs, CNG autos and city buses, plus cars waiting in the mall bays and at the
  // terminal kerb. Each vehicle type is one instanced fleet, so the draw count is fixed.
  const crossStreets=routes.slice(0,2), traffic=[], scale=.52;
  const mix=compact?['hatch','rickshaw','suv','hatch','bus']:['hatch','suv','rickshaw','hatch','bus','hatch','rickshaw','suv','hatch','hatch'];
  mix.forEach((type,i)=>traffic.push({type,curve:ring,closed:true,lane:.17,direction:i%2?-1:1,speed:(type==='bus'?.0045:type==='rickshaw'?.0055:.0068)+random(i+71)*.0035,phase:i/mix.length+random(i+5)*.05}));
  crossStreets.forEach((curve,s)=>{for(let i=0;i<(compact?2:4);i++)traffic.push({type:i===1?'rickshaw':i===3?'suv':'hatch',curve,closed:false,lane:.14,direction:i%2?-1:1,speed:.011+random(s*3+i)*.006,phase:random(s*9+i+2)});});
  const parked=[...[0,1,3,5,6,8].map(bay=>[1.3+bay*.6,.2,1.35,Math.PI]),...[-4,-1.5,1].map(x=>[x,.163,-9.27,Math.PI/2])];
  // Moving vehicles take the first slots of each fleet; parked hatchbacks follow.
  const counts={hatch:0,suv:0,rickshaw:0,bus:0};
  traffic.forEach(car=>{car.slot=counts[car.type]++;});
  const firstParked=counts.hatch;counts.hatch+=parked.length;
  const fleets=Object.fromEntries(Object.entries(counts).map(([type,count],i)=>[type,createFleet(t,model,count,{offset:i*3+2,type})]));
  parked.forEach(([x,y,z,yaw],i)=>fleets.hatch.place(firstParked+i,x,y,z,yaw,scale));
  const crowd=createCrowd(model,[{curve:ring,offset:.405,y:.1,closed:true},{curve:ring,offset:-.405,y:.1,closed:true},...crossStreets.map(curve=>({curve,offset:.345,y:.1,closed:false}))],compact?22:52);
  const landmarks=addCityLandmarks(model,t,parcel);
  // The landmark blocks replace six small parcels, keeping the new park and mall clear of streets.
  for(const [x,z,type,width,depth,height] of [[-4,0,'society',7.1,3.5,.8],[4,0,'commercial',7.1,3.5,1.9],[-4,5,'commercial',7.1,3.4,1.5]]) {
    const hit=new Mesh(hitGeometry,hitMaterial);hit.position.set(x,height/2,z);hit.scale.set(width,height,depth);hit.userData.cityZone=type;model.add(hit);hitAreas.push(hit);
  }
  model.updateMatrixWorld(true);
  const unsafeTrees=new Set();
  model.traverse(o=>{if(o.name==='botanical-tree'){const p=o.getWorldPosition(new Vector3());if(!clearOfRoads(p.x,p.z,.18+o.scale.x*.6,roadCorridors))unsafeTrees.add(o);}});
  // Avenue planting stays off blocks, landmarks, the airport and the land edge.
  const blocked=hitAreas.map(hit=>new Box3().setFromObject(hit).expandByScalar(.25)),edge=new Shape(boundary.map(([x,z])=>new Vector2(x*.94,z*.94)));
  const inside=(x,z)=>{let hit=false;const points=edge.getPoints();for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],c=points[j];if((a.y>z)!==(c.y>z)&&x<(c.x-a.x)*(z-a.y)/(c.y-a.y)+a.x)hit=!hit;}return hit;};
  avenue.forEach(tree=>{const p=tree.getWorldPosition(new Vector3());if(p.z<-7||!inside(p.x,p.z)||blocked.some(box=>box.containsPoint(p.setY(.5))))unsafeTrees.add(tree);});
  unsafeTrees.forEach(tree=>{tree.traverse(o=>{if(o.isInstancedMesh)o.dispose();});tree.removeFromParent();});
  t.plantForest(model);
  model.position.z=4.2;
  batchSceneMeshes(model,{tint:true});
  let selected=null;
  function select(id) {selected=CITY_DISTRICTS.some(d=>d.id===id)?id:null;outlines.forEach(item=>item.outline.visible=item.type===selected);}
  function update(progress,reduced=false,seconds=0) {
    const time=reduced?0:seconds;
    world.rotation.y=-.12+(reduced?0:Math.max(0,Math.min(1,progress))*.24);
    t.animate(time,reduced); landmarks.update(time,reduced);
    traffic.forEach(({type,slot,curve,closed,lane,direction,speed,phase})=>{
      const travel=((time*speed+phase)%1+1)%1,along=direction>0?travel:1-travel,p=curve.getPointAt(along),v=curve.getTangentAt(along).multiplyScalar(direction);
      // Open streets fade vehicles in and out where they meet the ring road.
      const size=closed?scale:scale*Math.min(1,along*14,(1-along)*14);
      fleets[type].place(slot,p.x+v.z*lane,.122,p.z-v.x*lane,Math.atan2(v.x,v.z),size);
    });
    Object.values(fleets).forEach(fleet=>fleet.commit());
    site?.update(time,reduced); crowd.update(time,reduced);
  }
  update(0,true);
  return {model:world,landEdge:boundary.map(([x,z])=>[x*.993,z*.993]),roadCorridors,hitAreas,movingCars:traffic.length,traffic:traffic.map(({type,slot})=>({type,slot})),parkedSlots:{type:'hatch',first:firstParked,count:parked.length},select,update,dispose(){disposeSpatialModel(world,{geometries:[...t.resources.geometries,...crowd.resources.geometries,hitGeometry,...extraGeometries,...landmarks.resources.geometries],materials:[...t.resources.materials,...crowd.resources.materials,hitMaterial,outlineMaterial,parcelLineMaterial,...landmarks.resources.materials]});}};
}
