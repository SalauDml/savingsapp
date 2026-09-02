# DevOps & Deployment Design — SaveMyMoney

**Date:** 2026-05-13
**Status:** Approved
**Approach:** GitHub Flow

---

## Overview

Add a professional git workflow, CI pipeline, and full CD pipeline to the SaveMyMoney project. The goal is not just to set up tooling but to learn each concept at the moment it becomes useful — integrated into feature development phases rather than front-loaded.

**Stack-specific context:** There is no traditional "server" to deploy. The three deployment targets are:
1. **GitHub Actions CI** — automated code quality checks on every PR
2. **EAS (Expo Application Services)** — mobile app builds and OTA updates
3. **Supabase CLI** — database schema migrations applied to production

---

## 1. Git Workflow

### Strategy: GitHub Flow

- `main` is always deployable and protected (no direct pushes)
- All work happens on short-lived branches
- Branches merge back to `main` via Pull Requests
- CI runs automatically on every PR; merge only when checks pass

### Branch Naming Conventions

```
feature/<short-description>    new functionality
fix/<short-description>        bug fixes
chore/<short-description>      maintenance, dependency updates
docs/<short-description>       documentation only
```

Examples: `feature/trucelayer-oauth`, `fix/auth-redirect-loop`, `chore/upgrade-expo-52`

### Commit Message Convention: Conventional Commits

Format: `type: short present-tense description`

```
feat: add TrueLayer OAuth callback handler
fix: correct token expiry check in bank_connections
chore: upgrade expo to 52.0.1
refactor: extract token refresh logic into helper
docs: add RLS policy explanation to schema file
```

Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`

Rules:
- No capital first letter
- No trailing period
- Present tense ("add" not "added")
- Under 72 characters

---

## 2. CI — GitHub Actions

**Trigger:** Every pull request opened or updated against `main`

**File:** `.github/workflows/ci.yml`

**Jobs (run in parallel):**

| Job | Command | What it catches |
|---|---|---|
| Lint | `npx eslint .` | Code style, obvious mistakes, unused imports |
| Type check | `npx tsc --noEmit` | TypeScript type errors without emitting files |
| Tests | `npx jest` | Unit/integration tests (added incrementally per phase) |

**Behaviour:**
- All jobs must pass before a PR can merge
- GitHub shows a green checkmark (✓) or red X on each PR
- If a job fails, you fix and push — the workflow reruns automatically

**Secrets required:**
- None for CI jobs (linting and type checking need no external services)
- Supabase and EAS keys are only needed for CD jobs (added later)

---

## 3. CD — Supabase Migrations

**Trigger:** Push to `main` (after PR merges)

**File:** `.github/workflows/deploy-supabase.yml`

### Two-Environment Setup

| Environment | Purpose | Supabase Project |
|---|---|---|
| Dev | Local development and testing schema changes | Existing project |
| Production | Live app data, only receives reviewed migrations | New project (created in Phase 4) |

### Migration Workflow

1. Developer makes a schema change locally using Supabase CLI
2. CLI generates a timestamped migration file: `supabase/migrations/YYYYMMDD_description.sql`
3. Migration file is committed to the feature branch
4. PR is reviewed — schema change is visible in the diff
5. Merge to `main` triggers GitHub Action: `supabase db push`
6. Migration applies to production Supabase automatically

### GitHub Secrets Required

```
SUPABASE_ACCESS_TOKEN       personal access token from supabase.com/dashboard
SUPABASE_PROJECT_ID         production project ref
```

These are stored in GitHub repo Settings → Secrets → Actions. Never in code.

---

## 4. CD — Mobile Builds (EAS)

**File:** `.github/workflows/deploy-eas.yml`

### Two Types of Updates

| Type | When | Speed | Triggers app store review? |
|---|---|---|---|
| EAS Update (OTA) | JS/TypeScript changes only | ~2 min | No |
| EAS Build | New packages with native modules (config plugins), app.json / eas.json changes, SDK upgrades | ~10–20 min | Yes (for store submission) |

### Channels

| Channel | Audience | Triggered by |
|---|---|---|
| `preview` | Developer only (you) | Merge to `main` (automatic) |
| `production` | App Store / Play Store users | Manual trigger only |

**Automatic on merge to `main`:**
- EAS Update to `preview` channel — JS changes visible on your phone within minutes

**Manual only:**
- EAS Build for production — requires human decision, store review process, signing setup

### GitHub Secrets Required

```
EXPO_TOKEN      personal access token from expo.dev
```

---

## 5. Phased Teaching Integration

Each DevOps concept is introduced when it first becomes useful during feature development. No concept is taught in isolation from the code it protects.

| Phase | Feature Work | DevOps Concept Introduced |
|---|---|---|
| Now (pre-Phase 3) | — | GitHub repo, first push, branching, conventional commits |
| Phase 3 — Bank Connection | TrueLayer OAuth | First PR, GitHub Actions CI runs for the first time, GitHub Secrets for API keys |
| Phase 3 complete | — | EAS preview build auto-triggered on merge; install on phone |
| Phase 4 — Displaying Data | Transactions screen | Supabase migration automation; two-environment setup |
| Phase 5 — AI Integration | Edge Functions | Edge Function deployment via CLI; OpenAI/Claude key management in Secrets |
| Phase 6 — Budgets & Insights | Full app | First EAS production build; App Store submission walkthrough |

---

## 6. Files to Create / Configure

```
.github/
  workflows/
    ci.yml                    ← lint + typecheck + tests on every PR
    deploy-supabase.yml       ← run migrations on merge to main (added Phase 4)
    deploy-eas.yml            ← EAS update (preview) on merge to main (added Phase 3)

.gitignore                    ← verify/update: .env must be excluded, node_modules, .expo, supabase/.temp
```

**GitHub repo settings (manual, done once):**
- Branch protection rule on `main`: require PR before merging, require CI checks to pass
- Add GitHub Secrets: `EXPO_TOKEN`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID` (added progressively per phase)

---

## 7. PLAN.md Updates

The existing `PLAN.md` phases will each gain a **DevOps concept** row alongside feature tasks, making the learning explicit per-phase rather than treated as a separate concern.

---

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Branching strategy | GitHub Flow | Right size for solo dev; teaches the core loop without Git Flow overhead |
| Commit convention | Conventional Commits | Readable history, enables automation later (changelog generation) |
| CI platform | GitHub Actions | Free for public/private repos, deeply integrated with GitHub PRs |
| Mobile CD | EAS Update (preview) on merge | Fast feedback loop; production builds stay manual for control |
| Supabase CD | `supabase db push` on merge to main | Keeps schema and code in sync; migration files are reviewable in PRs |
| Production mobile triggers | Manual only | Store submission requires human judgement and signing setup |
