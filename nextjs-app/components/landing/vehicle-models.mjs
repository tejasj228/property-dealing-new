import { ExtrudeGeometry, Group, Mesh, MeshPhysicalMaterial, Shape } from 'three';

// Side profiles (z forward, y up) extruded across the width with rounded bevels.
// Lower body and greenhouse are separate so the tinted glass band reads as windows.
const PROFILES = {
  hatch: {
    body: [[-.47,.11],[-.485,.24],[-.47,.3],[-.41,.325],[.23,.32],[.43,.29],[.485,.245],[.49,.14],[.46,.11]],
    glass: [[-.405,.315],[-.345,.4],[-.07,.44],[.1,.435],[.25,.318]],
    roof: [[-.33,.402],[-.07,.443],[.09,.438],[.09,.452],[-.07,.457],[-.33,.416]],
    width: .4, wheel: .1, axle: .3, track: .205, pillar: -.03,
  },
  sedan: {
    body: [[-.52,.11],[-.53,.25],[-.5,.31],[-.4,.33],[.24,.32],[.45,.29],[.52,.24],[.52,.14],[.49,.11]],
    glass: [[-.34,.318],[-.23,.405],[-.02,.43],[.12,.425],[.27,.32]],
    roof: [[-.22,.405],[-.02,.433],[.11,.428],[.11,.442],[-.02,.447],[-.22,.419]],
    width: .41, wheel: .1, axle: .33, track: .21, pillar: -.06,
  },
  suv: {
    body: [[-.5,.13],[-.51,.3],[-.48,.36],[.27,.36],[.46,.33],[.51,.28],[.51,.15],[.48,.13]],
    glass: [[-.47,.352],[-.45,.49],[.12,.5],[.29,.355]],
    roof: [[-.46,.49],[.12,.5],[.12,.516],[-.46,.507]],
    width: .43, wheel: .12, axle: .33, track: .22, pillar: -.12,
  },
};
function extrude(points, width, bevel) {
  const shape = new Shape(); points.forEach(([z, y], i) => i ? shape.lineTo(z, y) : shape.moveTo(z, y)); shape.closePath();
  const geometry = new ExtrudeGeometry(shape, { depth: width, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * .8, bevelSegments: 2, curveSegments: 1 });
  geometry.rotateY(-Math.PI / 2); geometry.translate(width / 2, 0, 0); geometry.computeVertexNormals();
  return geometry;
}

