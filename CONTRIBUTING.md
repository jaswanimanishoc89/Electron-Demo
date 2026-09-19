# Contributing

## Branch naming

| Prefix | Use for |
| --- | --- |
| `feat/` | New user-facing behavior |
| `fix/` | Bug fixes |
| `chore/` | CI, tooling, deps, housekeeping |
| `docs/` | Docs only |

Examples: `feat/settings-theme`, `fix/tray-icon-windows`, `chore/ci-pr-workflow`.

## PR workflow

1. Create a branch from latest `main`:
   ```bash
   git checkout main
   git pull
   git checkout -b feat/your-change
   ```
2. Make commits with clear messages.
3. Push and open a PR into `main` (use the PR template checklist).
4. Wait for the **CI** workflow to go green.
5. Request review (Principle Engineer / PM as needed).
6. Squash or merge once approved and CI is green.

## Local checks (same as CI)

```bash
npm install
npm run check
npm test
npm run smoke   # needs a display or xvfb on Linux
```

## Required checks (branch protection)

Ask a repo admin to protect `main` with:

- Require a pull request before merging
- Require status checks to pass: **Install, check, smoke** (job from `.github/workflows/ci.yml`)
- Require branches to be up to date (optional but recommended)

No repository secrets are required for the default CI workflow.
