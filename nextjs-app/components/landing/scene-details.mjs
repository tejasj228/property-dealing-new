import { BoxGeometry, CylinderGeometry, Group, IcosahedronGeometry, Mesh, MeshStandardMaterial, PlaneGeometry, ShaderMaterial, SphereGeometry } from 'three';

export function createDetailKit() {
  const crowns = [], people = [];
  const cube = new BoxGeometry(1, 1, 1);
  const cylinder = new CylinderGeometry(1, 1, 1, 10);
  const leaf = new IcosahedronGeometry(1, 1);
  const sphere = new SphereGeometry(1, 8, 6);
  const materials = Object.fromEntries(Object.entries({
    stone: '#d9dfd3', ivory: '#f0f0e6', grass: '#9aaf87', leaf: '#628268',
    trunk: '#a18d74', road: '#b7c1b9', paint: '#e9ece2', glass: '#668d86', windscreen: '#668d86',
    dark: '#405b50', green: '#356d59', water: '#8bb9b1', sand: '#c4c0a4',
    silver: '#cbd3cb', metal: '#7d9186', person: '#b9947e', cloth: '#547c70', lamp: '#f1ead8',
  }).map(([name, color]) => [name, new MeshStandardMaterial({
    color, roughness: name === 'glass' ? 0.25 : name === 'silver' || name === 'metal' ? 0.32 : 0.85,
    metalness: name === 'silver' || name === 'metal' ? 0.52 : name === 'glass' ? 0.28 : 0,
  })]));
  materials.glass.userData.nightWindow = true;
  materials.lamp.userData.nightLamp = true;
  const glowGeometry = new PlaneGeometry(1, 1);
  const glowMaterial = new ShaderMaterial({ transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'varying vec2 vUv; void main(){ float falloff=pow(max(0.0,1.0-length((vUv-0.5)*2.0)),1.5); gl_FragColor=vec4(1.0,0.77,0.36,falloff*0.48); }',
  });
  function glow(parent, x, z, width, length, height = 0.12) {
    const light = new Mesh(glowGeometry, glowMaterial); light.name = 'lamp-pool'; light.userData.nightOnly = true;
    light.rotation.x = -Math.PI / 2; light.position.set(x, height, z); light.scale.set(width, length, 1); light.visible = false; parent.add(light);
  }
  function mesh(parent, geometry, material, size, position, cast = true) {
    const m = new Mesh(geometry, materials[material]); m.scale.set(...size); m.position.set(...position);
    m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
  }
  const box = (parent, material, size, position, cast) => mesh(parent, cube, material, size, position, cast);
  const round = (parent, material, size, position) => mesh(parent, cylinder, material, size, position);
  function tree(parent, x, z, size = 1) {
    round(parent, 'trunk', [0.06, 0.65 * size, 0.06], [x, 0.4 * size, z]);
    const crown = new Group(); crown.name = 'tree-crown'; crown.userData.animated = true; crown.position.set(x, 0.65 * size, z); parent.add(crown);
    mesh(crown, leaf, 'leaf', [0.48 * size, 0.65 * size, 0.48 * size], [0, 0.37 * size, 0]);
    for (const side of [-1, 1]) mesh(crown, leaf, 'leaf', [0.32 * size, 0.4 * size, 0.34 * size], [side * 0.28 * size, 0.2 * size, 0.08]);
    crowns.push(crown);
  }
  function car(parent, x, z, angle = 0, color = 'ivory') {
    const g = new Group(); g.name = 'car'; g.userData.animated = true; g.position.set(x, 0.11, z); g.rotation.y = angle; parent.add(g);
    box(g, color, [0.48, 0.21, 0.93], [0, 0.19, 0]);
    box(g, 'windscreen', [0.4, 0.15, 0.46], [0, 0.36, -0.03]);
    box(g, color, [0.42, 0.04, 0.3], [0, 0.46, -0.035]);
    box(g, 'dark', [0.035, 0.16, 0.48], [0, 0.36, -0.03], false);
    for (const x of [-0.16, 0.16]) {
      box(g, 'lamp', [0.12, 0.075, 0.025], [x, 0.23, 0.475], false);
      glow(g, x, 1.05, 0.55, 1.35, 0.045);
      box(g, 'trunk', [0.1, 0.055, 0.018], [x, 0.23, -0.475], false);
    }
    const wheels = [];
    for (const side of [-1, 1]) for (const end of [-1, 1]) {
      const axle = new Group(); axle.position.set(side * 0.245, 0.12, end * 0.3); g.add(axle);
      const wheel = round(axle, 'dark', [0.1, 0.06, 0.1], [0, 0, 0]); wheel.rotation.z = Math.PI / 2;
      const hub = round(axle, 'silver', [0.05, 0.065, 0.05], [0, 0, 0]); hub.rotation.z = Math.PI / 2;
      box(axle, 'dark', [0.07, 0.015, 0.08], [0, 0, 0], false);
      wheels.push(axle);
    }
    g.userData.wheels = wheels;
    return g;
  }
  function person(parent, x, z, color = 'cloth') {
    const g = new Group(); g.name = 'person'; g.userData.animated = true; g.position.set(x, 0.07, z); parent.add(g);
    box(g, color, [0.12, 0.26, 0.12], [0, 0.25, 0]);
    mesh(g, sphere, 'person', [0.075, 0.08, 0.075], [0, 0.46, 0]);
    mesh(g, sphere, 'dark', [0.078, 0.045, 0.077], [0, 0.51, -0.01]);
    const limbs = [];
    for (const side of [-1, 1]) {
      const leg = new Group(); leg.position.set(side * 0.04, 0.17, 0); g.add(leg);
      box(leg, 'dark', [0.045, 0.17, 0.055], [0, -0.085, 0]);
      box(leg, 'ivory', [0.055, 0.035, 0.1], [0, -0.17, 0.02]);
      const arm = new Group(); arm.position.set(side * 0.09, 0.35, 0); g.add(arm);
      box(arm, color, [0.045, 0.17, 0.05], [0, -0.075, 0]);
      limbs.push({ leg, arm, side });
    }
    g.userData.limbs = limbs;
    people.push(g);
    return g;
  }
  function bench(parent, x, z, angle = 0) {
    const g = new Group(); g.name = 'bench'; g.userData.pedestrianObstacle = true; g.position.set(x, 0.1, z); g.rotation.y = angle; parent.add(g);
    box(g, 'trunk', [0.72, 0.07, 0.24], [0, 0.22, 0]);
    box(g, 'trunk', [0.72, 0.25, 0.05], [0, 0.39, -0.12]);
    for (const x of [-0.25, 0.25]) box(g, 'dark', [0.04, 0.2, 0.22], [x, 0.1, 0]);
    return g;
  }
  function base() {
    const g = new Group();
    box(g, 'stone', [10, 0.38, 8], [0, -0.26, 0]);
    box(g, 'grass', [9.8, 0.08, 7.8], [0, -0.025, 0]);
    box(g, 'road', [9.7, 0.035, 1.15], [0, 0.04, 3.05], false);
    box(g, 'stone', [9.6, 0.055, 0.18], [0, 0.06, 2.4], false);
    for (let x = -4; x < 4.2; x += 1.3) box(g, 'paint', [0.55, 0.012, 0.045], [x, 0.065, 3.05], false);
    for (let x = -4.5; x < 4.7; x += 0.45) box(g, 'paint', [0.28, 0.018, 0.12], [x, 0.1, 2.4], false);
    for (const x of [-4.45, 4.45]) {
      round(g, 'metal', [0.035, 1.65, 0.035], [x, 0.9, 2.15]);
      box(g, 'dark', [0.36, 0.06, 0.2], [x + (x < 0 ? 0.12 : -0.12), 1.75, 2.15]);
      box(g, 'lamp', [0.27, 0.065, 0.17], [x + (x < 0 ? 0.12 : -0.12), 1.71, 2.15], false);
    }
      glow(g, -4.32, 2.15, 1.8, 1.9); glow(g, 4.32, 2.15, 1.8, 1.9);
    return g;
  }
  function animate(seconds, reduced = false) {
    const time = reduced ? 0 : seconds;
    crowns.forEach((crown, i) => { crown.rotation.z = reduced ? 0 : Math.sin(time * 1.25 + i * 1.7) * 0.055; });
    people.forEach((person, i) => {
      const stride = reduced ? 0 : Math.sin(time * 4.5 + i * 1.8) * 0.38;
      person.userData.limbs.forEach(({ leg, arm, side }) => { leg.rotation.x = stride * side; arm.rotation.x = -stride * side; });
    });
  }
  return { box, round, tree, car, person, bench, mesh, cube, base, materials, animate,
    resources: { geometries: [cube, cylinder, leaf, sphere, glowGeometry], materials: [...Object.values(materials), glowMaterial] },
  };
}

