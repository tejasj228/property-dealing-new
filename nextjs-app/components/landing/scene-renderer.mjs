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

// Every scene on a page shares one WebGL context. Shader programs, decoded textures and
// HDR environments are compiled and uploaded once instead of once per scene, which is
// what made later sections slow to appear. Each scene renders into a corner of the
// shared drawing buffer and copies that region into its own visible 2D canvas.
let shared = null;
function acquireRenderer(antialias) {
  if (!shared) {
    const renderer = new WebGLRenderer({ alpha: true, antialias, powerPreference: 'high-performance' });
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.type = PCFShadowMap;
    renderer.autoClear = true;
    shared = { renderer, refs: 0, width: 1, height: 1 };
  }
  shared.refs++;
  return shared;
}
function releaseRenderer() {
  if (!shared || --shared.refs > 0) return;
  shared.renderer.dispose(); shared = null;
}

// Capable desktops render linear HDR into a multisampled half-float target, add
// screen-space ambient occlusion and night bloom (lit windows, lamps, headlights and
// runway lights glow), then tone map once. Compact and low-power devices draw straight
// to the buffer with the same materials.
export function createSceneRenderer({ post = true, shadows = true, occlusion = true, exposure = 1.38 } = {}) {
  const context = acquireRenderer(!post), renderer = context.renderer;
  renderer.toneMappingExposure = exposure;
  const canvas = document.createElement('canvas'), surface = canvas.getContext('2d');
  let composer = null, bloom = null, ambient = null, scene = null, camera = null, width = 1, height = 1, released = false, night = false, frames = 0;
  function attach(nextScene, nextCamera) { scene = nextScene; camera = nextCamera; }
  // The post chain is built after the first frame is on screen, so its passes compile
  // while the scene is already visible instead of delaying the first paint.
  function buildComposer() {
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
    bloom = new UnrealBloomPass(new Vector2(1, 1), .5, .42, .85);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    composer.setSize(width, height);
    applyNight();
  }
  function applyNight() {
    if (!bloom) return;
    // Bloom costs five blur passes, so it runs only at night when every light glows.
    bloom.enabled = night;
    if (ambient) ambient.blendIntensity = night ? .55 : .85;
  }
  return {
    renderer,
    domElement: canvas,
    get post() { return Boolean(composer); },
    // True after the first frame until bloom and occlusion are attached on the next one.
    get upgradePending() { return post && !composer && frames > 0 && renderer.capabilities.isWebGL2; },
    attach,
    setNight(value) { night = value; applyNight(); },
    // Puts the shared renderer in this scene's state, so shaders compiled ahead of the
    // first frame match the variants that frame uses (shadowed or not).
    bind() { renderer.shadowMap.enabled = shadows; },
    // Width and height are device pixels.
    setSize(nextWidth, nextHeight) {
      width = Math.max(1, Math.round(nextWidth)); height = Math.max(1, Math.round(nextHeight));
      canvas.width = width; canvas.height = height;
      composer?.setSize(width, height);
    },
    // `updateShadows` redraws this scene's shadow maps on this frame.
    render(updateShadows = true) {
      if (width > context.width || height > context.height) {
        context.width = Math.max(context.width, width); context.height = Math.max(context.height, height);
        renderer.setSize(context.width, context.height, false);
      }
      this.bind();
      renderer.shadowMap.needsUpdate = shadows && updateShadows;
      // GL viewports start at the bottom-left; this region is the buffer's top-left corner.
      const y = context.height - height;
      renderer.setViewport(0, y, width, height); renderer.setScissor(0, y, width, height); renderer.setScissorTest(true);
      if (post && !composer && frames > 0 && renderer.capabilities.isWebGL2) buildComposer();
      frames++;
      renderer.setRenderTarget(null); renderer.clear();
      if (composer) composer.render(); else renderer.render(scene, camera);
      renderer.setScissorTest(false);
      surface.clearRect(0, 0, width, height);
      surface.drawImage(renderer.domElement, 0, 0, width, height, 0, 0, width, height);
    },
    dispose() {
      if (released) return; released = true;
      composer?.passes.forEach(pass => pass.dispose?.()); composer?.renderTarget1.dispose(); composer?.renderTarget2.dispose();
      releaseRenderer();
    },
  };
}
