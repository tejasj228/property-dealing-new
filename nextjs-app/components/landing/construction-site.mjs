import { Group, MeshPhysicalMaterial } from 'three';

// An illustrative building site: a concrete frame rising floor by floor with scaffolding
// and safety netting, a slewing tower crane carrying a load, site hoarding and a blinking
// aviation light. It shows the idea of development, never a specific listed project.
export function addConstructionSite(t, parent, { x = 0, y = 0, z = 0, scale = 1, floors = 7, rotation = 0 } = {}) {
  const materials = [];
  const material = (name, options) => {
    if (!t.materials[name]) { t.materials[name] = new MeshPhysicalMaterial({ name, ...options }); t.resources.materials.push(t.materials[name]); materials.push(t.materials[name]); }
    return name;
  };
  const crane = material('crane-yellow', { color: '#e4a424', roughness: .45, metalness: .3 });
  const netting = material('safety-net', { color: '#3e7f55', roughness: .9 });
  const brick = material('brick', { color: '#9c4a32', roughness: .92 });
  const beacon = material('aviation-beacon', { color: '#5a1410', roughness: .4 });
  Object.assign(t.materials[beacon].userData, { nightLamp: true, blink: 'beacon', lampColor: '#ff2a12' });
  const site = new Group(); site.name = 'construction-site'; site.position.set(x, y, z); site.rotation.y = rotation; site.scale.setScalar(scale); parent.add(site);
  const b = (m, size, pos, p = site, cast) => t.box(p, m, size, pos, cast);
  // Concrete frame: slabs and columns, with the top floors still open.
  const floorHeight = .34, width = 1.1, depth = .9;
  b('stone', [width + .2, .06, depth + .2], [0, .03, 0]);
  for (let f = 0; f < floors; f++) {
    const y = .06 + f * floorHeight;
    b('ivory', [width, .05, depth], [0, y + floorHeight, 0]);
    for (const cx of [-.5, -.17, .17, .5]) for (const cz of [-.4, 0, .4]) b('ivory', [.05, floorHeight, .05], [cx * width / 1.1, y + floorHeight / 2, cz * depth / .9]);
    // Brick infill and netting on the lower floors; the upper floors are bare frame.
    if (f < floors - 3) { b(brick, [width - .08, floorHeight - .06, .03], [0, y + floorHeight / 2, -depth / 2 + .02]); b(brick, [.03, floorHeight - .06, depth - .08], [-width / 2 + .02, y + floorHeight / 2, 0]); }
    if (f >= floors - 4) b(netting, [width + .06, floorHeight - .04, .012], [0, y + floorHeight / 2, depth / 2 + .03], site, false);
  }
  // Scaffolding along one face.
  for (let f = 0; f <= floors; f++) b('metal', [width + .16, .015, .015], [0, .06 + f * floorHeight, depth / 2 + .1], site, false);
  for (let i = 0; i <= 6; i++) b('metal', [.015, floors * floorHeight, .015], [-width / 2 - .08 + i * (width + .16) / 6, .06 + floors * floorHeight / 2, depth / 2 + .1], site, false);
  // Site hoarding with a gate.
  for (const side of [-1, 1]) { b('ivory', [.035, .22, 1.7], [side * 1.05, .11, .2]); b('ivory', [.75, .22, .035], [side * .66, .11, 1.05]); }
  b('ivory', [2.1, .22, .035], [0, .11, -.65]);
  for (const [px, pz] of [[.7, .7], [-.75, .75]]) { b('sand', [.28, .1, .2], [px, .05, pz]); b(brick, [.16, .08, .12], [px - .05, .14, pz]); }
  // Tower crane: lattice mast, slewing jib with counterweight, trolley, cable and load.
  const mastHeight = floors * floorHeight + .9, mastX = width / 2 + .38;
  b('ivory', [.3, .08, .3], [mastX, .04, -.1]);
  for (const cx of [-.06, .06]) for (const cz of [-.06, .06]) b(crane, [.018, mastHeight, .018], [mastX + cx, mastHeight / 2, -.1 + cz]);
  for (let y = .15; y < mastHeight; y += .16) { b(crane, [.13, .012, .012], [mastX, y, -.04], site, false); b(crane, [.012, .012, .13], [mastX + .06, y, -.1], site, false); }
  const slew = new Group(); slew.name = 'crane-jib'; slew.userData.animated = true; slew.position.set(mastX, mastHeight, -.1); site.add(slew);
  b(crane, [.14, .1, .14], [0, .05, 0], slew); b('glass', [.1, .07, .06], [.03, .06, .08], slew);
  b(crane, [.03, .3, .03], [0, .25, 0], slew);
  for (const side of [-1, 1]) b(crane, [.012, .012, 2.1], [side * .035, .12, -1.05], slew);
  b(crane, [.08, .012, 2.1], [0, .18, -1.05], slew, false);
  for (let i = 0; i < 10; i++) b(crane, [.08, .012, .012], [0, .12, -.15 - i * .2], slew, false);
  b(crane, [.06, .04, .7], [0, .13, .35], slew); b('ivory', [.12, .1, .14], [0, .1, .62], slew);
  const tie = b('metal', [.008, .008, 1.25], [0, .32, -.55], slew, false); tie.rotation.x = -.15;
  b(beacon, [.03, .03, .03], [0, .42, 0], slew, false);
  const trolley = new Group(); trolley.userData.animated = true; trolley.position.set(0, .1, -1.2); slew.add(trolley);
  b('dark', [.06, .03, .06], [0, 0, 0], trolley, false);
  const cable = b('metal', [.006, 1, .006], [0, -.5, 0], trolley, false); cable.userData.animated = true;
  const load = new Group(); load.userData.animated = true; trolley.add(load);
  b('metal', [.2, .03, .05], [0, 0, 0], load); b(brick, [.14, .05, .1], [0, .04, 0], load);
  function update(seconds = 0, reduced = false) {
    const time = reduced ? 0 : seconds;
    // Slews back and forth between the stockyard and the open top floor.
    slew.rotation.y = 1.1 + Math.sin(time * .11) * 1.25;
    trolley.position.z = -.75 - (Math.sin(time * .23 + 1) * .5 + .5) * .9;
    const drop = .55 + (Math.sin(time * .31) * .5 + .5) * (mastHeight - 1.1);
    cable.scale.y = drop; cable.position.y = -drop / 2; load.position.y = -drop;
  }
  update(0, true);
  return { site, update, resources: { materials } };
}

