# IOM Manual Builder

A single-page web app that assembles Installation, Operation & Maintenance (IOM)
manual packages from a Bill of Materials and the component datasheets.

The entire app is one file — [`index.html`](index.html) — with no build step.

## How it works

The datasheets are handled entirely behind the scenes — there is **no upload
step and no library to manage**. The flow is just two steps:

1. **Bill of Materials** — enter the job number and upload a BOM
   (`.csv`, `.xlsx`, or `.pdf`), then click **Process & Auto-Match**.
2. **Review & Build** — every BOM line is shown with the datasheet that was
   matched to it. Override any match with the dropdowns, set options, and
   generate the combined PDF.

In the background the app lists this repo's [`datasheets/`](datasheets) folder
via the GitHub API, downloads every PDF once (cached in the browser via
IndexedDB so they only re-download when they change in the repo), then
cross-references each one to the BOM using shop rules → part-number/text
matching → an AI fallback.

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
