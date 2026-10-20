import { ACESFilmicToneMapping, HalfFloatType, PCFShadowMap, Vector2, WebGLRenderTarget, WebGLRenderer } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Ambient occlusion runs at half resolution; its denoised result is smooth enough to upscale.
class HalfResolutionGTAOPass extends GTAOPass {
  setSize(width, height) { super.setSize(Math.max(1, Math.round(width / 2)), Math.max(1, Math.round(height / 2))); }
}

// One renderer setup for every scene. Capable desktops render linear HDR into a
// multisampled half-float target, add screen-space ambient occlusion and bloom (lit
// windows, lamps, headlights and runway lights glow at night), then tone map once.
// Compact and low-power devices draw straight to the canvas with the same materials.
export function createSceneRenderer({ post = true, shadows = true, occlusion = true, exposure = 1.38 } = {}) {
  const renderer = new WebGLRenderer({ alpha: true, antialias: !post, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.shadowMap.type = PCFShadowMap;
  let composer = null, bloom = null, ambient = null, scene = null, camera = null;
  function attach(nextScene, nextCamera) {
    scene = nextScene; camera = nextCamera;
    if (!post || !renderer.capabilities.isWebGL2) return;
    const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 4 });
    composer = new EffectComposer(renderer, target);
    composer.addPass(new RenderPass(scene, camera));
    if (occlusion) {
      ambient = new HalfResolutionGTAOPass(scene, camera, 1, 1);
      ambient.blendIntensity = .85;
      ambient.updateGtaoMaterial({ radius: .45, distanceExponent: 1.4, thickness: 1.2, scale: 1.1, samples: 12 });
      ambient.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
      composer.addPass(ambient);
    }
    bloom = new UnrealBloomPass(new Vector2(1, 1), .18, .45, 1.4);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }
  return {
    renderer,
    attach,
    get post() { return Boolean(composer); },
    setNight(night) {
      if (!bloom) return;
      // Linear HDR thresholds: by day only specular glints bloom; at night every light does.
      bloom.enabled = night; bloom.strength = .5; bloom.threshold = .85; bloom.radius = .42;
      if (ambient) ambient.blendIntensity = night ? .55 : .85;
    },
    setSize(width, height, ratio) {
      renderer.setPixelRatio(ratio); renderer.setSize(width, height, false);
      if (composer) { composer.setPixelRatio(ratio); composer.setSize(width, height); }
    },
    render() { if (composer) composer.render(); else renderer.render(scene, camera); },
    dispose() {
      composer?.passes.forEach(pass => pass.dispose?.()); composer?.renderTarget1.dispose(); composer?.renderTarget2.dispose();
      renderer.dispose();
    },
  };
}
