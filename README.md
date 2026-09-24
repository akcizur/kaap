# Dimple

A small Vite + React publishing interface, prepared for GitHub Pages.

## Development

```bash
pnpm install
pnpm dev
```

## Production build

```bash
pnpm build
pnpm preview
```

## GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` builds the project and deploys `dist/` to GitHub Pages whenever `main` changes.

For this repository the production URL is:

`https://akcizur.github.io/kaap/`

The Vite base path is derived automatically from `GITHUB_REPOSITORY`, so the same project can also be used as another GitHub repository site.
