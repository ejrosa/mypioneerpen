# PioneerPen — Deploy to Vercel

This folder is a complete, ready-to-deploy project. You don't need to install anything locally or run any commands on your laptop.

## The fastest path: drag-and-drop deploy

1. **Zip this entire folder** (all the files, keeping the folder structure).
2. Go to **vercel.com/new**.
3. Click **"Deploy"** → choose **"Browse templates"** or scroll to **"Import Git Repository"**.
   - If you have GitHub, create a new repo, push this folder to it, then import it into Vercel. This is the best long-term path.
   - If you don't, use **Vercel CLI** in phase B below.
4. Vercel detects this is a Vite project automatically. Click **Deploy**.
5. Wait about 60 seconds. You'll get a URL like `pioneerpen-abc.vercel.app`.
6. At this point the app loads but generation fails — we need to add the API key.

## Set the Anthropic API key

1. In the Vercel dashboard, open your new project.
2. Go to **Settings → Environment Variables**.
3. Add a new variable:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your Claude API key (starts with `sk-ant-...`)
   - Environments: check **Production**, **Preview**, and **Development**
4. Click **Save**.
5. Go to the **Deployments** tab and click the three dots on the latest deployment → **Redeploy**. This picks up the new environment variable.
6. Wait 60 seconds, then visit your URL again.

Generation should now work.

## If you prefer the CLI path

If you have Node.js on your laptop:

```
npm install -g vercel
cd pioneerpen-deploy
vercel
```

Answer the prompts (accept defaults, don't link to existing). After it deploys, set the API key:

```
vercel env add ANTHROPIC_API_KEY
vercel --prod
```

## If you don't have an Anthropic API key yet

1. Go to **console.anthropic.com**.
2. Sign up or log in.
3. Click **API keys** in the left sidebar → **Create key**.
4. Copy the key (starts with `sk-ant-...`). You only see the full value once — save it somewhere safe.
5. Under **Billing** or **Usage limits**, set a monthly spending cap of $25. This protects you from surprise bills.

## What's in this folder

- `index.html` — the main HTML page with PWA meta tags
- `src/main.jsx` — React entry point
- `src/pioneer-letter-wizard.jsx` — the whole app (wizard, drafts, print)
- `api/generate-letter.js` — Vercel serverless function that calls Claude
- `public/manifest.json` — PWA install manifest
- `public/icons/` — all icon sizes for home screen, favicons, PWA
- `package.json` — Node dependencies (React, Vite)
- `vite.config.js` — build configuration

## Testing on your phone after deploy

Once live:

1. Open the Vercel URL in **Safari on iPhone** or **Chrome on Android**.
2. Tap the share button (iOS) or three-dot menu (Android).
3. Tap **"Add to Home Screen"** (iOS) or **"Install app"** (Android).
4. The app icon appears on your home screen. Tap it — it opens like a native app.

## Sharing with friends

Just send them the Vercel URL. They don't need to sign up or install anything to use it — they can open it in any browser and start generating letters. If they want the home-screen icon, they follow the same Add to Home Screen steps above.

## Troubleshooting

**Blank page after deploy.** Open browser dev tools (F12 → Console). Usually a missing file or a typo in imports. Check that all files made it into the zip.

**Generation returns "Something went wrong."** Two usual causes: API key isn't set, or it's set but the app wasn't redeployed. Check Environment Variables in Vercel settings, then redeploy.

**"404" on /api/generate-letter.** The `/api` folder must be at the project root, not inside `src/`. Check the folder structure.

**Icons don't show up.** Icons must be in `/public/icons/`. Check the folder is present in the deploy.
