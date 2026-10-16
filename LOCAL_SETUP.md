# Local setup and project map

## Landing page redesign

The `/` route now uses a separate architectural landing page with a custom Three.js model, native scroll motion, area search, API-backed property cards and dedicated navigation/footer. Other routes retain their original interfaces and APIs. Design decisions are recorded in `LANDING_DESIGN.md`.

While direct Atlas access remains unresolved, the ignored local `nextjs-app/.env.local` has `LANDING_CONTENT_API_URL=https://www.pawanbuildhome.com/api`. The homepage reads that public API with five-minute revalidation and a live inventory refresh. Public listing, property-detail, society and contact-area reads also use that source through the read-only `/api/public-content` adapter. This uses current published content, not archive snapshots or fixture listings. Remove that optional setting to use the existing MongoDB models and same-origin read routes for public content once database access is available. Existing `/api/*` routes continue to use the configured Atlas database.

Run `npm.cmd --prefix nextjs-app run check:landing` for source-level motion, geometry, resource-cleanup and data-failure checks. The local production build is started with the commands below. Browser-based checks and frame-rate measurements were explicitly declined; do not treat a passing build as visual or GPU validation.

Prepared on 16 October 2026 from main commit `32c0b641`.

`nextjs-app/` is the main application. It contains both the public website and its backend API. Running the old Express backend or React frontend is unnecessary for this application. The other directories remain in the clone as reference.

## Start locally

The production build is prepared. From the repository folder:

```powershell
npm.cmd --prefix nextjs-app run start:local
```

Alternatively, double-click `start-local.cmd`. The website is at http://localhost:3100 and its API is at http://localhost:3100/api. Port 3100 avoids the existing applications on this PC. The local scripts bind to this PC's loopback interface.

For development with automatic reload:

```powershell
npm.cmd --prefix nextjs-app run dev:local
```

Use one mode at a time. Stop the running server before switching modes. Stop a foreground server with Ctrl+C. This setup session also started a background production server; its process ID is recorded in the ignored `.local/runtime.json` file. To stop that server from the repository folder:

```powershell
$localRuntime = Get-Content .local/runtime.json | ConvertFrom-Json
$localServer = Get-CimInstance Win32_Process -Filter "ProcessId=$($localRuntime.pid)"
if ($localServer.CommandLine -like '*node_modules/next/dist/bin/next*start*3100*') {
    Stop-Process -Id $localRuntime.pid
}
```

Rebuild after source changes when using production mode:

```powershell
npm.cmd --prefix nextjs-app run build
```

Dependencies were installed using the committed lockfile and Node.js 24.17.0. To reinstall on this PC:

```powershell
npm.cmd --prefix nextjs-app ci
```

## Environment and live services

Actual values are stored in ignored `nextjs-app/.env.local`. `.env.example` documents the required names without credentials. MongoDB, JWT, admin authentication, and Cloudinary use the supplied values. Existing Gmail settings found in the repository were retained locally; email sending has not been tested.

The MongoDB URI points to the supplied Atlas `real-estate` database. The password's dollar sign is percent-encoded as `%24`, which also avoids Next.js environment-variable expansion. No local database or mock API was substituted. `next start` runs with `NODE_ENV=production`; `next dev` manages its own development environment.

`MONGODB_AUTO_INDEX=false` and `MONGODB_AUTO_CREATE=false` prevent startup from creating indexes or collections in the existing database. Normal application write endpoints still target the real database. No seeds, migrations, contact submissions, uploads, or data mutations were executed during setup.

Read-only connectivity check:

```powershell
npm.cmd --prefix nextjs-app run check:connections
```

### MongoDB access pending

DNS resolves all three Atlas nodes, but connections to port 27017 currently time out. This PC's observed public IP was `220.156.184.9`. Add `220.156.184.9/32` to the correct Atlas project's database IP access list, wait for Active, then rerun the check. If it still times out, check outbound network access to port 27017. The timeout does not establish whether the database password is valid. Public IPs can change.

## How the main application works

| Layer | Location | Responsibility |
|---|---|---|
| App shell | `nextjs-app/app/layout.js` | Shared header, footer, styles, analytics |
| Public pages | `nextjs-app/app/` | Home, properties, property detail, area listings, societies, contact |
| UI | `nextjs-app/components/` | Search/filter controls, cards, galleries, dialogs, contact form |
| Client API | `nextjs-app/services/api.js` | Axios calls to same-origin `/api`; no separate backend URL required |
| Area state | `nextjs-app/hooks/useAreas.js` | Fetching, localStorage cache, fallback handling |
| Database | `nextjs-app/lib/db.js` | Cached Mongoose connection across reloads and requests |
| Data models | `nextjs-app/lib/models/` | Properties, areas with embedded subareas/societies, contacts, slider images |
| API | `nextjs-app/app/api/` | Queries, contact submission, authentication, management operations, media |
| Authentication | `nextjs-app/lib/auth.js`, `app/api/auth/` | Environment-backed admin login and 24-hour JWTs |
| Images | `nextjs-app/lib/cloudinary.js` | Upload streams to Cloudinary's `pawan-buildhome` folder |
| Email | `nextjs-app/lib/email.js` | Gmail notifications after contact persistence |
| Static media/data | `nextjs-app/public/`, `data/` | Images/video, map assets, static copy and existing fallback data |

