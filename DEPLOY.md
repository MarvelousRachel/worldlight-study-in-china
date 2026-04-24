This repository contains a static website (HTML, CSS, JS) ready for GitHub Pages deployment.

Automatic deployment
--------------------
A GitHub Actions workflow is added in `.github/workflows/deploy-pages.yml` which publishes the repository root to GitHub Pages when commits are pushed to the `main` branch.

To use:

1. Push your changes to the `main` branch.
2. On GitHub, enable Pages for this repository (Repository settings → Pages) if not already enabled. Choose "GitHub Actions" as the source.
3. After the workflow runs, your site will be available at `https://<your-org-or-username>.github.io/<repo-name>/` or at your custom domain if configured.

Notes
-----
- The workflow publishes the repository root. If you only want to publish a subfolder, update the `path:` value in the workflow to point to that folder.
- The workflow uses the official `actions/deploy-pages` action and requires the repository to have GitHub Pages enabled in settings.
