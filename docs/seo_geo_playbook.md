# GitHub Repository SEO/GEO Playbook

This file tracks discoverability measures for search engines and AI systems.

## Applied In-Repository Measures

- Added `CITATION.cff` for machine-readable software citation metadata.
- Added GitHub community health files:
  - `.github/CONTRIBUTING.md`
  - `.github/CODE_OF_CONDUCT.md`
  - `.github/SECURITY.md`
  - `.github/SUPPORT.md`
- Added LLM-oriented repository indexes:
  - `llms.txt`
  - `llms-full.txt`
- Added repository/package metadata fields (`description`, `keywords`, repository links) in package manifests.

## Manual GitHub Settings (Repository UI/API)

These require maintainer authentication on GitHub:

- Repository **Description** and **Website URL**
- Repository **Topics** (tag keywords)
- Repository **Social preview image**
- Enabling/maintaining **Releases** with clear release notes

## Optional CLI Helper

Use `scripts/github_seo_repo_settings.sh` after authenticating `gh`:

```bash
gh auth login -h github.com
./scripts/github_seo_repo_settings.sh
```

## Notes About GEO

- For Google Search AI features, no special extra AI-only file is required beyond normal crawl/index controls and high-quality content.
- `llms.txt` is an emerging convention (not a universal standard), but is useful for AI tooling that consumes repository text directly.
