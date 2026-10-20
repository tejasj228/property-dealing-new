import { Matrix4, Vector2 } from 'three';

// Shading cues that cost a few instructions per fragment and no extra passes:
// scanned maps are projected at one scale in model space instead of stretching per box,
// walls darken where they meet the ground, soffits see less sky, glazing is drawn as
// framed panes that reflect the sky by day and show lit rooms at night (switching over
// time), lawns vary like real turf, water ripples, leaves self-shade, grass darkens at
// the root, and cloud shadows drift across everything in daylight. Coordinates are
// model-relative, so nothing swims while a model is turned.
const SKIP = new Set(['soft-cloud']);
const GROUND = /^(grass|soil|sand)$/;

export function realismProfile(material) {
  if (material.name === 'autumn-leaf') return 'leaf';
  if (material.name === 'dry-grass-blade') return 'blade';
  if (material.name === 'water') return 'water';
  if (material.userData.nightWindow && !material.transparent) return 'window';
  if (GROUND.test(material.name)) return 'ground';
  return 'surface';
}

const vertexPars = `
uniform mat4 rlSceneInverse;
uniform float rlTexel;
uniform float rlTime;
#ifdef RL_FOREST
  attribute vec3 rlCrown;
#endif
varying vec3 vRlScene;
varying vec3 vRlNormal;
varying vec3 vRlLocal;
varying vec3 vRlVertex;
varying vec2 vRlUv;
`;
const vertexMain = `
vec4 rlLocal = vec4( transformed, 1.0 );
vRlVertex = transformed;
vRlUv = uv;
mat3 rlBasis = mat3( 1.0 );
#ifdef USE_INSTANCING
  rlLocal = instanceMatrix * rlLocal;
  rlBasis = mat3( instanceMatrix );
  vRlLocal = instanceMatrix[ 3 ].xyz;
  #ifdef RL_FOREST
    vRlLocal = rlCrown;
  #endif
#else
  vRlLocal = transformed;
#endif
mat4 rlToScene = rlSceneInverse * modelMatrix;
mat3 rlNormalBasis = mat3( rlToScene ) * rlBasis;
vRlScene = ( rlToScene * rlLocal ).xyz;
// Scale-and-rotation inverse transpose, as three.js does for instanced normals.
vRlNormal = normalize( rlNormalBasis * ( objectNormal / vec3( dot( rlNormalBasis[ 0 ], rlNormalBasis[ 0 ] ), dot( rlNormalBasis[ 1 ], rlNormalBasis[ 1 ] ), dot( rlNormalBasis[ 2 ], rlNormalBasis[ 2 ] ) ) ) );
`;
// Merged forests sway on the GPU: a coherent wind wave across the board, stronger
// toward the top of each crown.
const forestProjection = `
#ifdef RL_FOREST
  vec4 mvPosition = instanceMatrix * vec4( transformed, 1.0 );
  float rlSway = smoothstep( 0.4, 1.6, rlCrown.y ) * 0.03, rlWave = dot( mvPosition.xz, vec2( 0.42, 0.27 ) );
  mvPosition.x += ( sin( rlTime * 1.35 + rlWave ) * 0.8 + sin( rlTime * 3.1 + rlWave * 2.3 ) * 0.25 ) * rlSway;
  mvPosition.z += cos( rlTime * 1.05 + rlWave * 1.3 ) * rlSway * 0.6;
  mvPosition = modelViewMatrix * mvPosition;
  gl_Position = projectionMatrix * mvPosition;
#else
  #include <project_vertex>
#endif
`;
const projectedUv = `
vec3 rlAxis = abs( vRlNormal );
vec2 rlUv = ( rlAxis.y > max( rlAxis.x, rlAxis.z ) ? vRlScene.xz : rlAxis.x > rlAxis.z ? vRlScene.zy : vRlScene.xy ) * rlTexel;
#ifdef USE_MAP
  vMapUv = rlUv;
#endif
#ifdef USE_NORMALMAP
  vNormalMapUv = rlUv;
#endif
#ifdef USE_ROUGHNESSMAP
  vRoughnessMapUv = rlUv;
#endif
#ifdef USE_BUMPMAP
  vBumpMapUv = rlUv;
#endif
`;
const fragmentPars = `
uniform float rlGround;
uniform float rlRange;
uniform vec2 rlWindowCell;
uniform float rlTime;
uniform float rlNight;
uniform float rlClouds;
varying vec3 vRlScene;
varying vec3 vRlNormal;
varying vec3 vRlLocal;
varying vec3 vRlVertex;
varying vec2 vRlUv;
float rlHash( vec2 p ) { p = fract( p * vec2( 127.1, 311.7 ) ); p += dot( p, p + 34.23 ); return fract( p.x * p.y ); }
float rlNoise( vec2 p ) {
  vec2 i = floor( p ), f = fract( p ); f = f * f * ( 3.0 - 2.0 * f );
  return mix( mix( rlHash( i ), rlHash( i + vec2( 1.0, 0.0 ) ), f.x ), mix( rlHash( i + vec2( 0.0, 1.0 ) ), rlHash( i + 1.0 ), f.x ), f.y );
}
float rlFbm( vec2 p ) { return rlNoise( p ) * 0.55 + rlNoise( p * 2.07 + 13.1 ) * 0.3 + rlNoise( p * 4.3 + 7.7 ) * 0.15; }
`;
const contactOcclusion = `
vec3 rlN = normalize( vRlNormal );
float rlHeight = vRlScene.y - rlGround;
float rlWall = 1.0 - abs( rlN.y );
// Only the band just above the ground plane; foundation edges below it stay untouched.
float rlBand = smoothstep( -0.16, -0.02, rlHeight );
float rlAO = mix( 1.0, mix( 0.46, 1.0, smoothstep( 0.0, rlRange, rlHeight ) ), rlWall * rlBand );
rlAO *= mix( 1.0, 0.6, smoothstep( 0.3, 0.95, - rlN.y ) );
`;
const applyOcclusion = (ao, direct) => `
reflectedLight.indirectDiffuse *= ${ao};
reflectedLight.indirectSpecular *= mix( 1.0, ${ao}, 0.75 );
reflectedLight.directDiffuse *= mix( 1.0, ${ao}, ${direct} );
`;
// Soft-edged cloud shadows drifting with the wind, daylight only.
const cloudShadow = `
float rlCloud = smoothstep( 0.5, 0.72, rlFbm( vRlScene.xz * 0.075 + vec2( rlTime * 0.018, rlTime * 0.007 ) ) );
float rlShade = 1.0 - rlCloud * rlClouds * ( 1.0 - rlNight );
reflectedLight.directDiffuse *= rlShade; reflectedLight.directSpecular *= rlShade;
`;
// Framed panes: mullions every bay, a frame along the pane's own edges, curtains and
// blinds by day, and a share of lit rooms at night that changes every few minutes.
const windowSurface = `
vec2 rlFace = vec2( ( vRlScene.x + vRlScene.z ) * rlWindowCell.x, vRlScene.y * rlWindowCell.y );
vec2 rlCell = floor( rlFace ), rlIn = fract( rlFace );
float rlPane = rlHash( rlCell );
float rlFrame = max( 1.0 - smoothstep( 0.03, 0.06, min( rlIn.x, 1.0 - rlIn.x ) ), 1.0 - smoothstep( 0.04, 0.09, min( vRlUv.y, 1.0 - vRlUv.y ) ) );
float rlCurtain = step( 0.62, rlHash( rlCell + 2.3 ) ) * step( rlIn.x, 0.25 + 0.5 * rlHash( rlCell + 4.1 ) );
vec3 rlGlass = diffuseColor.rgb * mix( 0.7, 1.15, rlPane );
vec3 rlInterior = mix( vec3( 0.62, 0.55, 0.45 ), vec3( 0.78, 0.74, 0.66 ), rlHash( rlCell + 8.8 ) );
diffuseColor.rgb = mix( mix( rlGlass, rlInterior * 0.55, rlCurtain * 0.8 ), vec3( 0.16, 0.17, 0.17 ), rlFrame );
`;
const windowRoughness = `
roughnessFactor = mix( clamp( 0.05 + rlHash( rlCell + 3.7 ) * 0.08 + rlCurtain * 0.5, 0.03, 1.0 ), 0.5, rlFrame );
`;
const windowMetal = `
metalnessFactor = mix( metalnessFactor * ( 1.0 - rlCurtain * 0.8 ), 0.35, rlFrame );
`;
const windowEmission = `
float rlSlot = floor( rlTime / 41.0 + rlHash( rlCell + 1.9 ) * 9.0 );
float rlLit = step( 0.4, rlHash( rlCell + vec2( rlSlot * 0.173, 17.3 ) ) );
vec3 rlRoom = mix( vec3( 1.0, 0.82, 0.58 ), vec3( 0.8, 0.9, 1.1 ), step( 0.86, rlHash( rlCell + 5.1 ) ) );
float rlGlow = rlLit * mix( 0.55, 1.35, rlHash( rlCell + 9.7 ) ) * mix( 0.8, 1.2, vRlUv.y ) * ( 1.0 - rlCurtain * 0.55 );
totalEmissiveRadiance = emissive * rlRoom * rlGlow * ( 1.0 - rlFrame );
`;
// Natural turf and soil: broad wet/dry patches with finer mottling.
const groundSurface = `
float rlPatch = rlFbm( vRlScene.xz * 0.42 ) * 0.7 + rlNoise( vRlScene.xz * 3.1 ) * 0.3;
diffuseColor.rgb *= mix( vec3( 0.8, 0.9, 0.72 ), vec3( 1.14, 1.06, 0.9 ), rlPatch );
`;
// Wind ripples perturb the view-space normal; reflections come from the HDR environment.
const waterNormal = `
vec2 rlW = vRlScene.xz * 7.0;
vec2 rlRipple = vec2( sin( rlW.x * 1.3 + rlTime * 1.6 ) + sin( rlW.x * 0.6 - rlW.y * 1.9 + rlTime * 1.1 ),
  cos( rlW.y * 1.7 - rlTime * 1.3 ) + sin( rlW.y * 0.7 + rlW.x * 1.4 + rlTime * 1.9 ) ) * 0.09;
normal = normalize( normal + ( viewMatrix * vec4( rlRipple.x, 0.0, rlRipple.y, 0.0 ) ).xyz );
`;

