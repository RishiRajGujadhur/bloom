# Bloom performance work

All 83 routes share the delivery, build and application-shell safeguards below. These are implemented once in shared code, rather than copied into 83 pages. Conditional safeguards activate when their feature is used. The checklist contains more than 50 implemented safeguards per route through that shared shell; it does **not** claim 50 separate edits to every page, or that every item in the supplied list applies to every page.

## Measurements and reproduction

- `performance-baseline.json`: original production static entry graph.
- `performance-build.json`: final production static entry graph, including shared imports and CSS, with raw and compressed bytes and enforced budgets.
- `performance-pages.json`: desktop and mobile snapshots for every route, all features enabled. Fresh document per route with a shared warm browser HTTP cache; service workers disabled to isolate network delivery. These are lab observations, not field Core Web Vitals or Lighthouse scores.
- `npm run build`, `npm run perf:build`, `npm run perf:pages`, `npm run perf:offline`, `npm run test:server` reproduce the checks. Page audit accepts `--pages=overview,habits` and `--output=test-results/perf-subset.json`.

The production server improvements apply to `node server.mjs` (also used by the desktop launcher). Another host must supply equivalent compression and cache headers. No CDN subscription, hosting upgrade, HTTP/2 or HTTP/3 deployment, redirect configuration or server-side database cache was provisioned.

## Shared implementation checklist

Each numbered item is a concrete safeguard, with its owning source. Entries marked **preserved** document existing behavior, not new work. Everything else was introduced or improved in this performance series.

| ID | Safeguard | Implementation |
|---|---|---|
| 1 | Brotli delivery for compressible responses | `server.mjs` |
| 2 | Gzip fallback | `server.mjs` |
| 3 | Respect encoding quality values and disabled encodings | `acceptedEncoding` |
| 4 | Vary compressed responses by Accept-Encoding | `server.mjs` |
| 5 | Avoid recompressing already-compressed media | MIME eligibility |
| 6 | Skip compression overhead for tiny responses | 1 KiB threshold |
| 7 | Bound Brotli CPU cost | quality 4 |
| 8 | Stream files rather than reading entire responses into memory | `createReadStream` |
| 9 | Honor stream backpressure | `pipeline` |
| 10 | Terminate streaming work after disconnection or failure | pipeline/error handling |
| 11 | Validate unchanged resources with ETags | conditional responses |
| 12 | Support Last-Modified validation | conditional responses |
| 13 | Avoid body reads for HEAD requests | header-only path |
| 14 | Cache content-hashed assets for a year with immutable | hashed asset policy |
| 15 | Revalidate the HTML shell so deployments are discoverable | no-cache HTML |
| 16 | Support byte-range media reads | partial responses |
| 17 | Support suffix ranges and reject unsatisfiable ranges | range parser |
| 18 | Serve explicit media/font MIME types | MIME map |
| 19 | Send CSS preload and JS modulepreload in HTTP 103 | startup HTML resource hints |
| 20 | Send final Link hints for clients without Early Hints support | resource hint headers |
| 21 | Minify build HTML comments and inter-tag whitespace | `vite.config.ts` |
| 22 | Inline essential shell geometry before stylesheet loading | `index.html` |
| 23 | Keep larger resources outside JS/CSS data URLs for independent caching | 1 KiB assetsInlineLimit |
| 24 | Precache the complete static import graph for offline shell reloads | Vite manifest traversal |
| 25 | Keep optional page/AI bundles out of installation downloads | selective precache |
| 26 | Cache lazy asset responses after first use | runtime CacheFirst |
| 27 | Scope local asset caches to the same origin | URL predicates |
| 28 | Cache successful responses only | status 200 policy |
| 29 | Expire runtime asset caches | 30-day TTL |
| 30 | Bound runtime asset entry count | 200-entry limit |
| 31 | Recover from quota pressure | purgeOnQuotaError |
| 32 | Clean obsolete precaches after upgrades | cleanupOutdatedCaches |
| 33 | Cache audio only after use, with size/age bounds | separate 40-entry audio cache |
| 34 | Replay cached audio ranges correctly | Workbox rangeRequests |
| 35 | Split formerly eager pages into route chunks | `App.tsx` |
| 36 | Keep settings data independent of the Settings UI bundle | `settings/appSettings.ts` |
| 37 | Keep navigation history/events independent of search UI | `navigationHistory.ts` |
| 38 | Mount and import the command palette only when opened | `App.tsx` |
| 39 | Remove hidden Habits page mounting and subscriptions | active-route rendering |
| 40 | Remove hidden Daybook rendering and editor work | active-route rendering |
| 41 | Split optional font CSS by typography group | `styles/fonts`, `fontLoader.ts` |
| 42 | Deduplicate pending font loads and resource hints | Promise/Set registries |
| 43 | Preload only the selected theme's above-fold font faces | `fontLoader.ts` |
| 44 | **Preserved:** locally hosted WOFF2 fonts | Fontsource build assets |
| 45 | **Preserved:** font-display swap | Fontsource declarations |
| 46 | **Preserved:** unicode-range font subsets | Fontsource declarations |
| 47 | Make unused icon factory calls tree-shakeable | PURE annotations in `lucidePixel.ts` |
| 48 | Share one theme MutationObserver across subscribers | `MatrixRain.tsx` |
| 49 | Share one icon-mode event subscription | `pixelated.tsx` |
| 50 | Disconnect shared observers/listeners after the final subscriber | subscription cleanup |
| 51 | Do not mount hidden alternate-theme SVG trees | `GalaxyGlyph.tsx` |
| 52 | Schedule noncritical Houdini setup during idle time | `idleTask.ts`, `App.tsx` |
| 53 | Avoid ambient audio preload before Play | `AudioMixerContext.tsx` |
| 54 | Load only tracks with an audible target volume | mixer synchronization |
| 55 | Coalesce pointer updates to one animation frame | `frameThrottle.ts`, `cardGlow.ts` |
| 56 | Process the most recent event rather than stale events | frameThrottle |
| 57 | Batch geometry reads before style writes | cardGlow |
| 58 | Bound card geometry measurement work | first 14 candidates |
| 59 | Remove the continuously repainting idle gradient tween | cardGlow |
| 60 | Skip hover effects on coarse pointers | cardGlow |
| 61 | Respect reduced motion in expensive shared effects | cardGlow/Houdini/Lottie |
| 62 | Stop or avoid shared visual work in hidden documents | cardGlow/Lottie |
| 63 | Cancel pending frames and remove event listeners on teardown | frameThrottle/effect cleanup |
| 64 | Animate heading decoration with transform and opacity | cardGlow |
| 65 | Coalesce repeated navigation measurements | cardGlow navigation scheduling |
| 66 | Memoize dashboard totals and weekly aggregates | `App.tsx` |
| 67 | Count with reductions instead of allocating intermediate filtered lists | `App.tsx` |
| 68 | Stabilize the settings updater identity | useCallback in appSettings |
| 69 | Skip unchanged settings state | appSettings identity check |
| 70 | Update the shared local date at midnight instead of polling | `useToday.ts` |
| 71 | Schedule focus completion at its deadline instead of a one-second poll | `useFocusLifecycle.ts` |
| 72 | Skip identical serialized storage writes and cross-tab echoes | `useCoach.ts` |
| 73 | Reserve route-loading space and keep the heading outside Suspense | `performance.css`, `App.tsx` |
| 74 | Load decorative Lottie players on intent with immediate SVG fallbacks | `LottieIcon.tsx` |
| 75 | **Preserved/explicitly configured:** minified JS/CSS, route CSS splitting, no production source maps | Vite build settings |
| 76 | **Preserved/verified:** module script delivery and modulepreload graph | production HTML |
| 77 | **Preserved/verified:** no sequential runtime CSS @import in startup styles | build budget script |

