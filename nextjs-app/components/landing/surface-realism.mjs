import { Matrix4, Vector2 } from 'three';

// Shading cues that cost a few instructions per fragment and no extra passes:
// scanned maps are projected at one scale in model space instead of stretching per box,
// walls darken where they meet the ground, soffits see less sky, glazing varies per pane
// (lit and unlit rooms at night), leaves self-shade inside the crown and grass darkens at
// the root. Coordinates are model-relative, so nothing swims while a model is turned.
const SKIP = new Set(['soft-cloud']);

export function realismProfile(material) {
  if (material.name === 'autumn-leaf') return 'leaf';
  if (material.name === 'dry-grass-blade') return 'blade';
  if (material.userData.nightWindow && !material.transparent) return 'window';
  return 'surface';
}

const vertexPars = `
uniform mat4 rlSceneInverse;
uniform float rlTexel;
varying vec3 vRlScene;
varying vec3 vRlNormal;
varying vec3 vRlLocal;
varying vec3 vRlVertex;
`;
const vertexMain = `
vec4 rlLocal = vec4( transformed, 1.0 );
vRlVertex = transformed;
mat3 rlBasis = mat3( 1.0 );
#ifdef USE_INSTANCING
  rlLocal = instanceMatrix * rlLocal;
  rlBasis = mat3( instanceMatrix );
  vRlLocal = instanceMatrix[ 3 ].xyz;
#else
  vRlLocal = transformed;
#endif
mat4 rlToScene = rlSceneInverse * modelMatrix;
mat3 rlNormalBasis = mat3( rlToScene ) * rlBasis;
vRlScene = ( rlToScene * rlLocal ).xyz;
// Scale-and-rotation inverse transpose, as three.js does for instanced normals.
vRlNormal = normalize( rlNormalBasis * ( objectNormal / vec3( dot( rlNormalBasis[ 0 ], rlNormalBasis[ 0 ] ), dot( rlNormalBasis[ 1 ], rlNormalBasis[ 1 ] ), dot( rlNormalBasis[ 2 ], rlNormalBasis[ 2 ] ) ) ) );
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
varying vec3 vRlScene;
varying vec3 vRlNormal;
varying vec3 vRlLocal;
varying vec3 vRlVertex;
float rlHash( vec2 p ) { p = fract( p * vec2( 127.1, 311.7 ) ); p += dot( p, p + 34.23 ); return fract( p.x * p.y ); }
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

export function applySurfaceRealism(model, { ground = 0, range = .55, texelScale = 1, windowCell = [3.4, 2.78] } = {}) {
  const uniforms = {
    rlSceneInverse: { value: new Matrix4() }, rlTexel: { value: texelScale },
    rlGround: { value: ground }, rlRange: { value: range }, rlWindowCell: { value: new Vector2(...windowCell) },
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
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\n${vertexPars}`)
        .replace('#include <project_vertex>', `#include <project_vertex>\n${vertexMain}${profile === 'surface' ? projectedUv : ''}`);
      let fragment = shader.fragmentShader.replace('#include <common>', `#include <common>\n${fragmentPars}`);
      if (profile === 'window') {
        // One cell per pane: blinds and reflectance vary by day, a share of rooms is lit at night.
        fragment = fragment
          .replace('#include <color_fragment>', `#include <color_fragment>
vec2 rlCell = floor( vec2( ( vRlScene.x + vRlScene.z ) * rlWindowCell.x, vRlScene.y * rlWindowCell.y ) );
float rlPane = rlHash( rlCell );
diffuseColor.rgb *= mix( 0.58, 1.2, rlPane );`)
          .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
roughnessFactor = clamp( roughnessFactor + ( rlHash( rlCell + 3.7 ) - 0.5 ) * 0.09, 0.03, 1.0 );`)
          .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
vec3 rlRoom = mix( vec3( 1.06, 0.9, 0.7 ), vec3( 0.82, 0.92, 1.12 ), step( 0.88, rlHash( rlCell + 5.1 ) ) );
totalEmissiveRadiance *= rlRoom * ( rlHash( rlCell + 17.3 ) > 0.4 ? mix( 0.7, 1.5, rlHash( rlCell + 9.7 ) ) : 0.04 );`);
      }
      if (profile === 'blade') fragment = fragment.replace('#include <color_fragment>', `#include <color_fragment>
diffuseColor.rgb *= mix( vec3( 0.78, 0.86, 0.7 ), vec3( 1.08, 1.03, 0.9 ), smoothstep( 0.0, 1.0, vRlVertex.y ) );`);
      const occlusion = profile === 'leaf'
        // Crown-space leaf position: the lower interior of a canopy receives little sky.
        ? `float rlLeaf = mix( 0.52, 1.0, smoothstep( 0.5, 1.45, vRlLocal.y ) ) * mix( 0.7, 1.0, smoothstep( 0.08, 0.42, length( vRlLocal.xz ) ) );${applyOcclusion('rlLeaf', '0.45')}`
        : profile === 'blade'
          ? `float rlRoot = mix( 0.4, 1.0, smoothstep( 0.0, 0.8, vRlVertex.y ) );${applyOcclusion('rlRoot', '0.6')}`
          : `${contactOcclusion}${applyOcclusion('rlAO', '0.25')}`;
      shader.fragmentShader = fragment.replace('#include <aomap_fragment>', `#include <aomap_fragment>\n${occlusion}`);
    };
    material.customProgramCacheKey = () => `${previousKey.call(material)}|realism-${profile}-v1`;
    material.needsUpdate = true;
    patched.push({ material, previous, previousKey });
  });
  return {
    uniforms,
    // Called from Scene.onBeforeRender, after three.js has refreshed world matrices.
    update() { uniforms.rlSceneInverse.value.copy(model.matrixWorld).invert(); },
    dispose() {
      patched.forEach(({ material, previous, previousKey }) => {
        material.onBeforeCompile = previous; material.customProgramCacheKey = previousKey; delete material.userData.realism;
      });
    },
  };
}
