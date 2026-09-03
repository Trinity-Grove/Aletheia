# Shell visual regression

Covers issue #24's "Screenshots de referência são aprovados em 1440, 1024 e 390 px" and "Testes de regressão visual bloqueiam desvios relevantes" criteria for the authenticated shell.

Kept in a separate Playwright config (`playwright-visual.config.ts`) and test directory, out of the default `pnpm test:e2e` run, because `toHaveScreenshot()` fails on any run with no baseline to compare against — and no baseline exists yet for this suite. Wiring it into `pnpm test:e2e` (or a CI step) before that would break every PR's CI, not just ones touching the shell.

## One-time setup: generate the baselines

```bash
pnpm --filter @aletheia/web test:e2e:visual --update-snapshots
```

Review the generated `*-snapshots/` PNGs for the three viewports (1440×900, 1024×768, 390×844), commit them, then:

1. Add a CI step running `pnpm --filter @aletheia/web test:e2e:visual` (no `--update-snapshots`) so future diffs fail the build.
2. Remove this note once that's done.