Items 1–43 and 47–74 are the shared delivery/shell changes applicable to every route (71 safeguards). The shell contains conditional controls such as audio, fonts and search; an inactive control performs no work. This count is an implementation checklist, not a claim that all controls execute on every visit.

## Additional feature-specific improvements

- Responsive WebP hero (480/760-pixel sources), explicit dimensions, asynchronous decoding and high fetch priority. High priority is limited to the actual hero; icons and offscreen images are not indiscriminately preloaded.
- Explicit dimensions, lazy loading and asynchronous decoding on journal, focus, sidebar and achievement media.
- Studio and linked-page scroll rails coalesce reads once per frame, skip unchanged state and cancel pending callbacks on teardown.
- Exercise library renders at most 12 illustrated cards, with paging and full-library search. Filtering resets the window automatically. Similar-movement and Settings controls remain candidates for further DOM reductions.
- Closed lower-page details/footer sections opt into content visibility with intrinsic size, without containing open popovers.
- Model-download cache has independent entry, age and quota bounds.
- Build budgets reject oversized startup JS/CSS, runtime CSS imports and eager heavy optional dependencies.

## Limits of the supplied 50-item list

No artificial GIF conversion, iframe lazy-loading, worker, virtual scroller, database cache or third-party preconnect was added where no corresponding workload exists. Existing CSS gradients and SVG icons remain in place. A generic SVG minifier was not run over interactive/animated SVGs because IDs, geometry and selectors carry behavior. DOM size is measured per route and is not claimed to be below 1,500 universally. Real user data can increase list sizes beyond the empty-data lab snapshots.

Hosting changes require the selected deployment platform. HTTP 103 works on the supplied server; forwarding by a proxy/CDN must be checked in that environment. Brotli, HTTP cache and offline tests exercise the local production server, not a public production deployment.
