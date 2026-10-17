import { Group } from 'three';
import { createDetailKit } from './scene-details.mjs';
import { batchSceneMeshes } from './scene-batching.mjs';
import { disposeSpatialModel } from './spatial-models.mjs';

// A welcoming cutaway studio; an illustration, not a replica of either office.
export function createContactOffice() {
  const t=createDetailKit(),model=new Group(),office=new Group();model.add(office);
  t.box(office,'stone',[8.8,.3,6.6],[0,-.2,0]);
  t.box(office,'grass',[8.55,.06,6.35],[0,-.015,0],false);
  t.box(office,'ivory',[5.9,.15,4.3],[-.3,.09,-.55]);
  t.box(office,'sand',[5.65,.035,4.05],[-.3,.19,-.55],false);
  // Back and side walls leave the conversation space visible from the camera.
  t.box(office,'ivory',[5.9,2.6,.16],[-.3,1.48,-2.65]);
  t.box(office,'green',[.16,2.6,4.3],[-3.17,1.48,-.55]);
  t.box(office,'stone',[6.15,.15,.85],[-.3,2.85,-2.34]);
  for(const x of [-2.8,-1.8,-.8,.2,1.2,2.2])t.box(office,'trunk',[.07,.09,.9],[x,2.73,-2.34]);
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
  t.box(door,'glass',[1.19,2.13,.065],[.595,1.065,0]);
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
