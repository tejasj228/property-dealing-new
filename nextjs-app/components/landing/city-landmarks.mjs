import { CatmullRomCurve3, ExtrudeGeometry, Group, Mesh, MeshPhysicalMaterial, RingGeometry, Shape, SphereGeometry, Vector3 } from 'three';

const taxi=new CatmullRomCurve3([[9,.51,-15.7],[10.5,.51,-15],[9,.51,-14.15],[0,.51,-14.15],[-9,.51,-14.15],[-10.5,.51,-14.5],[-10,.51,-15.7]].map(p=>new Vector3(...p)));
const circuit=new CatmullRomCurve3([[12,3.5,-15.7],[14,4.4,-18],[7,5,-20],[-5,4.6,-20],[-14.2,3.3,-18.8],[-15,2.9,-16.6],[-13,2.6,-15.7]].map(p=>new Vector3(...p)));
// One continuous 48-second circuit. Ground phases stay exactly on the runway/apron.
export function flightPosition(seconds=0,reduced=false) {
 const time=reduced?18:((seconds%48)+48)%48;
 if(time<8){const u=time/8;return new Vector3(-13+9*u,.51+2.09*(1-u)**2,-15.7);}
 if(time<14){const u=(time-8)/6;return new Vector3(-4+13*(1-(1-u)**1.4),.51,-15.7);}
 if(time<22)return taxi.getPointAt((time-14)/8);
 if(time<27){const u=(time-22)/5;return new Vector3(-10+12*u*u,.51,-15.7);}
 if(time<34){const u=(time-27)/7;return new Vector3(2+10*u,.51+2.99*u*u,-15.7);}
 return circuit.getPointAt((time-34)/14);
}

