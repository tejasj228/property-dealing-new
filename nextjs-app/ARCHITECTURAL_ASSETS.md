# Architectural material sources

Scanned PBR materials and HDR lighting from [Poly Haven](https://polyhaven.com), published under [CC0](https://polyhaven.com/license).

- Brushed Concrete: https://polyhaven.com/a/brushed_concrete
- Wood Floor Deck: https://polyhaven.com/a/wood_floor_deck
- Asphalt 02: https://polyhaven.com/a/asphalt_02
- Grass Ground: https://polyhaven.com/a/grass_ground
- Bark Brown 02: https://polyhaven.com/a/bark_brown_02
- Autumn Field Pure Sky: https://polyhaven.com/a/autumn_field_puresky
- Moonless Golf (night sky): https://polyhaven.com/a/moonless_golf

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

## HDR rendering and living scenes

`scene-renderer.mjs` renders capable desktops in linear HDR. It draws into a multisampled half-float target, adds half-resolution GTAO ambient occlusion, applies bloom at night only (lit windows, street lamps, head- and taillights, runway and aviation lights), and tone maps once. Compact and low-power devices draw directly, with the same materials and no post passes.

Both skies are real CC0 HDRIs: the autumn sky by day, and the moonless night sky, fetched only when the dark theme is shown. Each is resampled to a 512x256 RLE Radiance file with `node scripts/resample-hdr.mjs in.hdr out.hdr 512`. The two files total about 700 KB, down from 1.09 MB for the old day sky alone. Matching sizes keep theme changes free of shader recompiles.

Shading:
- Glazing is drawn as framed panes. By day it is a tinted mirror for the sky, with curtains and blinds in some panes. At night some rooms are lit, and which rooms are lit changes every few minutes.
- Lawns get wet and dry patches.
- Water ripples.
- Cloud shadows drift across the ground by day.
- Forest leaves sway on the GPU.

Models:
- Vehicles have extruded bodies with tinted glass, rims, grilles and lights: hatchbacks, sedans, SUVs, Delhi CNG autos and city buses. Each vehicle type is one instanced fleet.
- Street trees use species palettes: neem and ficus greens, dark ashoka, and flowering amaltas and gulmohar.
- The society blocks have terracotta fins, glass balconies with planters, AC units, a lift room and solar panels.
- The hero city has:
  - a high-rise society;
  - avenue and compound planting merged into two draws;
  - a construction site with a slewing tower crane and a blinking aviation beacon;
  - 52 instanced pedestrians;
  - mixed two-way traffic;
  - apron vehicles;
  - wingtip, strobe, taxiway and sequenced approach lights.
- The open-land scene has an excavator on a dig-lift-dump cycle.

All motion follows the scene clock, so reduced motion and paused scenes stay static. The desktop city now has 169 draws (originally 305) and about 105k triangles (originally 185k), with 87 trees instead of 18. Visual checks used a headless-browser render harness outside the repository; frame rates on real devices are not measured.
