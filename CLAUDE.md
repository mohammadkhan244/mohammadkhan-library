# Mohammad Khan · Library
Next.js 15, plain JS, Vercel. Public repo. Server page app/page.js (getLibrary from lib/notion.js) + vanilla client public/app.js (renders into #ids from the #data JSON) + public/train.js (/train). Colours live ONLY in app/theme.css. Fonts loaded in app/layout.js: Gilda Display (headings), Lato (body), Josefin Sans (labels, tabs).

## Mockups (match them)
https://claude.ai/artifact/FjWkv9tuf6tjT1B6ALXiCR → boards "Home — 4 doors", "The Lab — workbench", "Phone — Home", "Phone — The Lab". Open them (Play) and copy sizes and motion.

## Rules (mentor Sandra: keep it simple)
- Fewer elements per screen; if in doubt, cut. One font system (3 roles above), same title style everywhere, no one-off fonts.
- Image first, one short line of text second. Text never touches a border (≥12px padding). Never truncate text.
- Share-only: no likes, no comments; every item keeps "Copy link".
- Wada colours only, hex only in theme.css, flat fills, no gradients. Signal colour max once per screen. Tap targets ≥44px.
- prefers-reduced-motion: no animation, no transitions.
- ONLY touch the files the current phase needs. If you want to change anything else, tell me first.

## Routes
/ = scene home · /tracker = header stats + Tracker/Charts · /stacks = search/filters + Gallery/Shelf/Table + Newsletter + Bookshelf · /train · /lab · /nook (repo may not have it; if missing, the Nook door is non-link: aria-disabled, muted, no hover lift, and tell me). Old hashes (#stories #tools #projects #bookshelf #writing) must still land somewhere sensible.

## Check (every phase)
Screenshots at 390px and 1280px, dark AND light theme. Tab through everything: visible 2px var(--accent) focus ring, Enter works. No console errors. `next build` passes. Commit once per phase. Wait for my OK, then push.

## Mobile rules (apply to every phase)
- Mobile first. Design at 390px, then verify 360, 390, 430 (phones), 768 (tablet), 1280 (desktop), and phone landscape (844×390).
- No fixed-pixel widths on phone layouts. Size the scene with vw/% and clamp() so it fits 360–430 without overflow or horizontal scroll. The home's 4 doors must always fit on one row with ≥8px gaps.
- Minimum text size 12px. Tap targets ≥44×44px with ≥8px between them. Never truncate text; it wraps.
- No hover-only information or actions. Anything revealed on hover (tool names, labels) is also visible by default or on tap/focus on touch. Use :active for press feedback on touch; keep :hover lift for desktop only (@media (hover: hover)).
- Bottom tab bar: height 64px + env(safe-area-inset-bottom) padding; add viewport-fit=cover to the viewport metadata. Use dvh (not vh) for full-height layouts.
- Performance: animate only transform and opacity. No animation of layout properties. Pause rain, flaps and floor ticks when the tab is hidden (visibilitychange) and when offscreen (IntersectionObserver). prefers-reduced-motion = no animation.
- Tablet 641–1024px: the scene scales proportionally from its 1280×800 stage; no layout break.
- Phone landscape (height <500px): hide the floor grid and decorative rain, keep the four doors and the tab bar reachable without vertical clipping.
- Check every phase at all the sizes above, both themes, and tell me about anything that doesn't fit.
