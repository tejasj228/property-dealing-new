# Landing page direction

Scope: the main Next.js public website, including landing, listings, society directory, property detail, contact and not-found pages. Route addresses, authentication and write APIs are preserved. Shared navigation, footer, typography and theme are consistent throughout.

## Audit and decisions

The old homepage uses a full-screen background video, gold accents, light Gilmer typography, repeated reveal cards, and a long map-card grid. Global CSS transitions every element; the shared header mounts scroll listeners and makes repeated area requests. These are unsuitable foundations for the requested fluid 3D presentation.

The brand name remains Pawan Buildhome. Existing `/properties`, `/property/:id`, `/societies/:areaKey/:subAreaId`, `/contact` routes and the `#areas` anchor remain. Existing page metadata and contact details remain authoritative.

Design read: a modern architectural showcase for NCR property buyers. Full visual overhaul of the landing page, with real content preserved. DESIGN_VARIANCE 8, MOTION_INTENSITY 7, VISUAL_DENSITY 3. Native CSS modules, no additional design system or CSS framework.

Palette: Porcelain #f4f7f5, Chalk #e8eeea, Forest #285c4d, Ink #203e34, Slate #5c6e65, Pale Green #d4dfd4. A coordinated dark scheme uses the same forest accent. Manrope variable is the main face; Gilmer remains available for architectural captions. The wordmark remains text, not a fabricated logo.

Shape scale: 8px controls, 16px framed visuals, fully rounded primary/secondary buttons. Shadows are subdued green-gray. UI layers: content 0, hero composition 1, navigation 20, expanded mobile navigation 21. There is no modal or cursor layer.

## Composition

1. Asymmetric hero: concise headline on the left, a bespoke 3D architectural model on the right. A natural-flow hero lets the model rotate and gently separate its upper floor to reveal the relationship between plot, home and setting. This is explicitly an illustrative study, not a real listing.
2. Area explorer: real API-driven areas and subareas. Selectable locations show their actual map/gallery and link to the existing society route. Search and filtering use actual records; all subareas remain reachable.
3. Property map: every active property appears as a colour-coded, keyboard-accessible link above an illustrative 3D parcel on a winding road. Residential is green; commercial is warm ochre. The view supports mouse rotation, touch scrolling, zoom/rotate/reset controls and a View all properties link. Positions are explicitly illustrative because the data model has no coordinates. Empty/error states remain honest.
4. Guidance and contact: compact property-buying journey and existing contact routes. No invented metrics, sales figures, testimonials, or airport-distance claims.

## Scroll experience beyond the hero

The approved hero house is enlarged and detailed with balcony railings, rooftop solar panels, terrace seating, planters, water shimmer and animated landscaping. The hero car and resident have been removed at the user’s request. The rest of the landing page now carries the same spatial language:

- The real area map sits on layered survey sheets that lift in perspective on entry and settle flat for reading.
- Three separate property-world sections each retain their own original 3D environment: surveyed open land, a residential society and a commercial plaza. The residential view includes apartment buildings, a shared park, trees, a play structure, benches, cars and residents. The commercial view has glazed offices, retail awnings, plaza seating, cars and pedestrians. Cars follow continuous paths, pedestrians move and articulate their limbs, trees and instanced grass sway, clouds drift while the scene is visible. Birds are removed from every scene. The society swing also moves. These scenes are explicitly conceptual and do not describe the amenities of an actual listing.
- The listing grid is replaced with an interactive miniature map. All titles, prices, measurements, locations and destinations come from real records. Rows and map dimensions expand automatically as the inventory grows; no placement data is stored or hand-maintained.
- A much larger, gently swinging, mouse-draggable 3D house-key ring occupies its own full-height column beside the aligned guidance introduction and accordion. It leads the section on mobile.

The extra scenes mount only near the viewport, share the existing lazy-loaded Three.js renderer code and pause when off-screen. Reduced motion renders static illustrations and ordinary document flow. No wheel interception or scroll-driven React state is used. The same scene pause control and resource cleanup apply to each WebGL instance. Each property section allocates only its own model and follows its own scroll progress, without switching environments. Desktop alternates text and scene placement; mobile stacks each heading above its scene in ordinary document flow.

## Motion and performance

Three.js is isolated in a dynamically imported client leaf. Motion tracks native scroll without scroll-driven React state or wheel interception. The libraries own different elements: Three.js owns only its canvas; Motion owns text and HTML transforms. They do not animate the same object. The models have no network assets or large textures, use shared/instanced geometry and capped pixel density, and stop rendering when outside the viewport or the document is hidden. Ambient animation advances only while visible and unpaused; mobile rendering is capped near 30 fps and the map near 45 fps on desktop. These are scheduling caps, not measured performance. GPU resources, observers and event listeners are disposed on unmount. Reduced motion renders a static model; unavailable WebGL retains a CSS architectural fallback. Mobile receives a shorter natural layout and less geometry/shadow work.