export function addCityLandmarks(model,t,parcel) {
 const geometries=[],materials=[],b=(p,m,size,pos)=>t.box(p,m,size,pos);
 for(const [name,color] of [['saffron','#ce7940'],['marketGreen','#577b56'],['marketRed','#a84336']]){const m=new MeshPhysicalMaterial({name,color,roughness:.8});t.materials[name]=m;materials.push(m);}
 const sphere=new SphereGeometry(1,20,12);geometries.push(sphere);
 const ball=(parent,material,size,position)=>t.mesh(parent,sphere,material,size,position);
 const airport=new Group();airport.name='airport';model.add(airport);
 b(airport,'stone',[24,.06,7.5],[0,.1,-13.65]);b(airport,'road',[23.3,.035,1.3],[0,.15,-15.7]);
 b(airport,'stone',[21,.035,.65],[0,.15,-14.15]);b(airport,'stone',[14.5,.04,2.1],[-1,.15,-12.6]);
 for(let x=-10.5;x<11;x+=1.1)b(airport,'paint',[.5,.012,.045],[x,.176,-15.7]);
 for(const x of [-10.5,10.5])for(let i=0;i<6;i++)b(airport,'paint',[.6,.012,.055],[x,.178,-16.2+i*.18]);
 for(let x=-11;x<=11;x+=1.1)for(const side of [-1,1])b(airport,'lamp',[.065,.04,.065],[x,.19,-15.7+side*.69]);
 for(const x of [-10,10])b(airport,'stone',[.6,.03,2],[x,.16,-14.6]);
 // Terminal glazing, overlapping roof shells and enclosed boarding bridges.
 b(airport,'ivory',[8,1.05,1.5],[-1,.69,-10.7]);b(airport,'glass',[7.7,.7,.035],[-1,.77,-11.47]);
 for(let x=-4.4;x<3;x+=.72)b(airport,'metal',[.03,.8,.04],[x,.79,-11.51]);
 for(let i=0;i<5;i++){const roof=b(airport,'ivory',[1.85,.12,1.85],[-4.2+i*1.6,1.3,-10.7]);roof.rotation.z=(i%2?.06:-.06);}
 for(const x of [-3.4,-.7,2]){b(airport,'glass',[.28,.26,1.2],[x,.54,-11.9]);b(airport,'metal',[.38,.035,1.3],[x,.7,-11.9]);b(airport,'metal',[.06,.4,.06],[x,.35,-12.3]);}
 b(airport,'stone',[.48,2.2,.48],[5,1.25,-10.9]);b(airport,'glass',[.95,.55,.85],[5,2.6,-10.9]);b(airport,'ivory',[1.1,.1,1],[5,2.94,-10.9]);b(airport,'metal',[.035,.65,.035],[5,3.3,-10.9]);
 b(airport,'road',[10,.025,.6],[-1,.15,-9.4]);
 for(let x=-4.5;x<3.5;x+=.65)b(airport,'paint',[.025,.01,.5],[x,.18,-8.9]);
 for(const x of [-6,7,9])t.tree(airport,x,-10,.55);

 const plane=new Group();plane.name='airport-aircraft';plane.userData.animated=true;model.add(plane);
 ball(plane,'ivory',[.18,.18,1.15],[0,0,0]);ball(plane,'glass',[.135,.09,.2],[0,.09,.77]);
 parcel(plane,[[-1.55,-.65],[-1.5,-.9],[-.18,-.18],[.18,-.18],[1.5,-.9],[1.55,-.65],[.2,.32],[-.2,.32]],'ivory',.045,-.04,'swept-aircraft-wings');
 parcel(plane,[[-.65,-.99],[-.63,-1.2],[0,-.87],[.63,-1.2],[.65,-.99],[0,-.66]],'metal',.035,.06,'tailplane');
 const finShape=new Shape();finShape.moveTo(0,0);finShape.lineTo(0,.63);finShape.lineTo(.55,0);finShape.closePath();
 const finGeometry=new ExtrudeGeometry(finShape,{depth:.035,bevelEnabled:false});finGeometry.rotateY(Math.PI/2);geometries.push(finGeometry);
 const fin=new Mesh(finGeometry,t.materials.green);fin.position.set(-.018,.08,-.62);plane.add(fin);
 for(const side of [-1,1]){ball(plane,'metal',[.115,.115,.3],[side*.55,-.14,-.16]);ball(plane,'dark',[.08,.08,.015],[side*.55,-.14,.13]);b(plane,'lamp',[.045,.035,.09],[side*1.48,.01,-.7]);}
 for(let z=-.65;z<.65;z+=.16)for(const side of [-1,1])b(plane,'glass',[.013,.05,.06],[side*.175,.05,z]);
 const gear=new Group();gear.name='aircraft-landing-gear';plane.add(gear);
 for(const [x,z] of [[-.16,-.25],[.16,-.25],[0,.65]]) {b(gear,'metal',[.025,.11,.025],[x,-.2,z]);ball(gear,'dark',[.045,.055,.055],[x,-.28,z]);}

 const park=new Group();park.name='large-city-park';park.position.set(-4,.1,0);model.add(park);
 parcel(park,[[-3.45,-1.8],[3.3,-1.7],[3.5,1.4],[2.9,1.85],[-3.3,1.85]],'grass',.045,.03,'park-lawn');
 const pathGeometry=new RingGeometry(1,1.14,48);pathGeometry.rotateX(-Math.PI/2);geometries.push(pathGeometry);
 const path=new Mesh(pathGeometry,t.materials.sand);path.scale.set(2.55,1,1.32);path.position.y=.1;park.add(path);
 t.round(park,'stone',[1.25,.06,.67],[-.75,.13,0]);t.round(park,'water',[1.13,.035,.57],[-.75,.18,0]);
 b(park,'trunk',[.28,.09,1.3],[-.75,.25,0]);
 for(const [x,z] of [[-3,-1.25],[-2,1.3],[0,-1.5],[1.6,1.35],[3,1.2],[3,-1.3],[-3,1.3],[1.6,-1.3]])t.tree(park,x,z,.55);
 for(const x of [-2.7,.8,2.7])t.bench(park,x,.8,.2);
 b(park,'sand',[1.25,.04,.85],[1.6,.12,0]);
 for(const x of [1.15,2.05])b(park,'metal',[.035,.65,.035],[x,.46,0]);b(park,'saffron',[1,.055,.08],[1.6,.8,0]);
 for(const x of [1.4,1.8]){b(park,'metal',[.014,.35,.014],[x,.59,0]);b(park,'trunk',[.2,.035,.15],[x,.4,0]);}

 const mall=new Group();mall.name='shopping-mall';mall.position.set(4,.12,0);model.add(mall);
 b(mall,'stone',[7.1,.08,3.5],[0,.04,0]);b(mall,'ivory',[6.4,1.25,2.1],[0,.7,-.45]);
 b(mall,'glass',[6.1,.76,.035],[0,.76,.62]);
 for(const x of [-2.8,-1.4,0,1.4,2.8])b(mall,'metal',[.075,1.05,.055],[x,.76,.65]);
 b(mall,'stone',[6.65,.15,2.3],[0,1.4,-.45]);b(mall,'glass',[2.1,.35,1.4],[0,1.58,-.4]);
 b(mall,'ivory',[2.3,.07,1.55],[0,1.78,-.4]);
 b(mall,'saffron',[2.5,.12,.12],[0,1.23,.73]);
 for(const side of [-1,1])b(mall,'metal',[.06,.9,.06],[side*1.2,.59,1.12]);b(mall,'ivory',[2.65,.08,.75],[0,1.05,.97]);
 for(let x=-3;x<=3;x+=.6)b(mall,'paint',[.025,.012,.5],[x,.1,1.35]);
 for(const x of [-3.1,3.1])t.tree(mall,x,.9,.48);

 const market=new Group();market.name='indian-street-market';market.position.set(-4,.12,5);model.add(market);
 b(market,'sand',[7.1,.05,3.4],[0,.04,0]);b(market,'stone',[6.9,.03,.85],[0,.08,0]);
 for(let i=0;i<8;i++)for(const side of [-1,1]) {
   const x=-2.9+i*.82,z=side*1.06,color=['saffron','marketGreen','marketRed'][i%3];
   b(market,'ivory',[.7,.62,.65],[x,.4,z]);b(market,color,[.79,.065,.85],[x,.77,z-side*.08]);
   b(market,color,[.76,.15,.045],[x,.68,z-side*.49]);b(market,'trunk',[.64,.16,.25],[x,.25,z-side*.4]);
   for(let j=0;j<3;j++)ball(market,i%2?'marketGreen':'saffron',[.07,.06,.07],[x-.18+j*.18,.38,z-side*.4]);
 }
 for(const x of [-3.3,3.3]){b(market,'metal',[.045,1.35,.045],[x,.73,-.1]);b(market,'saffron',[.55,.24,.035],[x,1.3,-.1]);}
 const cable=b(market,'metal',[6.6,.018,.018],[0,1.38,-.1]);
 for(let x=-3;x<=3;x+=.5)b(market,'lamp',[.055,.065,.055],[x,1.33,-.1]);
 function update(seconds,reduced) {
   const p=flightPosition(seconds,reduced),next=flightPosition(seconds+.025,reduced);
   plane.position.copy(p);plane.rotation.y=reduced?-Math.PI/2:Math.atan2(next.x-p.x,next.z-p.z);
   const horizontal=Math.hypot(next.x-p.x,next.z-p.z);plane.rotation.x=reduced?0:-Math.atan2(next.y-p.y,horizontal);
   gear.visible=p.y<1.4;
 }
 update(0,true);
 return {update,resources:{geometries,materials}};
}
