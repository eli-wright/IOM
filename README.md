# IOM Manual Builder

A single-page web app that assembles Installation, Operation & Maintenance (IOM)
manual packages from a Bill of Materials and the component datasheets.

The entire app is one file — [`index.html`](index.html) — with no build step.

## How it works

1. **Enter the job number** to unlock the workflow.
2. **Upload a BOM** (`.csv`, `.xlsx`, or `.pdf`).
3. **Datasheets load automatically** from this repo's [`datasheets/`](datasheets)
   folder — there is no manual upload. The app lists the folder via the GitHub
   API and downloads every PDF once, caching them in the browser (IndexedDB) so
   they only re-download when they change in the repo.
4. **Auto-assignment** picks the correct datasheet for each component using shop
   rules → part-number/text matching → an AI fallback. Review and override in
   Step 3, then generate the combined PDF.

## Adding or updating datasheets

Commit PDF files into the [`datasheets/`](datasheets) folder on `main`. They
appear in the app automatically the next time it loads — no code changes needed.

## Deployment

Deployment is fully automated by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

- **On every pull request and push:** `index.html` is validated
  (`scripts/validate.js` checks JS syntax, that every element id the script uses
  exists, and that the GitHub auto-load stays wired up).
- **On push to `main`:** the app and the `datasheets/` folder are published to
  GitHub Pages.

The deploy job enables Pages (with the "GitHub Actions" source) automatically on
its first run, so there is no manual setup. Every push to `main` publishes to:

```
https://eli-wright.github.io/IOM/
```

Serving from GitHub Pages also lets the app fetch datasheets same-origin (no API
rate limits, CDN-cached).

> If your org disallows workflow-managed Pages, set the source manually instead:
> **Settings → Pages → Build and deployment → Source = "GitHub Actions"**.

## Local validation

```bash
node scripts/validate.js
```