## Data and validation

The page's server loader reads `LANDING_CONTENT_API_URL` when configured, otherwise the existing MongoDB models. The local setting points to the deployed site's public read API while direct Atlas access remains unresolved. This is not fixture data and does not modify existing API behavior. Initial fetches run concurrently with bounded timeouts. The uncached GET /api/landing-properties endpoint refreshes the active inventory on mount, every 60 seconds while visible, and on returning to the tab. Admin additions, edits, deactivations and removals are reflected without rebuilding. Failed refreshes retain the last successful snapshot. No secrets or source settings are passed to browser components. Live deployment must use the same database as its admin; the optional public-feed override remains for this local environment.

User explicitly requested source and build validation only. Do not open a browser, run browser-based tests, screenshots or Lighthouse. Report that visual appearance and frame-rate measurements remain unverified. Source checks cover route preservation, cleanup, media-query fallbacks, content, data error handling, and production compilation; read-only HTTP checks can confirm the served output.

## Completed verification

- Production compilation passed with five-minute homepage revalidation.
- Sixteen focused source-level tests pass. Added checks cover all-scene night/day material restoration, night-sky framing, key drag bounds and frame reset, map planting/removal of people, and the public-content path allowlist. Existing checks cover: ambient movement and reduced-motion determinism, automatic map placement/spacing for 1–35 listings, fresh-feed additions/removals and uncapped inventory, plus independent scene identity and static reduced motion, camera framing and resource disposal for the new environments, the original house motion/framing/disposal checks, partial data-source failure, and complete data-source failure. Scene geometry is checked at five aspect ratios, multiple scroll positions and animation timestamps for the additional scenes; this does not establish rendered appearance or frame rate.
- Read-only HTTP checks returned 200 for the homepage, properties page and contact page. The homepage contains its single H1/main element, real published listings and area content. Unauthenticated protected reads still returned 401.
- All 14 referenced local static assets and the separately loaded 3D library chunk returned 200. The initial scripts exclude the Three.js renderer. The two initially displayed real images returned 200 with size-limited Cloudinary transformations.
- Light/dark text and CTA color pairs pass a source-calculated 4.5:1 contrast minimum. All CSS module class references resolve.
- Private credential values are absent from generated browser JavaScript. No database writes, uploads, commits, pushes, or deployments were performed.
- The finished production build is running on `http://localhost:3100`. Browser rendering, interaction behavior, actual accessibility-tree output, Core Web Vitals and GPU/frame-rate performance remain unverified, as requested.

## Site-wide follow-through

The public pages share Manrope typography, porcelain/forest colours, navigation and footer. The property collection has URL-driven location/type filters (including Back/Forward), manual galleries, clear empty/error states and actual listing details. Society pages use a readable map panel, a photographic directory and a native modal dialog with keyboard focus containment. Fabricated community/map fallbacks are removed. Property detail gains a large contain-fit gallery, a compact facts layout and a sticky enquiry column. Contact uses an asymmetric office/form layout with actual area choices; submission stays on the original database-backed endpoint.

Every WebGL scene observes the same light/dark theme. Daylight restores original materials and clouds; night uses cool ambient light, retained clouds and warm window/lamp emission. Paused and reduced-motion scenes still react to theme changes. Keys support pointer dragging, arrow keys and double-click/Home reset; translation is bounded and reset per frame. Map residents are removed and small extra tree/instanced-grass clusters stay near the board edges. Other society/commercial residents remain.

The optional public source now also serves read-only catalogue requests through an allowlisted `/api/public-content` route. Without the setting it redirects to the existing same-origin database routes. The proxy cannot address auth, contact management or writes. Actual local public-feed checks returned two properties, a matching detail record, filtered commercial records, areas and society data. All public page addresses returned 200 and an unknown address returned 404; protected reads remained 401. These HTTP/build checks do not verify browser rendering or interaction.

## Scroll and interaction refinement

Removed the moon/stars and kept drifting clouds in both themes. Streetlamp and car-headlight fixtures now include night-only warm pools on the road. Car windscreens and rooftop solar panels have separate non-emissive materials. Keys use a time-step-stable damped spring with translation inertia and counter-swinging key blades; reduced motion remains direct manipulation.

Removed hero pinning and vertical text/map parallax, disabled automatic scroll anchoring on this animated page, and gave the hero canvas an explicit stable height. Ordinary wheel/touch scrolling is native with no smooth-scroll controller. Sibling mesh batching preserves animated parent groups while reducing individual draw submissions (37 house, 55 land, 113 society, 117 commercial in the current desktop models). Shadows are cached between invalidations, offscreen rendering pauses at the viewport, pixel density is capped at 1.35 desktop / 1 mobile, and map label positions are recomputed only on viewport/camera changes. These are source-level workload improvements, not measured frame-rate claims.