Data path: page component -> same-origin `/api` route -> `connectDB()` -> Mongoose model -> the Atlas database. Image uploads go to Cloudinary and their URLs are saved in MongoDB. Contact submission saves a contact before attempting its email notification.

The API includes properties (list/detail/filter/reorder), areas (including subarea ordering), society galleries/maps/featured images, slider and general uploads, contact management/statistics, auth login/verify/me/logout, and health. The separate `admin-panel/` UI is outside the main Next.js app; Next.js provides its API endpoints but contains no admin dashboard page.

## Verification

- Next.js production build passed.
- Local HTTP checks returned 200 for `/`, `/properties`, and `/contact`.
- Admin login with the supplied credentials and JWT verification both returned 200.
- Unauthenticated `/api/auth/me` and `/api/contacts` returned 401.
- Cloudinary authenticated read-only ping passed after screenshot transcription was corrected.
- Supplied private values were absent from the generated browser JavaScript bundles.
- MongoDB remains blocked by connection timeouts; database-backed API results are not yet verified.
- No browser session was opened; visual layout and browser interactions remain unverified.

## Existing findings from the source review

These are observations, not fixes included in local setup:

- Unused legacy components contain static fallback content; the redesigned public pages use real published records and honest empty/error states. A rendered page therefore does not prove that MongoDB is connected; use the connectivity check or `/api/health`.
- Property, area, society management, and upload mutation routes do not consistently call authentication middleware. Contact management is token-protected. This matters because management requests use the real database.
- Both `next.config.js` and `next.config.mjs` exist. The verified production build uses `next.config.js`, including the external Mongoose setting.
- The root README describes the older three-app arrangement, which differs from the main Next.js setup described here.
- `backend/.env` was already tracked in the cloned repository. It has been removed from current Git tracking and remains ignored locally. Repository history has not been rewritten or pushed.

The legacy applications' dependencies and builds were checked before the main-app clarification. Their initial code changes were reverted. The admin panel was subsequently redesigned at the user’s explicit request; the separate legacy frontend and backend remain unused. No commit, push, or deployment was performed.


### Automatic landing map updates

The map reads every active property, with no four-listing cap. It places parcels automatically and expands its rows as records are added. `/api/landing-properties` provides an uncached read-only feed; the visible homepage refreshes on mount, every 60 seconds, and when the tab becomes visible again. Failed reads retain the last successful map. No admin changes or manual positions are required. In deployment, use the same MongoDB database as the admin and omit the local `LANDING_CONTENT_API_URL` override unless intentionally reading another published source. Positions are illustrative, not coordinates.

### Current UI validation

All sixteen scene/data regression checks and production compilation pass. HTTP checks confirm the public routes and real read-only content (properties, filters, detail, areas and societies). The local server runs the latest production build on port 3100. No browser testing was performed, in keeping with the user’s source/build-only instruction. Contact submissions and admin writes still require Atlas access and were not exercised.

### Refreshed admin panel

The separate `admin-panel/` is now intentionally included in the UI work. Use `npm.cmd run build --prefix admin-panel`, then `npm.cmd run preview:local --prefix admin-panel` for the compiled admin at `http://localhost:3101`. The ignored local `.env.local` points `REACT_APP_API_URL` to `http://127.0.0.1:3100/api` and `REACT_APP_WEBSITE_URL` to `http://localhost:3100`. Production builds must receive the deployed main app’s API and website URLs through their deployment environment. The admin is a static React app; the main Next.js app still owns authentication, CRUD, uploads and database connectivity. The admin never uses the optional public-content adapter for management operations.

The refreshed admin includes the website palette and font, matching favicon, a responsive sidebar, overview, property filters, forms and galleries. Pages load on demand; enquiry searches are debounced and superseded reads are cancelled. The overview marks unavailable statistics instead of presenting connection failure as zero. Original edit/upload/reorder and authenticated session contracts are retained. API mutation flows were not exercised against production data.

The current public regression suite contains 22 checks, with 2 additional mocked admin checks. Both production builds and the public-client undefined-variable scan pass. Canvas pixel budgets, lighter device settings and Cloudinary preview resizing reduce client work, but are not an assurance of a particular deployed frame rate. Browser/GPU performance validation remains unperformed.
