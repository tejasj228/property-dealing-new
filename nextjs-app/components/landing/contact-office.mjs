import { DoubleSide, Group, Mesh, MeshPhysicalMaterial, PlaneGeometry } from 'three';
import { createDetailKit } from './scene-details.mjs';
import { batchSceneMeshes } from './scene-batching.mjs';
import { disposeSpatialModel } from './spatial-models.mjs';

// A welcoming glass-fronted studio; an illustration, not a replica of either office.
export function createContactOffice() {
  const t=createDetailKit(),model=new Group(),office=new Group();model.add(office);
  t.box(office,'stone',[8.8,.3,6.6],[0,-.2,0]);
  t.box(office,'grass',[8.55,.06,6.35],[0,-.015,0],false);
  t.box(office,'ivory',[5.9,.15,4.3],[-.3,.09,-.55]);
  t.box(office,'sand',[5.65,.035,4.05],[-.3,.19,-.55],false);
  // Clear single-surface glazing avoids overlapping transparent box faces.
  // No transmission pass or night-window emission: the interior stays visible.
  const paneGeometry=new PlaneGeometry(1,1);
  const glazing=new MeshPhysicalMaterial({name:'windscreen',color:'#c5d3d4',transparent:true,opacity:.17,roughness:.18,metalness:.08,depthWrite:false,side:DoubleSide});
  const skylight=glazing.clone();skylight.opacity=.22;
  t.resources.geometries.push(paneGeometry);t.resources.materials.push(glazing,skylight);
  function pane(parent,name,width,height,position,rotation=[0,0,0],material=glazing){
    const mesh=new Mesh(paneGeometry,material);mesh.name=name;mesh.scale.set(width,height,1);mesh.position.set(...position);mesh.rotation.set(...rotation);mesh.renderOrder=2;parent.add(mesh);return mesh;
  }
  // A solid rear wall anchors the display; the other three sides are glazed.
  t.box(office,'ivory',[5.9,2.6,.16],[-.3,1.48,-2.65]);
  for(const x of [-3.17,2.57]){
    pane(office,'office-glass-wall',4.14,2.52,[x,1.48,-.55],[0,Math.PI/2,0]);
    for(const z of [-2.6,-.55,1.57])t.box(office,'metal',[.055,2.6,.055],[x,1.48,z]);
    for(const y of [.2,2.76])t.box(office,'metal',[.055,.055,4.3],[x,y,-.55]);
  }
  pane(office,'office-glass-wall',4.15,2.52,[-1.075,1.48,1.57]);
  for(const x of [-3.17,-1.75,-.35,1])t.box(office,'metal',[.045,2.6,.06],[x,1.48,1.57]);
  for(const y of [.2,2.76])t.box(office,'metal',[4.2,.055,.06],[-1.075,y,1.57]);
  pane(office,'office-glass-wall',.1,2.52,[2.51,1.48,1.57]);
  // Full flat roof with a large inset skylight keeps the room readable from above.
  const roof=new Group();roof.name='office-roof';office.add(roof);
  for(const z of [-2.44,1.34])t.box(roof,'stone',[6.15,.16,.68],[-.3,2.87,z]);
  for(const x of [-3.03,2.43])t.box(roof,'stone',[.69,.16,3.1],[x,2.87,-.55]);
  pane(roof,'office-skylight',4.77,3.1,[-.3,2.88,-.55],[-Math.PI/2,0,0],skylight);
  for(const x of [-1.1,.5])t.box(roof,'metal',[.045,.06,3.1],[x,2.9,-.55]);
  for(const z of [-2.1,1])t.box(roof,'metal',[4.77,.06,.045],[-.3,2.9,z]);
  // Property plan mounted behind the consultation desk.
  t.box(office,'trunk',[2.8,1.3,.08],[-.55,1.72,-2.52]);
  t.box(office,'ivory',[2.65,1.16,.03],[-.55,1.72,-2.46]);
  for(const x of [-1.4,-.6,.2])for(const y of [1.45,1.92])t.box(office,'grass',[.56,.29,.025],[x,y,-2.43],false);
  t.box(office,'green',[.07,1.03,.028],[-.98,1.72,-2.41],false);
  const desk=new Group();desk.name='consultation-desk';office.add(desk);
  t.box(desk,'trunk',[2.5,.13,.95],[-.7,.92,-.8]);
  for(const x of [-1.7,.3])t.box(desk,'green',[.12,.7,.65],[x,.52,-.8]);
  t.box(desk,'ivory',[.62,.02,.42],[-.6,1,-.6],false);
  for(const x of [-.77,-.57,-.37])t.box(desk,'green',[.1,.12,.11],[x,1.07,-.6]);
  const screen=t.box(desk,'dark',[.55,.37,.045],[-1.35,1.21,-1]);screen.rotation.x=-.12;
  t.box(desk,'metal',[.35,.025,.2],[-1.35,1.01,-.95]);
  for(const [x,z] of [[-1.4,.2],[.1,.2],[-.7,-1.65]]) {
    t.box(office,'green',[.48,.11,.48],[x,.53,z]);
    t.box(office,'green',[.48,.55,.09],[x,.81,z+.21]);
    for(const dx of [-.17,.17])for(const dz of [-.17,.17])t.box(office,'metal',[.035,.28,.035],[x+dx,.34,z+dz]);
  }
  // Tall entry frame and a hinged door. Its swing stays outside the furniture.
  for(const x of [1.05,2.4])t.box(office,'ivory',[.12,2.35,.16],[x,1.36,1.57]);
  t.box(office,'green',[1.62,.3,.32],[1.72,2.62,1.57]);
  t.box(office,'lamp',[1.25,.035,.07],[1.72,2.43,1.75],false);
  const door=new Group();door.name='office-door';door.position.set(1.12,.2,1.57);office.add(door);
  pane(door,'office-glass-door',1.19,2.13,[.595,1.065,0]);
  for(const x of [0,1.19])t.box(door,'metal',[.04,2.13,.09],[x,1.065,0]);
  for(const y of [.02,2.11])t.box(door,'metal',[1.19,.04,.09],[.595,y,0]);
  t.box(door,'silver',[.035,.27,.08],[1.03,1.08,.09]);
  t.box(office,'stone',[2.0,.1,.4],[1.72,.12,1.95]);
  t.box(office,'stone',[2.15,.06,.4],[1.72,.06,2.3]);
  for(const z of [2.65,3])t.box(office,'sand',[1.15,.03,.21],[1.72,.035,z],false);
  const mailbox=new Group();mailbox.name='enquiry-mailbox';office.add(mailbox);
  t.box(mailbox,'metal',[.06,.7,.06],[3.35,.37,1.75]);
  t.box(mailbox,'green',[.62,.48,.38],[3.35,.92,1.75]);
  t.box(mailbox,'dark',[.4,.055,.025],[3.35,1.02,1.955],false);
  t.box(mailbox,'ivory',[.22,.12,.025],[3.35,.83,1.955],false);
  for(const [x,z] of [[-3.9,1.75],[3.6,-1.7]]){t.box(office,'ivory',[.65,.35,.65],[x,.18,z]);t.tree(office,x,z,.85);}
  // Low terrace seating and planters continue the office outside.
  t.bench(office,-1.9,2.3);
  for(const x of [-.5,.1]){t.round(office,'stone',[.22,.32,.22],[x,.19,2.4]);t.round(office,'leaf',[.27,.4,.27],[x,.52,2.4]);}
  function update(progress,reduced,seconds=0){
    const amount=Math.max(0,Math.min(1,progress));
    door.rotation.y=-amount*Math.PI*.62;
    office.rotation.y=-.1;
    model.position.set(0,0,0);
    t.animate(seconds,reduced);
  }
  batchSceneMeshes(model);update(0,true);
  return {model,update,kind:'office',dispose:()=>disposeSpatialModel(model,t.resources)};
}
