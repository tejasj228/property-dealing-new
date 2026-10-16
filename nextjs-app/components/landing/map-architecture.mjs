import { Group } from 'three';

// These are miniature illustrations, never replacements for listing photographs.
export function mapArchitectureKind(property, seed) {
  if (property.propertyType === 'commercial') return 'commercial';
  if (/\b(plot|land)\b/i.test(property.title || '')) return 'plot';
  if (/\b(house|home|villa|apartment|flat|building)\b/i.test(property.title || '')) return 'building';
  return seed % 3 === 0 ? 'plot' : 'building';
}

export function addMapArchitecture(kit, parent, { kind, seed = 0, compact = false }) {
  if (kind === 'plot') {
    kit.box(parent, 'sand', [1.4,.025,.13], [0,.26,.65]);
    for (const x of [-.6,0,.6]) kit.box(parent, 'ivory', [.035,.05,.75], [x,.29,0]);
    return .3;
  }
  const building = new Group(); building.name = `map-${kind}`; parent.add(building);
  const commercial = kind === 'commercial', floors = commercial ? 2 : 2 + seed % 2;
  const floorHeight = commercial ? .62 : .56, width = commercial ? 2.25 : 1.85, depth = 1.25;
  const roof = .26 + floors * floorHeight;
  const box = (material, size, position) => kit.box(building, material, size, position);
  box('stone', [width+.22,.12,depth+.24], [0,.28,0]);
  box('ivory', [width, floors*floorHeight,depth], [0,.32+floors*floorHeight/2,0]);
  for (let floor=0; floor<floors; floor++) {
    const y = .48 + floor*floorHeight;
    const bays = commercial ? 3 : 2;
    for (let bay=0; bay<bays; bay++) {
      const x = (bay-(bays-1)/2)*(width/(bays+.15));
      box('glass', [commercial?.53:.56,.35,.025], [x,y+.12,depth/2+.025]);
      if (!compact && !commercial) {
        box('stone', [.67,.045,.2], [x,y-.08,depth/2+.1]);
        box('metal', [.65,.035,.025], [x,y+.02,depth/2+.21]);
      }
    }
    box('stone', [width+.08,.055,depth+.08], [0,.32+(floor+1)*floorHeight,0]);
    for (const side of [-1,1]) box('glass', [.025,.3,.48], [side*(width/2+.015),y+.12,-.08]);
  }
  box('ivory', [width+.22,.09,depth+.22], [0,roof+.14,0]);
  if (commercial) {
    // Shopfront canopy, slim sign fascia, roof plant and a paved forecourt.
    box('sand', [width+.12,.11,.48], [0,.97,depth/2+.17]);
    box('green', [width-.2,.19,.055], [0,.98,depth/2+.43]);
    for (const x of [-.62,0,.62]) box('lamp', [.27,.035,.022], [x,.99,depth/2+.465]);
    box('stone', [width+.2,.035,.45], [0,.25,depth/2+.32]);
    box('metal', [.44,.22,.34], [-.56,roof+.29,-.22]);
    for (const x of [-.65,-.46]) box('dark', [.025,.025,.26], [x,roof+.41,-.22]);
    box('dark', [.35,.28,.3], [.58,roof+.33,-.17]);
  } else {
    // Recessed entry, roof terrace, solar panels and garden planters.
    box('dark', [.32,.43,.035], [0,.53,depth/2+.045]);
    box('stone', [.52,.055,.28], [0,.28,depth/2+.14]);
    for (const x of [-.58,.15]) {
      box('windscreen', [.51,.035,.46], [x,roof+.21,-.1]);
      box('silver', [.025,.045,.47], [x,roof+.23,-.1]);
    }
    box('ivory', [.12,.19,depth+.1], [width/2,roof+.28,0]);
    for (const x of [-1.03,1.03]) {
      box('stone', [.23,.16,.36], [x,.34,.65]);
      box('leaf', [.19,.16,.32], [x,.48,.65]);
    }
  }
  return roof + .49;
}