export function applySurfaceRealism(model, { ground = 0, range = .55, texelScale = 1, windowCell = [3.4, 2.78], clouds = .38 } = {}) {
  const uniforms = {
    rlSceneInverse: { value: new Matrix4() }, rlTexel: { value: texelScale },
    rlGround: { value: ground }, rlRange: { value: range }, rlWindowCell: { value: new Vector2(...windowCell) },
    rlTime: { value: 0 }, rlNight: { value: 0 }, rlClouds: { value: clouds },
  };
  const patched = [];
  model.traverse(object => {
    const material = object.material;
    if (!material?.isMeshStandardMaterial || SKIP.has(material.name) || material.userData.realism) return;
    const profile = realismProfile(material), previous = material.onBeforeCompile, previousKey = material.customProgramCacheKey;
    material.userData.realism = profile;
    material.onBeforeCompile = (shader, renderer) => {
      previous.call(material, shader, renderer);
      Object.assign(shader.uniforms, uniforms);
      const projected = profile === 'surface' || profile === 'ground';
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\n${vertexPars}`)
        .replace('#include <project_vertex>', `${profile === 'leaf' ? forestProjection : '#include <project_vertex>'}\n${vertexMain}${projected ? projectedUv : ''}`);
      let fragment = shader.fragmentShader.replace('#include <common>', `#include <common>\n${fragmentPars}`);
      if (profile === 'window') fragment = fragment
        .replace('#include <color_fragment>', `#include <color_fragment>\n${windowSurface}`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n${windowRoughness}`)
        .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>\n${windowMetal}`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${windowEmission}`);
      // Beacons and strobes flash; sequenced lights (approach lighting) run as a wave.
      if (material.userData.blink) fragment = fragment.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
float rlFlash = fract( rlTime * ${material.userData.blink === 'sequence' ? '1.4 - ( vRlScene.x + vRlScene.z ) * 0.45' : '0.85 + rlHash( floor( vRlScene.xz * 3.0 ) )'} );
totalEmissiveRadiance *= 0.06 + 2.2 * ( 1.0 - smoothstep( 0.0, ${material.userData.blink === 'sequence' ? '0.12' : '0.18'}, rlFlash ) );`);
      if (profile === 'ground') fragment = fragment.replace('#include <color_fragment>', `#include <color_fragment>\n${groundSurface}`);
      if (profile === 'water') fragment = fragment.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${waterNormal}`);
      if (profile === 'blade') fragment = fragment.replace('#include <color_fragment>', `#include <color_fragment>
diffuseColor.rgb *= mix( vec3( 0.78, 0.86, 0.7 ), vec3( 1.08, 1.03, 0.9 ), smoothstep( 0.0, 1.0, vRlVertex.y ) );`);
      const occlusion = profile === 'leaf'
        // Crown-space leaf position: the lower interior of a canopy receives little sky.
        ? `float rlLeaf = mix( 0.52, 1.0, smoothstep( 0.5, 1.45, vRlLocal.y ) ) * mix( 0.7, 1.0, smoothstep( 0.08, 0.42, length( vRlLocal.xz ) ) );${applyOcclusion('rlLeaf', '0.45')}`
        : profile === 'blade'
          ? `float rlRoot = mix( 0.4, 1.0, smoothstep( 0.0, 0.8, vRlVertex.y ) );${applyOcclusion('rlRoot', '0.6')}`
          : `${contactOcclusion}${applyOcclusion('rlAO', '0.25')}`;
      shader.fragmentShader = fragment.replace('#include <aomap_fragment>', `#include <aomap_fragment>\n${occlusion}${cloudShadow}`);
    };
    material.customProgramCacheKey = () => `${previousKey.call(material)}|realism-${profile}-${material.userData.blink || 'steady'}-v2`;
    material.needsUpdate = true;
    patched.push({ material, previous, previousKey });
  });
  return {
    uniforms,
    // Called from Scene.onBeforeRender, after three.js has refreshed world matrices.
    update() { uniforms.rlSceneInverse.value.copy(model.matrixWorld).invert(); },
    setTime(seconds) { uniforms.rlTime.value = seconds; },
    setNight(night) { uniforms.rlNight.value = night ? 1 : 0; },
    dispose() {
      patched.forEach(({ material, previous, previousKey }) => {
        material.onBeforeCompile = previous; material.customProgramCacheKey = previousKey; delete material.userData.realism;
      });
    },
  };
}
