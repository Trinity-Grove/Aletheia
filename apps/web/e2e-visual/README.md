# Shell visual regression

Covers issue #24's "Screenshots de referência são aprovados em 1440, 1024 e 390 px" and "Testes de regressão visual bloqueiam desvios relevantes" criteria for the authenticated shell.

Kept in a separate Playwright config (`playwright-visual.config.ts`) and test directory, out of the default `pnpm test:e2e` run, so a shell-only diff doesn't block every PR's CI.

Baselines are committed under `*-snapshots/` for the three viewports (1440×900, 1024×768, 390×844). Playwright's snapshot names are platform-tagged (`-linux.png`), matching the `ubuntu-latest` CI runner — regenerate them from a Linux environment (e.g. the `mcr.microsoft.com/playwright:v1.62.1-noble` image, pinned to match `@playwright/test`'s version), not from a local Windows/macOS machine, or every CI run will diff against the wrong platform's baseline:

```bash
pnpm --filter @aletheia/web test:e2e:visual --update-snapshots
```

CI runs this suite (no `--update-snapshots`) as its own step so a real diff fails the build.