// A tracked excavator levelling a plot: the house slews between trench and spoil heap
// while boom, arm and bucket run a dig-lift-dump cycle.
export function addExcavator(t, parent, { x = 0, z = 0, rotation = 0, scale = 1 } = {}) {
  if (!t.materials['crane-yellow']) { t.materials['crane-yellow'] = new MeshPhysicalMaterial({ name: 'crane-yellow', color: '#e4a424', roughness: .45, metalness: .3 }); t.resources.materials.push(t.materials['crane-yellow']); }
  const yellow = 'crane-yellow', machine = new Group(); machine.name = 'excavator'; machine.userData.pedestrianObstacle = true;
  machine.position.set(x, 0, z); machine.rotation.y = rotation; machine.scale.setScalar(scale); parent.add(machine);
  const b = (m, size, pos, p) => t.box(p, m, size, pos);
  b('dark', [.6, .04, .4], [.55, .055, .1], machine);
  for (const side of [-1, 1]) { b('dark', [.15, .12, .66], [side * .2, .1, 0], machine); b('metal', [.1, .07, .6], [side * .2, .1, 0], machine); }
  const house = new Group(); house.userData.animated = true; house.position.y = .18; machine.add(house);
  b(yellow, [.44, .2, .5], [0, .12, -.04], house); b('dark', [.42, .12, .14], [0, .1, -.31], house);
  b(yellow, [.2, .24, .22], [-.11, .32, .1], house); b('glass', [.18, .17, .2], [-.11, .34, .115], house);
  b('dark', [.04, .1, .04], [.15, .27, -.2], house);
  const boom = new Group(); boom.userData.animated = true; boom.position.set(.1, .18, .2); house.add(boom);
  b(yellow, [.08, .08, .72], [0, 0, .34], boom);
  const arm = new Group(); arm.userData.animated = true; arm.position.set(0, 0, .7); boom.add(arm);
  b(yellow, [.065, .065, .5], [0, 0, .24], arm);
  const bucket = new Group(); bucket.userData.animated = true; bucket.position.set(0, 0, .5); arm.add(bucket);
  b('dark', [.2, .12, .12], [0, -.04, .05], bucket);
  // Trench and spoil heap.
  b('trunk', [.6, .015, .4], [0, .015, 1.15], machine).material = t.materials.sand;
  for (const [hx, hz, s] of [[.85, .7, .32], [1.02, .42, .22], [.7, .95, .16]]) t.mesh(machine, t.sphere, 'sand', [s, s * .42, s * .9], [hx, 0, hz]);
  function update(seconds = 0, reduced = false) {
    const cycle = reduced ? .2 : (seconds % 9) / 9, ease = v => v * v * (3 - 2 * v);
    // 0-.35 dig, .35-.55 lift and slew, .55-.7 dump, .7-1 return.
    const slew = cycle < .35 ? 0 : cycle < .55 ? ease((cycle - .35) / .2) : cycle < .7 ? 1 : 1 - ease((cycle - .7) / .3);
    const dig = cycle < .35 ? Math.sin(cycle / .35 * Math.PI) : 0;
    house.rotation.y = slew * 1.35;
    // Negative pitch raises the boom; the arm and bucket hang forward and curl in.
    boom.rotation.x = -.62 + dig * .42 - slew * .12;
    arm.rotation.x = 1.25 - dig * .55 - slew * .35;
    bucket.rotation.x = cycle > .55 && cycle < .7 ? -.5 : .9 - dig * .7;
  }
  update(0, true);
  return { machine, update };
}
