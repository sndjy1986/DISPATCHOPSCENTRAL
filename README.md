# Dispatch Ops Central - GitHub Pages Edition

A modern, fast, and 100% static client-side web application designed for emergency dispatchers and operations teams. 

Reconfigured to run completely on **GitHub Pages** (or any static web host) with **zero server costs** and **no backend server required**.

---

## What Was Reconfigured for 100% Static GitHub Hosting

1. **Zero Node/Express Server Required**:
   - The original Google Cloud / Express backend (`server.ts`) has been removed.
   - The application now compiles to pure static HTML, CSS, and JavaScript in `dist/`.

2. **Direct Radio Scanner Tunneling**:
   - The live scanner (`ScannerVFD.tsx`) connects directly via browser CORS to the public API endpoint (`https://radioapi.sndjy.us/latest` and `https://radioapi.sndjy.us/audio/:id`).

3. **Client-Side News & Intel Feeds**:
   - The Global Signal Hub news widget now parses RSS feeds directly in the browser via `rss2json` (matching Word-of-the-Day), with built-in instant fallback emergency bulletins so it never breaks.

4. **In-Browser Traffic Analysis Simulation**:
   - DOT camera frame analysis runs directly client-side, generating bounding boxes and traffic flow indicators with zero Gemini server quota needed.

5. **Client-Side Persistence & Backups**:
   - Settings, reports, and turnovers persist reliably in browser `localStorage` and best-effort Firestore.
   - The Backup Control modal exports and imports standard JSON backups directly to and from browser memory without any server proxy.

6. **Static SPA Deep Linking**:
   - Uses `HashRouter` (`/#/tone-test`, `/#/cameras`, etc.) and a custom `404.html` redirect script to ensure seamless page reloads on GitHub Pages without 404 errors.
   - Vite is configured with `base: './'` so assets load cleanly on repository subpaths (e.g., `https://<username>.github.io/<repo-name>/`).

7. **Automated GitHub Actions CI/CD**:
   - Includes `.github/workflows/deploy.yml` for 1-click or automated deployment on every commit.

---

## How to Host on GitHub Pages (Free)

### Method 1: Push to GitHub & Enable GitHub Actions (Recommended)

1. Create a new repository on [GitHub](https://github.com/new) (e.g., `dispatch-ops-central`).
2. In this folder (`Dispatch Ops Central - Updated`), initialize git and push:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Dispatch Ops Central static build"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
3. On GitHub, go to **Settings** > **Pages**:
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. The included workflow (`.github/workflows/deploy.yml`) will automatically build and publish your site!

### Method 2: Host the Pre-Built `dist` Folder Directly

If you prefer deploying just the compiled static files:
- The compiled site is already built in the `dist/` directory.
- You can upload `dist/` to GitHub Pages (`gh-pages` branch), Netlify, Cloudflare Pages, Vercel, or any web server.

---

## Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```
