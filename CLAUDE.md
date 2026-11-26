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
