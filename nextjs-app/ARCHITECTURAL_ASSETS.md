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
