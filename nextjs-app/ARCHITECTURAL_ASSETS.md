# Architectural material sources

Scanned PBR materials and HDR lighting from [Poly Haven](https://polyhaven.com), published under [CC0](https://polyhaven.com/license).

- Brushed Concrete: https://polyhaven.com/a/brushed_concrete
- Wood Floor Deck: https://polyhaven.com/a/wood_floor_deck
- Asphalt 02: https://polyhaven.com/a/asphalt_02
- Grass Ground: https://polyhaven.com/a/grass_ground
- Bark Brown 02: https://polyhaven.com/a/bark_brown_02
- Autumn Field Pure Sky: https://polyhaven.com/a/autumn_field_puresky

`public/textures/pbr/SOURCES.json` records the downloaded files. The preparation script identifies itself to the Poly Haven API. The website serves the resulting files locally and makes no runtime calls to Poly Haven.

Desktop: 1024px colour, 512px normal, 256px roughness maps. Compact devices: 256px maps and a smaller prefiltered studio environment. Desktop outdoor reflections are baked from a 1K HDR once per mounted scene. No frame-by-frame reflection captures. Trees use two instanced meshes each, with 644 leaves on desktop or 308 on compact devices and larger property maps. Offscreen rendering and reduced motion behaviour remain in place.

These scenes are architectural illustrations, not replicas of listed properties. Source/build checks validate geometry, behaviour and resources; they do not verify visual photorealism or GPU frame rates.

## Scene startup and atmosphere

Mounted scenes share decoded texture and HDR assets through reference-counted pools. Each renderer keeps its own GPU reflection target; desktop no longer performs a redundant studio bake before the outdoor bake. Reflection preparation is deferred until after the initial scene frame can render. Later sections prepare 650px ahead of the viewport and begin rendering within 180px; hidden tabs and distant scenes remain paused.

Clouds use an original prebuilt blended surface (1,292 triangles), with soft-edge shading and gentle drift. Regenerate the packed mesh with `node scripts/build-cloud-volume.mjs`; marching-cubes generation never runs in the browser. Tree crowns and instanced grass use bounded rolling gusts and respect reduced motion.

## Realism and rendering cost

`surface-realism.mjs` adds shading to every scene material, with no extra render passes:
- Scanned maps are projected in model space, so concrete, ground, asphalt and timber stay at one physical scale and are no longer stretched across each box.
- Walls darken where they meet the ground, and soffits get less sky light.
- Each window pane gets its own blinds and reflectance. At night some rooms are lit (warm, a few cool) and the rest stay dark.
- Lower leaves inside a tree crown are darker, and grass blades darken toward the root.

The shading uses coordinates relative to the model, so it stays in place while a model is dragged. Distant edges fade slightly into a haze that follows the light/dark theme. The sun is lower, so shadows are longer, and PCF shadow maps now use a penumbra radius. `PCFSoftShadowMap`, which three r186 removed, is replaced.

Draw-call reductions:
- Static meshes are batched into the nearest moving frame, so roofs, storeys, swings, keys and doors still move. City buildings in one batch can each keep their own facade tone.
- All cars in a scene share one instanced draw per part through `vehicle-fleet.mjs`, with real paint colours. City traffic is two-way and keeps left on the ring and cross streets, and more cars are parked at the mall and the terminal.
- The distant city uses 12-triangle boxes instead of rounded ones, because the bevel is smaller than a pixel at that distance.

In the desktop city, draws fell from 305 to about 156, shadow-pass draws from 209 to about 87, and triangles from 185k to 116k. This is with more cars and added facade detail (piers, mullions, rails, AC units, parapets, water tanks). Shadow maps are redrawn while a model turns, and on alternate frames of ambient motion otherwise. New shader variants (first mount, environment bake, theme change) go through `compileAsync`, so they compile in parallel where the browser supports it instead of stalling a frame.

`npm run check:realism` covers shader hooks against the installed three.js sources, model-space stability, fleet draw counts and paint, keep-left traffic on real road corridors, batching of moving parts, facade variety and budgets. These are source checks, not measurements of rendered appearance or frame rate.
