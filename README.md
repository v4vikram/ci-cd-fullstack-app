# CI/CD Deployment Guide (VPS + GitHub Actions)

> Concise, production-oriented CI/CD for a small full-stack monorepo deployed to a VPS using GitHub Actions. Focus: atomic deployments, safe rollbacks, and minimal server build activity.

---

## Table of Contents

- [Overview](#overview)
- [Repository Layout](#repository-layout)
- [VPS Directory Layout](#vps-directory-layout)
- [Prerequisites & Git Hygiene](#prerequisites--git-hygiene)
- [SSH & GitHub Secrets](#ssh--github-secrets)
- [Backend Workflow (overview)](#backend-workflow-overview)
- [Deployment Steps (what runs)](#deployment-steps-what-runs)
- [Deployment Script (example)](#deployment-script-example)
- [Rollback Procedure](#rollback-procedure)
- [Debugging Tips](#debugging-tips)
- [Next Steps](#next-steps)
- [Key Principles & Summary](#key-principles--summary)

---

## Overview

This repo demonstrates a pragmatic CI/CD approach for a small monorepo where the backend is deployed to a VPS via GitHub Actions. Design goals:

- ✅ Atomic deployments via symlinked releases
- ✅ Instant rollback by switching symlink
- ✅ No production builds on the server
- ✅ Safe, repeatable deployments

---

## Repository Layout

Root structure (simplified):

```
ci-cd-fullstack-app/
├── backend/                # backend app + CI workflow target
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/               # static/demo frontend
│   └── public/index.html
├── .github/workflows/      # GitHub Actions workflows
│   └── deploy-backend.yml
├── .gitignore
└── README.md
```

Why a monorepo? Easier to teach CI/CD patterns and keep rollback logic simple.


## VPS Directory Layout

Recommended on-VPS layout (isolated and release-oriented):

```
/home/<user>/ci-cd-fullstack/
├── backend/
│   ├── releases/
│   │   ├── 20260101123000/
│   │   └── 20260102120000/
│   ├── shared/            # persistent files (logs, uploads)
│   └── current -> releases/20260102120000
└── frontend/
    └── releases/
```

Benefits:
- release history retained
- `current` symlink makes switches atomic
- rollback = symlink switch (seconds)

---

## Prerequisites & Git Hygiene

Important files in `.gitignore`:

```
node_modules/
.env
.env.*
!.env.example
dist/
build/
.next/
.vscode/
.idea/
```

Rules:
- Never commit secret files (`.env`, keys).
- Commit lockfiles for reproducibility.
- CI should generate temporary SSH keys and store the private key in GitHub Secrets.

---

## SSH & GitHub Secrets

Create an ed25519 key pair for GitHub Actions (or reuse an existing secure key):

```bash
ssh-keygen -t ed25519 -C "github-actions"
# add public key to: ~/.ssh/authorized_keys on the VPS
# add private key to GitHub Secrets: e.g., VPS_SSH_KEY
```

Secrets used by the workflow:
- `VPS_HOST` — VPS IP/host
- `VPS_USER` — SSH user (e.g., `vikram`)
- `VPS_SSH_KEY` — private SSH key
- `BACKEND_PATH` — `/home/<user>/ci-cd-fullstack/backend`

---
## Backend Workflow (overview)

Workflow file: `.github/workflows/deploy-backend.yml`

Trigger:
- On push to the deployment branch (e.g., `timewatch-dev`) and only when `backend/**` changes.

High-level steps:
1. Checkout code
2. Run tests/lint (optional)
3. Prepare artifacts (CI-only installs)
4. Establish an SSH connection to VPS
5. Create a timestamped release directory
6. Upload code (rsync)
7. Atomically switch `current` symlink to the new release
8. Optionally restart process manager (PM2/systemd)

---

## Deployment Steps (what runs)

What the Action does on deploy:

- Generate `TIMESTAMP=$(date +%Y%m%d%H%M%S)`
- Connect: `ssh $VPS_USER@$VPS_HOST`
- Create release dir: `mkdir -p $BACKEND_PATH/releases/$TIMESTAMP`
- Upload with `rsync` to `releases/$TIMESTAMP`
- Symlink: `ln -sfn $BACKEND_PATH/releases/$TIMESTAMP $BACKEND_PATH/current`

Why this pattern:
- `ln -sfn` is atomic — production switches only at the final step
- If upload or post-steps fail, `current` still points to previous release

---

## Deployment Script (example)

Snippet you can use in the workflow:

```bash
TIMESTAMP=$(date +%Y%m%d%H%M%S)
ssh $VPS_USER@$VPS_HOST "mkdir -p $BACKEND_PATH/releases/$TIMESTAMP"
rsync -av --delete --exclude '.env' backend/ $VPS_USER@$VPS_HOST:$BACKEND_PATH/releases/$TIMESTAMP/
ssh $VPS_USER@$VPS_HOST "ln -sfn $BACKEND_PATH/releases/$TIMESTAMP $BACKEND_PATH/current"
# (Optional) restart PM2: ssh user@host "pm2 reload ecosystem.config.js --only backend"
```

---

## Rollback Procedure

Rollback is a single symlink switch:

```bash
cd $BACKEND_PATH
ls releases
ln -sfn releases/<previous_timestamp> current
# optionally restart the process manager
```

Keep a few releases to allow fast rollback; do not delete releases immediately.

---

## Debugging Tips

Common causes when a workflow doesn't run or fails:
- Workflow file missing or invalid YAML
- Branch filter mismatch (wrong branch)
- Path filters excluding changes
- Hidden BOM or wrong file encoding

Fixes:
- Validate workflow YAML locally or re-create file
- Ensure branch and path filters match intended pushes
- Re-commit workflow if GitHub cached an invalid parse

---

## Next Steps (deferred / recommended)

Planned improvements:
- ✅ PM2 / process manager configuration
- ✅ Nginx reverse proxy + domains
- ✅ Frontend deployment pipeline
- 🔁 Health-check driven auto-rollback

Say “continue Step 4” to proceed with PM2 setup.

---

## Key Principles & Summary

- CI builds; servers run production code — no server-side builds
- Always use release directories and atomic switches
- Prioritize correctness and safe rollback over deployment speed

You now have a production-style GitHub Actions → VPS pipeline with atomic deployments and instant rollback capability.

---

If you'd like, I can also:
- Add a sample `.github/workflows/deploy-backend.yml` (if missing) ✅
- Add PM2 + Nginx instructions in a follow-up PR ✅

Happy to continue—tell me which next step you want. 💪