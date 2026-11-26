# Mohammad Khan · Fictioneering

Personal library: newsletter, Story Database and tools, read live from Notion, with a weekly build tracker.
No likes, no comments, only "Copy link".

## How it updates
- `app/page.js` re-reads Notion at most once an hour (`revalidate = 3600`). Add a story in Notion and it appears within the hour, with no redeploy.
- Story thumbnails: the page cover, else the first image on the page (`/img/[id]`).
- Post thumbnails: each Substack post's preview image (`/og`).
- With no `NOTION_TOKEN` set, the site shows the bundled snapshot in `lib/snapshot.json`.

## Setup (one time)
1. Go to notion.so/my-integrations → New integration (internal, read content only). Copy the secret.
2. In Notion, open each database → ••• → Connections → add the integration:
   Story Database, Fictioneering · Published Newsletter, My Products.
3. In Vercel → your project → Settings → Environment Variables, add `NOTION_TOKEN` = the secret, then redeploy.

## Data sources
IDs live at the top of `lib/notion.js`. Products show only Launched / In Development and skip Conference Proposals.
