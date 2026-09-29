# Gym Rat 🐀

A personal, mobile-only workout tracker. Svelte + Vite, hosted on Cloudflare Pages, and data stored in the browser so it works offline.

## Commands

```sh
npm install      # install dependencies (once)
npm run dev      # start the dev server at http://localhost:5173
npm run build    # build the production site into dist/
```

## Deploy

Hosted on Cloudflare Workers (static assets) at https://gymrat.joseph0x45.com.

```sh
npm run deploy   # build + upload to Cloudflare (needs `npx wrangler login` once)
```

Config lives in `wrangler.jsonc`.
