# JR Creative — Lead Funnel on Vercel (zero-dependency)

Landing page + API in one Vercel project. **No `package.json` and no npm install** — the
serverless functions use only built-in `fetch`, so there's nothing to break the build.

```
(repo root)
├── index.html          # landing page (served at /)
├── api/
│   ├── generate.mjs     # POST → redesign the uploaded room with OpenAI (returns image inline)
│   ├── lead.mjs         # POST → save lead to Airtable + (optional) WhatsApp
│   └── health.mjs       # GET  → shows which keys are configured (/api/health)
└── lib/
    ├── openai-image.mjs # gpt-image-1 (text + image-edit)
    ├── airtable.mjs     # Airtable record creation (your base/table IDs wired in)
    └── whatsapp.mjs     # WhatsApp delivery (image + specs per tier)
```

> All files use the `.mjs` extension so they run as modern JavaScript without any
> config file. **Do not add a `package.json`** unless you also add a dependency.

## Deploy
1. Upload these files to a GitHub repo so `index.html`, `api/`, and `lib/` sit at the **top level**.
2. vercel.com → **Add New → Project** → import the repo.
3. **Settings → Environment Variables** — add:
   | Name | Value |
   |---|---|
   | `OPENAI_API_KEY` | your OpenAI key (billing enabled) — only needed for the photo-redesign feature |
   | `OPENAI_IMAGE_QUALITY` | `medium` (optional) |
   | `AIRTABLE_API_KEY` | your Airtable Personal Access Token |
   | `AIRTABLE_BASE_ID` | `apprrAX9qS1WQZpAh` |
   | `AIRTABLE_TABLE_ID` | `tblSgE3P6xU2t3t7E` |
   | `WHATSAPP_API_TOKEN` | *(optional)* |
   | `WHATSAPP_PHONE_NUMBER_ID` | *(optional)* |
4. **Deploy**, then visit `/api/health` to confirm what's configured.

## How it works
- **No photo uploaded** → the page instantly shows curated designs from the built-in library (no API call, no cost).
- **Photo uploaded** → the page sends it to `/api/generate`, which redesigns the room with OpenAI and returns the image inline for display.
- **Lead submit** → `/api/lead` saves to Airtable and (if WhatsApp is set) sends the 3 designs + specs.

Note: for leads who upload a photo, the image stored in Airtable / sent on WhatsApp is the
matching curated library image (a hosted URL). The visitor still sees their personalized
redesign on screen. (Hosting personalized images for WhatsApp would require adding storage.)
