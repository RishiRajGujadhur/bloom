# Bloom quality checklist

This checklist was compiled from web.dev's "What makes a good Progressive Web App?", web-app testing checklists (Global App Testing, Testsigma, Testomat) and web-app UX guides. Each row says where Bloom meets the quality, and which rows are new in this round.

| # | Quality | How Bloom meets it | New in this round |
|---|---|---|---|
| 1 | **Fast first load** | Every page is lazy-loaded. Heavy data (word lists, pronouncing dictionary, AI models, writing analysis, Remotion) loads only when used. | Chat commands and writing analysis split out |
| 2 | **Works offline** | A service worker (vite-plugin-pwa / Workbox) precaches the app shell and caches each page chunk and audio file on first use. | ✅ |
| 3 | **Installable** | Web app manifest (name, icon, theme colour, standalone display), plus **Settings → Install Bloom**. | ✅ |
| 4 | **Responsive** | Layouts adapt from phone to desktop, with a hamburger nav and fluid grids. | |
| 5 | **Keyboard accessible** | Skip link, arrow keys between tabs, Enter/Space on custom buttons, one visible focus ring. | |
| 6 | **Screen-reader friendly** | Labelled controls and live regions for status messages. An axe-core scan of 6 pages found no serious issues left after the fix. | Growth-rewards live region fixed |
| 7 | **Readable contrast** | axe-core colour-contrast scan passes. Matrix theme buttons use dark ink. | |
| 8 | **Respects reduced motion** | Every GSAP/SVG layer (avatars, fun layer, card glow, scenes) is off under `prefers-reduced-motion`. | |
| 9 | **Private by default** | Local-first: data lives in this browser and nothing is uploaded. | |
| 10 | **You own your data** | Export and backup, and **Clear my data** (type DELETE) wipes storage, IndexedDB and caches. | Clear my data |
| 11 | **Durable storage** | Asks the browser to persist storage (`navigator.storage.persist`) so journals are not evicted. | ✅ |
| 12 | **Resilient** | A per-page error boundary shows "This page tripped over a root" with Try again and Go home, instead of a blank app. | ✅ |
| 13 | **Secure** | User Markdown (flashcards) is sanitised with DOMPurify, and the input parsers use no `eval`. | DOMPurify replaces the regex sanitiser |
| 14 | **Clear feedback** | Bursts on completion, chat confirmations, and an offline/online status pill. | Offline pill |
| 15 | **Consistent UI** | A shared Studio shell with tabs, stats and sliders; theme tokens; 12px radius; one entrance animation for every page. | |
| 16 | **Easy to navigate** | Command palette (Ctrl K), sidebar sections, and "take me somewhere" plus typed page names in Bloom's chat. | |
| 17 | **Gentle onboarding** | Welcome flow, page guides, a Show me around tour, and a placement test for English. | |
| 18 | **Customisable** | Themes (including Matrix and the Glow themes), 9 avatars, feature and sub-feature toggles, and pixel icons. | |
| 19 | **International** | i18n (English and French) for feature names and settings. | |
| 20 | **Well tested** | 300+ Jest tests plus a browser sweep of every page for errors. | Chat-command tests |
| 21 | **Delightful** | Avatar page acts, story mode, weather scenes, the fun layer and animated stats. | |

## Known follow-ups

- **Heading order:** some Studio panels jump from the page `h1` straight to card `h3`s (axe "heading-order", moderate).
- **Landmark labels:** two landmark sections on Settings share a label (axe "landmark-unique", moderate).
