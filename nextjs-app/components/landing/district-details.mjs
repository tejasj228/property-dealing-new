import { Group, Mesh, TorusGeometry } from 'three';

// Architectural cues, built from the shared kit and batched with the district.
// They describe illustrative places, not amenities promised by a real listing.
export function addDistrictDetails(t, district, kind, buildings) {
  function feature(name, obstacle = false, parent = district) {
    const group = new Group(); group.name = name; group.userData.pedestrianObstacle = obstacle;
    parent.add(group); return group;
  }
  if (kind === 'land') {
    const survey = feature('surveyed-parcels');
    for (const x of [-2.35, 2.35]) for (const z of [-2.15, -.2, 1.65]) {
      for (const dx of [-1.7, 1.7]) {
        t.box(survey, 'ivory', [.055, .23, .055], [x + dx, .18, z - .72]);
        t.box(survey, 'green', [.17, .1, .018], [x + dx + .065, .31, z - .72]);
      }
      for (const side of [-1, 1]) {
        t.box(survey, 'paint', [.32, .012, .045], [x + side * 1.5, .115, z + .69], false);
        t.box(survey, 'paint', [.045, .012, .25], [x + side * 1.65, .115, z + .58], false);
      }
    }
    const board = feature('land-sales-board', true);
    for (const x of [-3.65, -2.85]) t.box(board, 'trunk', [.05, .9, .05], [x, .5, 2.15]);
    t.box(board, 'ivory', [1.1, .5, .07], [-3.25, .88, 2.15]);
    t.box(board, 'green', [.98, .12, .015], [-3.25, 1.02, 2.195]);
    // A small parcel diagram gives the board meaning without invented inventory text.
    for (const x of [-3.55, -3.25, -2.95]) t.box(board, 'grass', [.22, .15, .02], [x, .79, 2.195], false);
    const utilities = feature('plot-utilities', true);
    t.box(utilities, 'stone', [.44, .6, .3], [4.45, .38, .8]);
    t.box(utilities, 'metal', [.34, .42, .025], [4.45, .4, .965]);
    for (let i = 0; i < 4; i++) t.box(utilities, 'dark', [.23, .018, .018], [4.45, .32 + i * .07, .985], false);
    for (const x of [-.55, .55]) t.box(utilities, 'stone', [.12, .6, .12], [x, .34, 2.2]);
    t.box(utilities, 'sand', [.9, .045, .045], [0, .63, 2.2]);
    for (let i = 0; i < 4; i++) t.box(utilities, 'ivory', [.08, .05, .05], [-.3 + i * .2, .63, 2.2]);
  }
  if (kind === 'society') {
    const entries = feature('apartment-entrances', false, buildings || district);
    for (const [x, height] of [[-3, 2.7], [0, 3.2], [3, 2.7]]) {
      t.box(entries, 'dark', [.35, .52, .06], [x + .6, .36, -1.23]);
      t.box(entries, 'stone', [.64, .065, .4], [x + .55, .66, -1.11]);
      t.box(entries, 'lamp', [.38, .025, .03], [x + .55, .62, -.91], false);
      t.round(entries, 'ivory', [.23, .38, .23], [x + .45, height + .4, -2.4]);
      t.round(entries, 'metal', [.24, .04, .24], [x + .45, height + .61, -2.4]);
      t.box(entries, 'stone', [.38, .025, .8], [x + .55, .08, -.6], false);
    }
    const gate = feature('society-security-gate', true);
    t.box(gate, 'ivory', [.85, .86, .72], [3.05, .51, 1.2]);
    t.box(gate, 'glass', [.64, .38, .035], [3.05, .65, 1.58]);
    t.box(gate, 'glass', [.035, .38, .48], [2.61, .65, 1.2]);
    t.box(gate, 'green', [1.02, .09, .88], [3.05, .99, 1.2]);
    for (const x of [2.4, 3.75]) t.box(gate, 'ivory', [.16, 1.15, .2], [x, .65, 2.05]);
    t.box(gate, 'green', [1.58, .19, .25], [3.075, 1.25, 2.05]);
    for (let i = 0; i < 5; i++) t.box(gate, 'metal', [.035, .45, .035], [2.5 + i * .23, .38, 2.05]);
    const play = feature('residents-playground', true);
    t.box(play, 'sand', [1.8, .025, 1.55], [1.6, .105, 1.25], false);
    const slide = t.box(play, 'green', [.33, .045, .9], [2.2, .48, 1.43]); slide.rotation.x = .55;
    for (const x of [2.01, 2.39]) {
      t.box(play, 'ivory', [.035, .65, .035], [x, .43, 1]);
      const rail=t.box(play, 'ivory', [.03, .03, .96], [x, .57, 1.43]);rail.rotation.x=.55;
    }
    for (let i = 0; i < 3; i++) t.box(play, 'trunk', [.36, .035, .035], [2.2, .22 + i * .17, .99]);
    const park = feature('community-park');
    for (const z of [.45, 1.95]) t.box(park, 'ivory', [2.5, .05, .07], [-2.1, .15, z], false);
    for (const x of [-3.3, -1.6]) {
      t.box(park, 'stone', [.34, .18, .3], [x, .19, 1.6]);
      t.round(park, 'leaf', [.21, .2, .17], [x, .36, 1.6]);
    }
  }
  if (kind === 'commercial') {
    const promenade = feature('shopping-promenade');
    t.box(promenade, 'stone', [8.1, .045, .48], [0, .09, 2.1], false);
    for (let x = -3.8; x <= 4; x += .5) t.box(promenade, 'paint', [.018, .012, .45], [x, .12, 2.1], false);
    const signs = feature('shop-signs');
    const handleGeometry = new TorusGeometry(.045, .012, 5, 12);
    for (const x of [.05, 1.65, 3.25]) {
      t.box(signs, 'green', [.95, .28, .06], [x, 1.91, -.7]);
      t.box(signs, 'lamp', [.72, .02, .035], [x, 2.065, -.66], false);
      t.box(signs, 'metal', [.035, .19, .035], [x + .16, .71, -.66]);
    }
    // Cafe cup, retail shopping bag and a simple office directory.
    t.box(signs, 'ivory', [.14, .13, .025], [.02, 1.92, -.66]);
    const handle=new Mesh(handleGeometry,t.materials.ivory);handle.position.set(.11,1.92,-.64);signs.add(handle);
    t.box(signs, 'ivory', [.22, .15, .025], [1.65, 1.89, -.66]);
    const bagHandle=new Mesh(handleGeometry,t.materials.ivory);bagHandle.position.set(1.65,2,-.64);signs.add(bagHandle);
    for (let i = 0; i < 3; i++) t.box(signs, 'ivory', [.4-i*.06, .025, .025], [3.25, 1.85+i*.06, -.66], false);
    const office = feature('office-entry', true);
    t.box(office, 'green', [1.12, .07, .64], [-2.9, .91, -.39]);
    t.box(office, 'dark', [.6, .74, .06], [-2.9, .46, -.64]);
    for (const x of [-3.12, -2.68]) t.box(office, 'glass', [.2, .65, .035], [x, .46, -.59]);
    const bikes = feature('bicycle-parking', true);
    const wheelGeometry = new TorusGeometry(.16, .02, 5, 16);
    for (const x of [-3.4, -2.5]) {
      for (const dx of [-.23, .23]) { const wheel=new Mesh(wheelGeometry,t.materials.dark);wheel.position.set(x+dx,.27,.65);bikes.add(wheel); }
      const frame=t.box(bikes,'green',[.43,.035,.035],[x,.37,.65]);frame.rotation.z=.35;
      const fork=t.box(bikes,'metal',[.035,.43,.035],[x+.19,.45,.65]);fork.rotation.z=.15;
      t.box(bikes,'dark',[.13,.04,.09],[x-.11,.55,.65]);
      t.box(bikes,'metal',[.14,.03,.08],[x+.16,.67,.65]);
      t.box(bikes,'metal',[.035,.38,.035],[x-.1,.34,.65]);
    }
  }
}