Eighteen regression checks cover physics convergence at 30/60/120 Hz, drag bounds, clouds, night fixtures, batching, material restoration, geometry framing, disposal, map placement and real-data error handling. Browser visual and scroll-feel verification remains excluded by user preference.

## Brand, administration and deployment performance

The document scrollbar follows the actual light/dark website colours, including the root viewport. A matching forest house mark is supplied as SVG, multi-size ICO and Apple icon for the public site and admin. The admin keeps its existing MUI components, auth/API contracts and editing workflows, with a shared Manrope/forest theme, fixed responsive sidebar, clear page labels, a refreshed sign-in, a real-data overview, searchable/filterable property cards and reduced visual noise in forms and dialogs. Legacy Grid usage is bridged to GridLegacy for the installed MUI 7 version. Property reordering is disabled while filters are active to protect complete inventory order. Enquiry search is debounced and aborts superseded requests; statistics no longer refetch per search keystroke. Admin routes are split into separately loaded chunks. No 3D library is added to the admin.

House, land, society and commercial models all support pointer and keyboard orbit with bounded damped settling, in addition to the key-ring physics and existing map controls. Gesture listeners do not intercept wheel events. Viewport/camera framing tests include maximum grab angles at desktop and mobile ratios.

Public image previews now request automatic Cloudinary format/quality and bounded widths; full-size document/image links retain the originals. Canvas resolution is bounded to 1.4 million pixels (700,000 on compact or low-powered devices) and the GPU texture dimension limit, including maps with growing inventories. Low-memory, low-core-count and data-saving devices use lighter geometry and fewer shadows. Existing on-demand loading, batching, offscreen pauses and resource disposal remain. Continuous ScrollToTop polling is removed. All public content still comes from actual API records.

Validation: 22 scene/data/image/budget checks, 2 focused admin sign-in/partial-data checks, a client undefined-variable scan and both production builds. Browser rendering, real device frame rates and production/backend latency remain unmeasured under the source/build-only instruction. Admin database-backed reads/writes require the existing Atlas access issue to be resolved; no data writes were used for validation.

## Release follow-through

Pointer grabbing suppresses the canvas-sized focus outline while keyboard focus remains visible. Shadow maps now update with rendered geometry instead of using a stale pre-drag view; compact/low-power scenes still omit dynamic shadows. The actual area reference card has layered depth and pointer/keyboard tilt using Motion springs, with no extra WebGL context or scroll interception. The production release also guards every property/area/society/upload mutation with the existing admin JWT/role policy and disables default admin credentials.

## Local review draft — 16 October 2026

The user approved these refinements for publication after local checks:

- The public accent follows the forest/sage palette, including legacy property-contact buttons. Links and interactive text change colour on hover.
- A small pointer dot, fine ring and short trail appear on mouse devices. Animation runs outside React, sleeps when settled or hidden, and yields to native text controls. Touch and reduced-motion users retain the normal cursor. The same treatment is included in admin.
- Admin now uses a single dark forest palette across navigation, forms, tables, cards, uploads and dialogs. Existing authentication and data operations remain intact.
- The listing map uses fixed 640px desktop / 520px mobile stages. Its camera fits the growing world rather than increasing the frame or introducing horizontal page scrolling. Numbered colour-coded links identify every property, with a fixed-height detail strip for the hovered/focused listing and the existing full-catalogue link below.
- Parcel shapes, scale, slight rotation, roads and planting vary deterministically. Existing IDs keep their individual appearance across text edits and refreshes. All listings still come from the published API; the scenery is illustrative.
- Area reference images explicitly disable native dragging; a capture on the surrounding interactive card cancels browser drag ghosts while retaining tilt and keyboard controls.

Validation uses source checks, both production builds and regression checks only. Camera tests cover 0–250 listings at fixed mobile and desktop sizes, all parcel/scenery geometry stays in frame, and allocated resources are disposed exactly once. Browser layout and pointer/scroll feel remain unverified by user preference.

Map markers now carry small property-title labels. The mouse cursor uses a larger dot/ring with white difference blending to invert the surface below it; draggable 3D surfaces hide that overlay and restore the native grab/grabbing cursor. Links on the map remain clickable and retain link feedback. Both public and admin cursor components share this behaviour.

The map also mixes open parcels, residential buildings with balconies/solar roofs, and commercial shopfronts with canopies and roof plant. Explicit land/plot titles keep open residential parcels, commercial listings receive a representative commercial illustration, and other residential forms vary by stable ID. A small unmarked residential corner is scenery only, so it adds no fictitious listings or links. Marker heights clear roofs; windows and signs follow the shared day/night lighting. Models are explicitly illustrative. The 23 scene/data checks include mixed structures and framing through 250 listings; two management guard checks and two admin checks also pass.
