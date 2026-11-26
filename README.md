# Mohammad Khan · Library

Personal library: fiction, essays, tools and projects, read live from Notion. One story a week since 2020. No likes, no comments — only "Copy link".

## Routes

| Path | What's there |
|------|-------------|
| `/` | Home — scene with four doors (Stacks, Train, Lab, Nook) |
| `/stacks` | Search + Gallery / Spines / Table across stories, posts, tools, projects, and bookshelf |
| `/tracker` | Build tracker — weekly heat grid, Charts, and library-wide stats |
| `/train` | Train of Thought — departure board and ride view for newsletter posts |
| `/lab` | The Lab — pegboard tools, ongoing projects, and drawer cabinet by category |
| `/nook` | Reading Nook — current read, notes, and book log |

Old hash links (`#stories`, `#tools`, `#projects`, `#bookshelf`, `#writing`) redirect to `/stacks`.

## How it updates

- Pages re-read Notion at most once an hour (`revalidate = 3600`). Add a story in Notion and it appears within the hour, with no redeploy.
- Story thumbnails: the page cover, else the first image on the page (`/img/[id]`).
- Post thumbnails: each Substack post's preview image (`/og`).
- With no `NOTION_TOKEN` set, the site shows the bundled snapshot in `lib/snapshot.json`.

## Setup (one time)

1. Go to notion.so/my-integrations → New integration (internal, read content only). Copy the secret.
2. In Notion, open each database → ••• → Connections → add the integration: Story Database, Fictioneering · Published Newsletter, My Products.
3. In Vercel → your project → Settings → Environment Variables, add `NOTION_TOKEN` = the secret, then redeploy.

## Data sources

IDs live at the top of `lib/notion.js`. Products show only Launched / In Development and skip Conference Proposals.