export function createVehicleModels(kit) {
  const cache = new Map(), extra = [];
  const geometry = (key, make) => { if (!cache.has(key)) { const g = make(); cache.set(key, g); kit.resources.geometries.push(g); } return cache.get(key); };
  const material = (name, options) => {
    if (!kit.materials[name]) { kit.materials[name] = new MeshPhysicalMaterial({ name, ...options }); kit.resources.materials.push(kit.materials[name]); extra.push(kit.materials[name]); }
    return kit.materials[name];
  };
  const tail = () => { const m = material('tail-light', { color: '#7a1a14', roughness: .3 }); m.userData.nightTail = true; return m; };
  const tinted = () => material('vehicle-glass', { color: '#16212a', roughness: .08, metalness: .5, clearcoat: 1, clearcoatRoughness: .05 });
  const part = (parent, g, m, cast = true) => { const mesh = new Mesh(g, m); mesh.castShadow = cast; mesh.receiveShadow = true; parent.add(mesh); return mesh; };

  function wheels(g, profile, front = true, rear = true) {
    const list = [];
    for (const side of [-1, 1]) for (const end of [-1, 1]) {
      if ((end > 0 && !front) || (end < 0 && !rear)) continue;
      const axle = new Group(); axle.userData.animated = true; axle.position.set(side * profile.track, profile.wheel, end * profile.axle); g.add(axle);
      const tyre = kit.round(axle, 'dark', [profile.wheel, .075, profile.wheel], [0, 0, 0]); tyre.rotation.z = Math.PI / 2;
      const rim = kit.round(axle, 'silver', [profile.wheel * .58, .08, profile.wheel * .58], [0, 0, 0]); rim.rotation.z = Math.PI / 2;
      list.push(axle);
    }
    return list;
  }
  function car(paint, type = 'hatch') {
    const profile = PROFILES[type], g = new Group(); g.name = 'car'; g.userData.animated = true;
    part(g, geometry(`${type}-body`, () => extrude(profile.body, profile.width, .03)), paint);
    part(g, geometry(`${type}-glass`, () => extrude(profile.glass, profile.width - .03, .018)), tinted());
    part(g, geometry(`${type}-roof`, () => extrude(profile.roof, profile.width - .05, .015)), paint);
    const front = profile.body.reduce((m, [z]) => Math.max(m, z), 0), back = profile.body.reduce((m, [z]) => Math.min(m, z), 0);
    const beltline = profile.glass[0][1];
    // Pillars, mirrors, bumpers, grille, plates, head and tail lights.
    kit.box(g, 'dark', [profile.width + .055, .1, .03], [0, beltline + .06, profile.pillar], false).material = paint;
    for (const side of [-1, 1]) {
      kit.box(g, 'dark', [.05, .03, .04], [side * (profile.width / 2 + .045), beltline + .02, profile.glass.at(-1)[0] - .04], false).material = paint;
      kit.box(g, 'lamp', [.1, .035, .02], [side * .14, beltline - .06, front + .005], false);
      kit.box(g, 'dark', [.11, .045, .02], [side * .15, beltline - .05, back - .005], false).material = tail();
      kit.glow(g, side * .14, front + .62, .5, 1.25, .045);
    }
    kit.box(g, 'dark', [profile.width + .04, .045, .03], [0, .15, front - .005], false);
    kit.box(g, 'dark', [profile.width + .04, .045, .03], [0, .15, back + .005], false);
    kit.box(g, 'dark', [.2, .045, .012], [0, beltline - .085, front + .012], false);
    kit.box(g, 'ivory', [.12, .035, .01], [0, .2, front + .018], false);
    kit.box(g, 'ivory', [.12, .035, .01], [0, .21, back - .018], false);
    g.userData.wheels = wheels(g, profile);
    return g;
  }
  // A Delhi CNG auto-rickshaw: green body, yellow canopy, one front wheel.
  function rickshaw() {
    const g = new Group(); g.name = 'auto-rickshaw'; g.userData.animated = true;
    const green = material('rickshaw-green', { color: '#2f7a3b', roughness: .35, clearcoat: .8, clearcoatRoughness: .2 });
    const yellow = material('rickshaw-yellow', { color: '#e3b52a', roughness: .5 });
    kit.box(g, 'dark', [.36, .1, .56], [0, .15, -.04]).material = green;
    kit.box(g, 'dark', [.2, .28, .12], [0, .3, .22]).material = green;
    kit.box(g, 'dark', [.34, .16, .04], [0, .42, .2], false).material = tinted();
    kit.box(g, 'dark', [.4, .05, .6], [0, .6, -.05]).material = yellow;
    kit.box(g, 'dark', [.4, .22, .03], [0, .48, -.34]).material = yellow;
    for (const x of [-.18, .18]) for (const z of [.19, -.32]) kit.box(g, 'dark', [.022, .4, .022], [x, .4, z], false);
    kit.box(g, 'dark', [.34, .1, .2], [0, .27, -.2]);
    kit.box(g, 'lamp', [.06, .04, .02], [0, .3, .29], false);
    for (const side of [-1, 1]) kit.box(g, 'dark', [.05, .035, .02], [side * .14, .2, -.33], false).material = tail();
    kit.glow(g, 0, .85, .38, .9, .045);
    const profile = { track: .17, wheel: .075, axle: .2 };
    const list = [];
    for (const [x, z] of [[0, .24], [-.17, -.22], [.17, -.22]]) {
      const axle = new Group(); axle.userData.animated = true; axle.position.set(x, .075, z); g.add(axle);
      const tyre = kit.round(axle, 'dark', [.075, .05, .075], [0, 0, 0]); tyre.rotation.z = Math.PI / 2; list.push(axle);
    }
    g.userData.wheels = list; g.userData.profile = profile;
    return g;
  }
  // A low-floor city bus with a continuous glass band and lit destination board.
  function bus() {
    const g = new Group(); g.name = 'city-bus'; g.userData.animated = true;
    const livery = material('bus-livery', { color: '#c8562c', roughness: .35, clearcoat: .9, clearcoatRoughness: .15 });
    const white = material('bus-white', { color: '#ece9e1', roughness: .4, clearcoat: .6 });
    kit.box(g, 'dark', [.5, .26, 1.9], [0, .26, 0]).material = livery;
    kit.box(g, 'dark', [.5, .2, 1.9], [0, .5, 0]).material = white;
    kit.box(g, 'dark', [.512, .16, 1.78], [0, .48, -.02], false).material = tinted();
    kit.box(g, 'dark', [.46, .2, .02], [0, .45, .955], false).material = tinted();
    kit.box(g, 'dark', [.5, .04, 1.9], [0, .615, 0]).material = livery;
    kit.box(g, 'lamp', [.3, .05, .015], [0, .58, .962], false);
    for (const side of [-1, 1]) { kit.box(g, 'lamp', [.08, .04, .02], [side * .18, .2, .955], false); kit.box(g, 'dark', [.07, .07, .02], [side * .2, .24, -.955], false).material = tail(); kit.glow(g, side * .16, 1.6, .5, 1.3, .045); }
    kit.box(g, 'metal', [.3, .06, .5], [0, .66, -.3]);
    const list = [];
    for (const side of [-1, 1]) for (const z of [.6, -.62]) {
      const axle = new Group(); axle.userData.animated = true; axle.position.set(side * .22, .11, z); g.add(axle);
      const tyre = kit.round(axle, 'dark', [.11, .07, .11], [0, 0, 0]); tyre.rotation.z = Math.PI / 2; list.push(axle);
    }
    g.userData.wheels = list;
    return g;
  }
  return { car, rickshaw, bus };
}
