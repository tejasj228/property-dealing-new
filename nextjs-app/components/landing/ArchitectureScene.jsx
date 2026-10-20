'use client';

import { useEffect, useRef } from 'react';
import { createCity, createCityCamera, frameCityCamera, CITY_OVERSCAN } from './city-model.mjs';
import { Raycaster, Vector2, Scene, Vector3 } from 'three';
import { createSceneRenderer } from './scene-renderer.mjs';
import { createArchitecture, createSceneCamera, frameSceneCamera, scenePose } from './architecture.mjs';
import { createDistrict, createKeys, createSpatialCamera, frameSpatialCamera } from './spatial-models.mjs';
import { createOrbitSpring } from './orbit-spring.mjs';
import { createContactOffice } from './contact-office.mjs';
import { createKeySpring } from './key-spring.mjs';
import styles from './Landing.module.css';
import { compileScene, scenePixelRatio, prefersLightweightScene } from './render-policy.mjs';
import { createSceneLighting, observeSceneTheme } from './scene-lighting.mjs';

export default function ArchitectureScene({ progress, reduceMotion, paused, kind = 'house', selectedDistrict = null, onDistrictSelect, zoom = 1 }) {
  const hostRef = useRef(null);
  const cityRef = useRef(null), selectionRef = useRef(selectedDistrict), onSelectRef = useRef(onDistrictSelect), zoomRef = useRef(zoom);
  onSelectRef.current = onDistrictSelect;
  useEffect(() => { selectionRef.current = selectedDistrict; cityRef.current?.select(selectedDistrict); invalidateRef.current?.(); }, [selectedDistrict]);
  useEffect(() => { zoomRef.current = zoom; invalidateRef.current?.(); }, [zoom]);
  const pausedRef = useRef(paused);
  const invalidateRef = useRef(null);

  useEffect(() => {
    pausedRef.current = paused;
    if (!paused) invalidateRef.current?.();
  }, [paused]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const compact = window.matchMedia('(max-width: 767px)').matches;
    const lowPower = prefersLightweightScene(navigator);
    let view;
    try {
      // HDR post-processing (bloom, ambient occlusion) on capable desktops only. Shadow
      // maps are redrawn when the model turns or on alternate ambient frames.
      view = createSceneRenderer({ post: !compact && !lowPower, shadows: !compact && !lowPower && kind !== 'keys', occlusion: kind !== 'keys' });
    } catch {
      // The permanent CSS sculpture below remains available if WebGL is disabled.
      return;
    }
    const renderer = view.renderer;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = kind === 'city' ? createCityCamera() : kind === 'house' ? createSceneCamera() : createSpatialCamera(kind);
    const architecture = kind === 'city' ? createCity({ compact: compact || lowPower }) : kind === 'house' ? createArchitecture({ compact: compact || lowPower }) : kind === 'keys' ? createKeys() : kind === 'office' ? createContactOffice() : createDistrict({ compact: compact || lowPower, kind });
    scene.add(architecture.model); view.attach(scene, camera);
    if (kind === 'city') { cityRef.current = architecture; architecture.select(selectionRef.current); }
    const raycaster = new Raycaster(), pointer = new Vector2();
    const lighting = createSceneLighting(scene, architecture.model, renderer, { kind, compact: compact || lowPower, invalidate, prepare });

    let visible = false, frame = 0, dirty = true, lastTime = 0, contextLost = false, elapsed = 0, compiling = 0, shadowTick = 0, lastYaw = 0, lastPitch = 0, disposed = false;
    let currentProgress = reduceMotion && kind !== 'office' ? 0 : progress.get();
    let targetProgress = currentProgress;
    let dragging = null, dragX = 0, dragY = 0;
    const spring = createKeySpring(), orbit = createOrbitSpring();
    const cameraRight = new Vector3(), cameraUp = new Vector3();
    function render(time = 0) {
      frame = 0;
      if (!visible || document.hidden || contextLost || compiling) return;
      if (lastTime && time - lastTime < (compact || lowPower ? 48 : 32)) { frame = requestAnimationFrame(render); return; }
      const delta = Math.min(64, time - (lastTime || time - 16)); lastTime = time;
      const ease = 1 - Math.exp(-delta / 105);
      if (!pausedRef.current) {
        if (!reduceMotion) elapsed += delta / 1000;
        currentProgress += (targetProgress - currentProgress) * ease;
      }
      if (kind === 'office' && (reduceMotion || pausedRef.current)) currentProgress = targetProgress;
      const orbitPose = kind !== 'keys' ? orbit.step(delta / 1000, dragX, dragY, reduceMotion || pausedRef.current) : null;
      const jiggle = kind === 'keys' ? spring.step(delta / 1000, dragX, dragY, reduceMotion || pausedRef.current) : null;
      if (kind === 'house') {
        const pose = scenePose(currentProgress, reduceMotion);
        architecture.model.rotation.y = pose.rotation;
        architecture.model.rotation.x = 0;
        architecture.model.scale.setScalar(pose.scale);
        architecture.upperFloor.position.y = pose.lift;
        architecture.roof.position.y = pose.roofLift;
        architecture.animate(elapsed, reduceMotion);
      } else {
        architecture.model.rotation.set(0, 0, 0);
        architecture.update(currentProgress, reduceMotion, elapsed, jiggle?.angle || 0);

      }
      if (orbitPose) { architecture.model.rotation.y += orbitPose.yaw; architecture.model.rotation.x += orbitPose.pitch; }
      if (kind === 'keys') {
        cameraRight.setFromMatrixColumn(camera.matrixWorld, 0); cameraUp.setFromMatrixColumn(camera.matrixWorld, 1);
        architecture.model.position.addScaledVector(cameraRight, jiggle.x).addScaledVector(cameraUp, jiggle.y);
        architecture.model.rotation.y += jiggle.x * 0.28;
        architecture.model.rotation.z += jiggle.angle * 0.25;
      }
      if (kind === 'city' && camera.zoom !== zoomRef.current) { camera.zoom = zoomRef.current; camera.updateProjectionMatrix(); }
      if (renderer.shadowMap.enabled) {
        const turning = Math.abs(architecture.model.rotation.y - lastYaw) + Math.abs(architecture.model.rotation.x - lastPitch) > 1e-4 || Math.abs(targetProgress - currentProgress) > 1e-3;
        const ambient = !reduceMotion && !pausedRef.current;
        renderer.shadowMap.needsUpdate = !ambient || turning || dragging !== null || shadowTick++ % 2 === 0;
        lastYaw = architecture.model.rotation.y; lastPitch = architecture.model.rotation.x;
      }
      lighting.setTime(elapsed);
      view.render();
      if (host.dataset.ready !== 'true') host.dataset.ready = 'true';
      if (!reduceMotion && !pausedRef.current) frame = requestAnimationFrame(render);
      dirty = false;
    }
    function invalidate() {
      dirty = true;
      if (!frame && visible && !document.hidden && !contextLost) frame = requestAnimationFrame(render);
    }
    // New shader variants (first mount, environment bake, theme lights) compile through
    // KHR_parallel_shader_compile where available; the last frame stays on screen meanwhile.
    function prepare() {
      compiling++;
      compileScene(renderer, scene, camera).then(() => { compiling--; if (disposed) return; renderer.shadowMap.needsUpdate = true; invalidate(); });
    }
    const stopTheme = observeSceneTheme(host, { setNight(night) { lighting.setNight(night); view.setNight(night); } }, prepare);
    invalidateRef.current = invalidate;
    const resize = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      if (kind === 'city') frameCityCamera(camera, width, height, CITY_OVERSCAN);
      else if (kind === 'house') frameSceneCamera(camera, width, height);
      else frameSpatialCamera(camera, width, height, kind);
      view.setSize(width, height, scenePixelRatio(width, height, { devicePixelRatio: window.devicePixelRatio, compact, lowPower, maxTextureSize: renderer.capabilities.maxTextureSize }));
      invalidate();
    });
    resize.observe(host);
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) invalidate();
      else { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
    }, { threshold: 0.01, rootMargin: '180px' });
    visibility.observe(host);
    const unsubscribe = reduceMotion && kind !== 'office' ? () => {} : progress.on('change', value => { targetProgress = value; if (!pausedRef.current || kind === 'office') invalidate(); });
    const onPointerMove = e => {
      if (!dragging) return;
      if (Math.hypot(e.clientX - dragging.pointerX, e.clientY - dragging.pointerY) > 6) dragging.moved = true;
      const dx = (e.clientX - dragging.pointerX) / dragging.width;
      const dy = (e.clientY - dragging.pointerY) / dragging.height;
      if (kind === 'keys') {
        dragX = Math.max(-0.65, Math.min(0.65, dragging.x + dx * (camera.right - camera.left)));
        dragY = Math.max(-0.35, Math.min(0.35, dragging.y - dy * (camera.top - camera.bottom)));
      } else {
        dragX = Math.max(-0.8, Math.min(0.8, dragging.x + dx * 2));
        dragY = Math.max(-0.18, Math.min(0.18, dragging.y + dy * .5));
      }
      invalidate();
    };
    const onPointerLeave = () => {};
    const onPointerDown = e => {
      if (e.button !== 0 || !e.isPrimary) return;
      const bounds = host.getBoundingClientRect();
      dragging = { pointerX: e.clientX, pointerY: e.clientY, x: dragX, y: dragY, width: Math.max(1, bounds.width), height: Math.max(1, bounds.height) };
      host.dataset.input = 'pointer'; host.setPointerCapture(e.pointerId); host.dataset.dragging = 'true'; host.focus({ preventScroll: true });
    };
    const onPointerUp = e => {
      if (kind === 'city' && e.type === 'pointerup' && dragging && !dragging.moved) {
        const bounds=host.getBoundingClientRect();
        pointer.set((e.clientX-bounds.left)/bounds.width*2-1,-(e.clientY-bounds.top)/bounds.height*2+1);
        architecture.model.updateMatrixWorld(true);raycaster.setFromCamera(pointer,camera);
        const hit=raycaster.intersectObjects(architecture.hitAreas,false)[0];
        if(hit) onSelectRef.current?.(hit.object.userData.cityZone);
      }
      dragging = null; delete host.dataset.dragging; invalidate();
    };
    const resetKeys = () => { dragX = 0; dragY = 0; spring.reset(); orbit.reset(); invalidate(); };
    const onBlur = () => { delete host.dataset.input; };
    const onKeyDown = e => {
      host.dataset.input = 'keyboard';
      if (kind === 'city' && ['1','2','3'].includes(e.key)) { e.preventDefault(); onSelectRef.current?.(['society','commercial','plots'][Number(e.key)-1]); return; }
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(e.key)) return;
      e.preventDefault();
      if (e.key === 'Home') resetKeys();
      else {
        const xLimit = kind === 'keys' ? .65 : .8, yLimit = kind === 'keys' ? .35 : .18;
        dragX = Math.max(-xLimit, Math.min(xLimit, dragX + (e.key === 'ArrowRight' ? 0.1 : e.key === 'ArrowLeft' ? -0.1 : 0)));
        dragY = Math.max(-yLimit, Math.min(yLimit, dragY + (e.key === 'ArrowUp' ? 0.05 : e.key === 'ArrowDown' ? -0.05 : 0)));
        invalidate();
      }
    };
    const onVisibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
      else if (visible || dirty) invalidate();
    };
    const onContextLost = e => { e.preventDefault(); contextLost = true; cancelAnimationFrame(frame); frame = 0; host.dataset.ready = 'false'; };
    const onContextRestored = () => { contextLost = false; invalidate(); };
    host.addEventListener('pointermove', onPointerMove, { passive: true });
    host.addEventListener('pointerleave', onPointerLeave);
    host.addEventListener('pointerdown', onPointerDown); host.addEventListener('blur', onBlur);
    host.addEventListener('pointerup', onPointerUp); host.addEventListener('pointercancel', onPointerUp); host.addEventListener('lostpointercapture', onPointerUp);
    host.addEventListener('dblclick', resetKeys); host.addEventListener('keydown', onKeyDown);
    document.addEventListener('visibilitychange', onVisibility);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);
    return () => {
      disposed = true; cancelAnimationFrame(frame); unsubscribe(); resize.disconnect(); visibility.disconnect();
      host.removeEventListener('pointermove', onPointerMove); host.removeEventListener('pointerleave', onPointerLeave);
      host.removeEventListener('pointerdown', onPointerDown); host.removeEventListener('blur', onBlur);
      host.removeEventListener('pointerup', onPointerUp); host.removeEventListener('pointercancel', onPointerUp); host.removeEventListener('lostpointercapture', onPointerUp);
      host.removeEventListener('dblclick', resetKeys); host.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('visibilitychange', onVisibility);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      invalidateRef.current = null; cityRef.current = null;
      stopTheme(); lighting.dispose(); architecture.dispose(); view.dispose(); renderer.domElement.remove(); delete host.dataset.ready;
    };
  }, [progress, reduceMotion, kind]);

  return <div ref={hostRef} className={`${styles.webgl} ${kind === 'city' ? styles.cityCanvas : ''}`} style={kind === 'city' ? { '--city-overscan': CITY_OVERSCAN } : undefined} data-draggable="true" tabIndex={0} role="group"
    aria-label={kind === 'city' ? 'Interactive illustrative city. Drag or use arrow keys to turn. Click a neighbourhood to explore it, or press 1 for societies, 2 for commercial, and 3 for plots. Double-click or Home resets the view.' : kind === 'keys' ? 'Movable house keys. Drag to move and jiggle, or use arrow keys. Double-click or press Home to reset.' : 'Interactive architectural illustration. Drag to turn, or use arrow keys. Double-click or press Home to reset.'} />;
}
