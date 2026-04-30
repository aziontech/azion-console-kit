# Semantic Version Tag Implementation Plan

## Context

The current project uses manual version management (v1.57.0 in package.json) with no automated versioning, tagging, or release process. This creates operational overhead and makes rollback difficult. The team wants a simple, automated semantic versioning system using semantic-release that creates pre-release candidates when merging to main, enabling easy rollback capabilities.

**Current State:**
- Manual version bumps in package.json
- No automated git tags or GitHub releases
- No version tracking in deployed application
- Conventional commits already configured (commitlint)
- Deployment workflow: dev branch → stage, main branch → production
- Build tool: Vite with existing define section for environment variables

**Goal:** Implement semantic-release to automatically version, tag, and create pre-release candidates when merging to main, with version injection into the deployed application.

## Design Principles

1. **Pre-Release Strategy**: Merge to main creates pre-release candidate (draft release) for validation before final publish
2. **Standard Tooling**: Use semantic-release (industry-standard, no custom bash scripts)
3. **Convention-Driven**: Leverage existing conventional commits (feat/fix/hotfix)
4. **Traceable**: Three-layer tracking (git tags + GitHub releases + HTML meta tags)
5. **Rollback-Ready**: Every tag is an immutable checkpoint

## Implementation Approach

### Version Bump Strategy

```
Commit Type         → Bump Type    → Example
---------------------------------------------------
feat:               → MINOR        → 1.57.0 → 1.58.0
fix:                → PATCH        → 1.57.0 → 1.57.1
hotfix:             → PATCH        → 1.57.0 → 1.57.1 (IMMEDIATE PRODUCTION)
BREAKING CHANGE     → MAJOR        → 1.57.0 → 2.0.0
chore/docs/style    → NONE         → stays 1.57.0
```

**Special Case - Hotfix:**
- Hotfix commits **skip pre-release** validation
- Merge to main triggers **immediate production release**
- No -rc suffix, directly creates v1.57.1
- Used for emergency fixes only

### Pre-Release Candidate Workflow

```
1. PR merged to dev → stage deployment (no version change)
2. PR merged to main → semantic-release creates PRE-RELEASE CANDIDATE
   - Analyzes commits to determine version bump
   - Updates package.json with pre-release version (e.g., 1.58.0-rc.1)
   - Updates CHANGELOG.md
   - Creates git tag: v1.58.0-rc.1
   - Creates GitHub PRE-RELEASE (marked as pre-release, not latest)
   - Deploys to production URL
3. QA/Validation on pre-release candidate:
   - Test the deployed version on production URL
   - Verify version is v1.58.0-rc.1 in HTML meta tags
   - Review the pre-release notes on GitHub
   - Verify changelog accuracy
4. Manual decision point:
   - IF tests OK → promote to full release (Step 5)
   - IF issues found → don't promote, fix issues in new branch
5. Manual promotion to production release:
   - Merge release PR or trigger promotion workflow
   - Package.json updated to 1.58.0 (removes -rc suffix)
   - Git tag v1.58.0 created
   - GitHub release published and marked as "latest"
```

### Hotfix Workflow (Emergency Only)

```
1. Create hotfix branch from main: hotfix/fix-critical-bug
   OR create a PR from hotfix branch to main
2. Make fix and commit: git commit -m "hotfix: critical security vulnerability"
3. Create PR with label "hotfix"
4. Merge PR → IMMEDIATE PRODUCTION RELEASE
   - Semantic-release detects "hotfix:" commit type
   - Creates production release v1.57.1 (NO -rc suffix)
   - Bypasses pre-release candidate stage completely
   - Directly deploys to production
   - Creates GitHub release marked as "latest"
5. Production is immediately updated with the fix
6. NO manual promotion needed - already in production
```

**Implementation Note:**
- Hotfix branch must be named `hotfix` for automatic production release
- OR use `hotfix-release.yml` workflow to detect hotfix commits merged to main
- See Step 4.1 for implementation details

**Key Benefits:**
- Clear distinction between release candidates and production releases
- Version tag v1.58.0-rc.1 vs v1.58.0 makes rollback obvious
- Production URL always has testable pre-release candidate
- Manual decision point prevents accidental releases
- **Hotfix bypass for emergencies** - immediate production releases without pre-release stage
- Clean git history with proper semantic versioning

## Implementation Steps

### Step 1: Install Semantic Release Dependencies

**File:** `package.json`

Add semantic-release and required plugins to devDependencies:

```json
"devDependencies": {
  "semantic-release": "^24.0.0",
  "@semantic-release/git": "^10.0.1",
  "@semantic-release/changelog": "^6.0.3",
  "@semantic-release/github": "^11.0.0",
  "@semantic-release/commit-analyzer": "^13.0.0",
  "@semantic-release/release-notes-generator": "^14.0.0",
  "@semantic-release/npm": "^12.0.1",
  "conventional-changelog-conventionalcommits": "^8.0.0"
}
```

**Plugin Purposes:**
- `commit-analyzer`: Analyzes conventional commits to determine version bump
- `release-notes-generator`: Generates formatted release notes from commits
- `changelog`: Updates CHANGELOG.md automatically
- `git`: Commits version changes back to repository
- `github`: Creates GitHub draft releases
- `npm`: Updates package.json version (without publishing to npm)

### Step 2: Create Semantic Release Configuration

**File:** `.releaserc.json`

Configure semantic-release for both pre-release candidates and production releases:

```json
{
  "branches": [
    "hotfix",
    {
      "name": "main",
      "prerelease": "rc"
    }
  ],
  "plugins": [
    [
      "@semantic-release/commit-analyzer",
      {
        "preset": "conventionalcommits",
        "releaseRules": [
          { "type": "feat", "release": "minor" },
          { "type": "fix", "release": "patch" },
          { "type": "hotfix", "release": "patch" },
          { "type": "perf", "release": "patch" },
          { "breaking": true, "release": "major" }
        ]
      }
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        "preset": "conventionalcommits",
        "presetConfig": {
          "types": [
            { "type": "feat", "section": "Features" },
            { "type": "fix", "section": "Bug Fixes" },
            { "type": "hotfix", "section": "Hotfixes" },
            { "type": "perf", "section": "Performance Improvements" },
            { "type": "chore", "hidden": true },
            { "type": "docs", "hidden": true },
            { "type": "style", "hidden": true },
            { "type": "refactor", "hidden": true },
            { "type": "test", "hidden": true }
          ]
        }
      }
    ],
    [
      "@semantic-release/changelog",
      {
        "changelogFile": "CHANGELOG.md",
        "changelogTitle": "# Changelog"
      }
    ],
    [
      "@semantic-release/npm",
      {
        "npmPublish": false
      }
    ],
    [
      "@semantic-release/git",
      {
        "assets": ["package.json", "CHANGELOG.md"],
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ],
    [
      "@semantic-release/github",
      {
        "draftRelease": false,
        "prerelease": true,
        "releaseNameTemplate": "v${nextRelease.version}",
        "successComment": false,
        "failTitle": false,
        "labels": false
      }
    ]
  ]
}
```

**Critical Settings:**
- `branches: ["hotfix", { "name": "main", "prerelease": "rc" }]` - Dual configuration:
  - `hotfix` branch → production releases (NO -rc suffix)
  - `main` branch → pre-release candidates (v1.58.0-rc.1)
- `prerelease: true` in github plugin - Marks main branch releases as pre-release
- `hotfix` branch creates immediate production releases
- `npmPublish: false` - Only updates package.json, doesn't publish to npm
- `[skip ci]` in commit message - Prevents infinite CI loops
- Conventional commits preset for automatic version detection

### Step 3: Create Release Workflow

**File:** `.github/workflows/release.yml`

Automated semantic-release workflow for pre-release candidates:

```yaml
name: Release Candidate

on:
  push:
    branches:
      - main

permissions:
  contents: write
  issues: write
  pull-requests: write

jobs:
  release:
    runs-on: ubuntu-latest
    container:
      image: node:22-alpine

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Release
        run: npx semantic-release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Workflow Behavior:**
- Triggers automatically on push to main
- Creates pre-release candidate (e.g., v1.58.0-rc.1)
- Updates package.json with pre-release version
- Creates git tag with -rc suffix
- Creates GitHub pre-release (marked as pre-release, not latest)
- Deploys to production URL

### Step 4: Create Promotion Workflow

**File:** `.github/workflows/promote-release.yml`

Manual workflow to promote pre-release candidate to full release:

```yaml
name: Promote to Production Release

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to promote (without v prefix, e.g., 1.58.0-rc.1)'
        required: true
        type: string

permissions:
  contents: write

jobs:
  promote:
    runs-on: ubuntu-latest
    container:
      image: node:22-alpine

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Configure Git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

      - name: Validate pre-release exists
        run: |
          if ! git tag | grep -q "v${{ github.event.inputs.version }}"; then
            echo "Error: Pre-release v${{ github.event.inputs.version }} not found"
            exit 1
          fi

      - name: Extract version without -rc suffix
        id: version
        run: |
          VERSION="${{ github.event.inputs.version }}"
          PROD_VERSION="${VERSION%%-rc*}"
          echo "version=$PROD_VERSION" >> $GITHUB_OUTPUT

      - name: Update package.json
        run: |
          npm version ${{ steps.version.outputs.version }} --no-git-tag-version

      - name: Update CHANGELOG.md
        run: |
          sed -i "s/\[${{ github.event.inputs.version }}\]/\[${{ steps.version.outputs.version }}\]/g" CHANGELOG.md

      - name: Commit and tag
        run: |
          git add package.json CHANGELOG.md
          git commit -m "chore: promote v${{ steps.version.outputs.version }} to production release"
          git tag -a "v${{ steps.version.outputs.version }}" -m "Production Release v${{ steps.version.outputs.version }}"
          git push origin main
          git push origin --tags

      - name: Update GitHub Release
        uses: actions/github-script@v7
        with:
          script: |
            // Get the pre-release
            const { data: releases } = await github.rest.repos.listReleases({
              owner: context.repo.owner,
              repo: context.repo.repo
            });
            
            const preRelease = releases.find(r => r.tag_name === 'v${{ github.event.inputs.version }}');
            
            if (preRelease) {
              // Create new production release
              await github.rest.repos.createRelease({
                owner: context.repo.owner,
                repo: context.repo.repo,
                tag_name: 'v${{ steps.version.outputs.version }}',
                name: 'v${{ steps.version.outputs.version }}',
                body: preRelease.body,
                draft: false,
                prerelease: false
              });
              
              // Delete the pre-release
              await github.rest.repos.deleteRelease({
                owner: context.repo.owner,
                repo: context.repo.repo,
                release_id: preRelease.id
              });
            }
```

**Workflow Features:**
- Manually triggered via workflow_dispatch
- Accepts pre-release version as input (e.g., 1.58.0-rc.1)
- Validates pre-release exists
- Removes -rc suffix from version
- Updates package.json and CHANGELOG.md
- Creates new git tag without -rc suffix
- Creates GitHub production release
- Deletes the pre-release

### Step 4.1: Configure Hotfix Branch for Immediate Releases

**Semantic-Release Configuration:**

The `.releaserc.json` already includes the hotfix branch configuration:

```json
{
  "branches": [
    "hotfix",  // This enables immediate production releases from hotfix branch
    {
      "name": "main",
      "prerelease": "rc"
    }
  ]
}
```

**How it works:**

1. **Hotfix Branch**: When commits with `hotfix:` type are merged to a branch named `hotfix`, semantic-release creates a **production release** directly (no -rc suffix)

2. **Main Branch**: Regular commits (feat/fix) merged to main create **pre-release candidates** (v1.58.0-rc.1)

3. **PR Workflow for Hotfix**:
   - Create branch: `git checkout -b hotfix/critical-fix main`
   - Commit: `git commit -m "hotfix: critical security vulnerability"`
   - Create PR **from `hotfix` branch to `main`**
   - Merge PR → Immediate production release v1.57.1

**Important**: The hotfix branch must be named exactly `hotfix` to trigger immediate production releases.

**Alternative approach (if you prefer merging hotfix PRs directly to main):**

If you want to merge hotfix branches directly to main (without a separate `hotfix` branch), update the semantic-release configuration to detect hotfix commits:

```json
{
  "branches": [
    {
      "name": "main",
      "prerelease": "rc",
      "prereleaseWithoutPreReleaseBranches": true
    }
  ],
  "plugins": [
    [
      "@semantic-release/commit-analyzer",
      {
        "preset": "conventionalcommits",
        "releaseRules": [
          { "type": "feat", "release": "minor" },
          { "type": "fix", "release": "patch" },
          { "type": "hotfix", "release": "patch" },
          { "type": "perf", "release": "patch" },
          { "breaking": true, "release": "major" }
        ]
      }
    ]
  ]
}
```

Then create a custom workflow to detect hotfix commits:

**File:** `.github/workflows/hotfix-release.yml`

```yaml
name: Hotfix Immediate Release

on:
  pull_request:
    types: [closed]
    branches:
      - main

permissions:
  contents: write

jobs:
  check-hotfix:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    outputs:
      is_hotfix: ${{ steps.check.outputs.is_hotfix }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check for hotfix commits
        id: check
        run: |
          COMMITS=$(git log --pretty=format:"%s" ${{ github.event.pull_request.base.sha }}..${{ github.event.pull_request.head.sha }})

          if echo "$COMMITS" | grep -q "^hotfix"; then
            echo "is_hotfix=true" >> $GITHUB_OUTPUT
            echo "::notice::Hotfix detected - triggering immediate production release"
          else
            echo "is_hotfix=false" >> $GITHUB_OUTPUT
          fi

  trigger-production-release:
    needs: check-hotfix
    if: needs.check-hotfix.outputs.is_hotfix == 'true'
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Configure Git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Create production release
        run: npx semantic-release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**This approach:**
- Detects when a PR with hotfix commits is merged to main
- Automatically triggers a production release
- Bypasses the pre-release candidate stage
- Used for emergency fixes only

```yaml
name: Release

on:
  push:
    branches:
      - main

permissions:
  contents: write
  issues: write
  pull-requests: write

jobs:
  release:
    runs-on: ubuntu-latest
    container:
      image: node:22-alpine

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Release
        run: npx semantic-release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Workflow Behavior:**
- Triggers automatically on push to main
- Analyzes commits since last release
- Determines version bump type automatically
- Updates package.json and CHANGELOG.md
- Creates git tag
- Creates GitHub draft release
- Commits changes back to main branch

### Step 5: Update Production Deployment Workflow

**File:** `.github/workflows/deploy-production.yml`

Add version environment variables and ensure deployment uses the versioned code:

```yaml
name: Deploy Console Kit (PRODUCTION)

on:
  push:
    branches:
      - main

env:
  HUSKY: 0
  CLI_VERSION: 4.15.0

jobs:
  deploy:
    runs-on: ubuntu-latest
    container:
      image: node:22-alpine

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Install SO deps
        run: apk add curl git bash jq

      - name: Install dependencies
        run: yarn install

      - name: Get version info
        run: |
          echo "VITE_APP_VERSION=$(node -p "require('./package.json').version")" >> $GITHUB_ENV
          echo "VITE_BUILD_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> $GITHUB_ENV

      - name: Download Azion CLI
        run: |
          wget https://github.com/aziontech/azion/releases/download/${CLI_VERSION}/azion_${CLI_VERSION}_linux_amd64.apk
          apk add --allow-untrusted azion_${CLI_VERSION}_linux_amd64.apk

      - name: Configure Azion CLI
        run: azion -t ${{ secrets.PLATFORM_KIT_TOKEN }}

      - name: Build & Deploy
        run: azion deploy --auto --local --debug --config-dir azion/production
        env:
          NODE_ENV: production
          GITHUB_SHA: ${{ github.sha }}
          VITE_ENVIRONMENT: production
          VITE_STRIPE_TOKEN_PROD: ${{ secrets.PROD_STRIPE_TOKEN }}
          VITE_RECAPTCHA_SITE_KEY: ${{ secrets.PROD_RECAPTCHA_SITE_KEY }}
          VITE_SEGMENT_TOKEN: ${{ secrets.PROD_SEGMENT_TOKEN }}
          CROSS_EDGE_SECRET: ${{ secrets.PROD_CROSS_EDGE_SECRET}}
          VITE_PROD_SENTRY: ${{ secrets.PROD_SENTRY }}
          VITE_SSO_GITHUB: ${{ secrets.PROD_SSO_GITHUB }}
          VITE_SSO_GOOGLE: ${{ secrets.PROD_SSO_GOOGLE }}
          VITE_SENTRY_AUTH_TOKEN: ${{ secrets.PROD_SENTRY_AUTH_TOKEN }}
          VITE_SENTRY_UPLOAD: true
          VITE_APPCUES_ACCOUNT_ID: ${{ secrets.APPCUES_ACCOUNT_ID }}
```

**Key Additions:**
- Version environment variables for Vite injection
- GITHUB_SHA passed to build process
- Deployment happens in parallel with release workflow

### Step 6: Add Build-Time Version Injection

**File:** `vite.config.js`

Add version variables to the define section (around line 43-45):

```javascript
define: {
  __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.0.0'),
  __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  __GIT_COMMIT__: JSON.stringify(process.env.GITHUB_SHA || 'unknown')
}
```

**File:** `scripts/vite-plugin-version-inject.js`

Create Vite plugin to inject version into HTML meta tags:

```javascript
export default function versionInjectPlugin() {
  return {
    name: 'version-inject',
    transformIndexHtml(html) {
      const version = process.env.npm_package_version || '0.0.0'
      const buildTime = new Date().toISOString()
      const gitCommit = process.env.GITHUB_SHA || 'unknown'

      return html
        .replace(
          /<meta name="app-version" content="" \/>/,
          `<meta name="app-version" content="${version}" />`
        )
        .replace(
          /<meta name="build-time" content="" \/>/,
          `<meta name="build-time" content="${buildTime}" />`
        )
        .replace(
          /<meta name="git-commit" content="" \/>/,
          `<meta name="git-commit" content="${gitCommit}" />`
        )
    }
  }
}
```

**File:** `vite.config.js` (add plugin)

Import and register the plugin:

```javascript
import versionInjectPlugin from './scripts/vite-plugin-version-inject.js'

// In plugins array:
plugins: [
  vue(),
  vueJsx(),
  versionInjectPlugin(),
  istanbul({
    nycrcPath: '.nycrc'
  }),
  // ... rest of plugins
]
```

**File:** `index.html`

Add version meta tags (after line 19):

```html
<meta name="app-version" content="" />
<meta name="build-time" content="" />
<meta name="git-commit" content="" />
```

These will be populated at build time, providing runtime version visibility.

### Step 7: Initialize Changelog

**File:** `CHANGELOG.md`

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.57.0] - 2026-04-29

### Added
- Initial semantic versioning implementation with semantic-release
- Automatic version bumping based on conventional commits
- Pre-release candidate workflow (draft releases)
- Build-time version injection via HTML meta tags
```

This file will be automatically updated by semantic-release.

## Rollback Strategy

### Automatic Checkpoints

1. **Git Tags**: Every release creates permanent tag (e.g., `v1.58.0-rc.1` for pre-release, `v1.58.0` for production)
2. **GitHub Releases**: Pre-release candidates and production releases with full release notes
3. **HTML Meta Tags**: Runtime version visibility for debugging
4. **Changelog**: Complete version history in CHANGELOG.md

### Rollback Options

We provide **two rollback approaches** depending on the scenario:

#### Option 1: Automatic One-Click Rollback (Recommended)

**Use Case**: Quickly rollback to the previous stable production release.

**Implementation**: Create a rollback workflow that automatically deploys the last stable release.

**File:** `.github/workflows/rollback.yml`

```yaml
name: Quick Rollback

on:
  workflow_dispatch:
    inputs:
      confirm:
        description: 'Type "ROLLBACK" to confirm'
        required: true
        type: string

permissions:
  contents: read

jobs:
  rollback:
    runs-on: ubuntu-latest
    if: github.event.inputs.confirm == 'ROLLBACK'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Find last stable release
        id: last_release
        run: |
          # Get all tags, filter production releases (exclude -rc), get last 2
          LAST_STABLE=$(git tag -l 'v*' | grep -v '\-rc' | sort -V | tail -2 | head -1)

          if [ -z "$LAST_STABLE" ]; then
            echo "Error: No previous stable release found"
            exit 1
          fi

          echo "last_stable=$LAST_STABLE" >> $GITHUB_OUTPUT
          echo "::notice::Rolling back to $LAST_STABLE"

      - name: Checkout last stable version
        run: git checkout ${{ steps.last_release.outputs.last_stable }}

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Deploy to production
        run: |
          wget https://github.com/aziontech/azion/releases/download/4.15.0/azion_4.15.0_linux_amd64.apk
          apk add --allow-untrusted azion_4.15.0_linux_amd64.apk
          azion -t ${{ secrets.PLATFORM_KIT_TOKEN }}
          azion deploy --auto --local --debug --config-dir azion/production
        env:
          VITE_ENVIRONMENT: production
          GITHUB_SHA: ${{ steps.last_release.outputs.last_stable }}

      - name: Create rollback record
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.repos.createRelease({
              owner: context.repo.owner,
              repo: context.repo.repo,
              tag_name: '${{ steps.last_release.outputs.last_stable }}-rollback-' + Date.now(),
              name: 'Rollback to ${{ steps.last_release.outputs.last_stable }}',
              body: 'Automated rollback to previous stable release',
              draft: false,
              prerelease: false
            });
```

**How it works:**
- Example: Current production is v1.0.3
- Last stable release is v1.0.2
- Workflow automatically deploys v1.0.2
- Creates a rollback record in GitHub releases
- One-click operation with confirmation

#### Option 2: Manual Rollback to Specific Version

**Use Case**: Rollback to any specific previous release (granular control).

**Implementation**: Create a manual rollback workflow that accepts any release tag.

**File:** `.github/workflows/manual-rollback.yml`

```yaml
name: Manual Rollback to Version

on:
  workflow_dispatch:
    inputs:
      target_version:
        description: 'Target version (e.g., v1.0.1, v1.0.2-rc.1)'
        required: true
        type: string
      confirm:
        description: 'Type "ROLLBACK" to confirm'
        required: true
        type: string

permissions:
  contents: read

jobs:
  rollback:
    runs-on: ubuntu-latest
    if: github.event.inputs.confirm == 'ROLLBACK'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Validate target version
        run: |
          TARGET="${{ github.event.inputs.target_version }}"

          if ! git tag | grep -q "^${TARGET}$"; then
            echo "Error: Version ${TARGET} not found"
            echo "Available tags:"
            git tag -l 'v*' | tail -10
            exit 1
          fi

          echo "::notice::Target version ${TARGET} found"

      - name: Checkout target version
        run: git checkout ${{ github.event.inputs.target_version }}

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Deploy to production
        run: |
          wget https://github.com/aziontech/azion/releases/download/4.15.0/azion_4.15.0_linux_amd64.apk
          apk add --allow-untrusted azion_4.15.0_linux_amd64.apk
          azion -t ${{ secrets.PLATFORM_KIT_TOKEN }}
          azion deploy --auto --local --debug --config-dir azion/production
        env:
          VITE_ENVIRONMENT: production
          GITHUB_SHA: ${{ github.event.inputs.target_version }}

      - name: Create rollback record
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.repos.createRelease({
              owner: context.repo.owner,
              repo: context.repo.repo,
              tag_name: '${{ github.event.inputs.target_version }}-manual-rollback-' + Date.now(),
              name: 'Manual Rollback to ${{ github.event.inputs.target_version }}',
              body: 'Manual rollback deployed via workflow_dispatch',
              draft: false,
              prerelease: false
            });
```

**How it works:**
- Can rollback to any previous release (production or pre-release)
- Example scenario:
  - Current: v1.0.3 (production)
  - Available: v1.0.1-rc.1, v1.0.1, v1.0.2-rc.1, v1.0.2, v1.0.3-rc.1, v1.0.3
  - Can choose to deploy v1.0.1, v1.0.2, or even v1.0.2-rc.1
- Provides full flexibility for any rollback scenario

### Rollback Decision Matrix

| Scenario | Recommended Option | Workflow | Example |
|----------|-------------------|----------|---------|
| Current production broken | Option 1 (Automatic) | `rollback.yml` | v1.0.3 → v1.0.2 (automatic) |
| Need specific previous version | Option 2 (Manual) | `manual-rollback.yml` | v1.0.3 → v1.0.1 (manual) |
| Test a pre-release candidate | Option 2 (Manual) | `manual-rollback.yml` | v1.0.3 → v1.0.2-rc.1 |
| Emergency hotfix needed | Option 1 (Automatic) then create hotfix | `rollback.yml` | Rollback to v1.0.2, then create hotfix branch from v1.0.2 |
| QA needs to test old version | Option 2 (Manual) | `manual-rollback.yml` | Deploy v1.0.1-rc.1 for testing |

## Critical Files

1. **`.releaserc.json`** - Semantic-release configuration for pre-release candidates
2. **`.github/workflows/release.yml`** - Automated pre-release candidate workflow
3. **`.github/workflows/promote-release.yml`** - Manual promotion to production release
4. **`.github/workflows/rollback.yml`** - Automatic one-click rollback to last stable version
5. **`.github/workflows/manual-rollback.yml`** - Manual rollback to any specific version
6. **`.github/workflows/deploy-production.yml`** - Production deployment with version injection
7. **`vite.config.js`** - Build-time version injection via define section
8. **`scripts/vite-plugin-version-inject.js`** - HTML meta tag injection
9. **`index.html`** - Version meta tags
10. **`package.json`** - Add semantic-release dependencies
11. **`CHANGELOG.md`** - Version history (auto-updated)

## Complexity Analysis

### New Dependencies: 7 packages (all semantic-release ecosystem)
- `semantic-release` - Core automation tool
- `@semantic-release/*` - Official plugins for git, github, changelog, npm
- `conventional-changelog-conventionalcommits` - Conventional commits support

### Lines of Code: ~100 total
- Semantic-release config: ~70 lines (JSON)
- Vite plugin: ~20 lines (JavaScript)
- Release workflow: ~30 lines (YAML)

### Maintenance Burden: Very Low
- Industry-standard tool (semantic-release)
- No custom bash scripts
- Declarative configuration (JSON)
- Well-documented, active community
- Automatic dependency updates available

### Failure Modes

| Failure Point | Impact | Recovery |
|--------------|--------|----------|
| Semantic-release fails | No version bump, deployment still works | Manual version bump, fix config |
| Draft release not created | No release checkpoint, version still updated | Create release manually |
| Git tag creation fails | No tag, but version in package.json | Manual tag creation |
| Vite plugin fails | No meta tags, app still works | Fix plugin, redeploy |
| No conventional commits | Semantic-release skips release | Use proper commit format |

**Key Safety:** Semantic-release is non-blocking. Deployment always succeeds.

## Verification Plan

### Local Testing

1. Verify semantic-release configuration:
```bash
yarn install
npx semantic-release --dry-run
```

2. Verify Vite plugin:
```bash
yarn build
grep -E "app-version|build-time|git-commit" dist/index.html
```

### Stage Testing

1. Merge PR to dev branch
2. Verify stage deployment includes version meta tags
3. Confirm NO version bump occurred (only main branch triggers releases)

### Production Testing

1. Create PR with `feat:` commit message
2. Merge to main branch
3. Verify release workflow triggered
4. Check GitHub Releases for **PRE-RELEASE** (v1.58.0-rc.1)
5. Confirm package.json version updated to v1.58.0-rc.1
6. Verify git tag created: `git tag -l | tail -5` (should show v1.58.0-rc.1)
7. Verify production HTML contains version meta tags with v1.58.0-rc.1
8. Test the deployed version on production URL
9. **Manual Step**: If tests pass, trigger promote-release workflow with version 1.58.0-rc.1
10. Verify new production release created (v1.58.0 without -rc suffix)
11. Verify GitHub release marked as "latest"

### Hotfix Testing

1. Create branch: `git checkout -b hotfix/test-fix main`
2. Make fix and commit: `git commit -m "hotfix: critical security vulnerability"`
3. Create PR to main with label "hotfix"
4. Merge PR to main
5. Verify **IMMEDIATE** production release created (v1.57.1, NO -rc suffix)
6. Verify GitHub release marked as "latest"
7. Confirm production deployed with v1.57.1

## Pre-Release Candidate Workflow

### Step-by-Step Process

1. **Development**: Work on feature branch, use conventional commits
2. **Merge**: Merge PR to main with proper commit message
3. **Automation**: Semantic-release automatically:
   - Analyzes commits
   - Bumps version in package.json to v1.58.0-rc.1 (pre-release)
   - Updates CHANGELOG.md
   - Creates git tag: v1.58.0-rc.1
   - Creates GitHub **PRE-RELEASE** (marked as pre-release, not latest)
   - Commits changes to main
4. **Deployment**: Production deployment happens with v1.58.0-rc.1
5. **Validation**: QA team tests the deployed version:
   - Verify version in HTML meta tags shows v1.58.0-rc.1
   - Test functionality on production URL
   - Review pre-release notes on GitHub
6. **Decision Point**:
   - IF tests OK → trigger promote-release workflow
   - IF issues found → don't promote, fix in new branch
7. **Promotion**: Trigger promote-release workflow:
   - Specify version to promote: 1.58.0-rc.1
   - Workflow removes -rc suffix
   - Creates git tag: v1.58.0
   - Creates GitHub production release (marked as latest)
   - Deletes the pre-release

### Benefits

- **Clear Versioning**: v1.58.0-rc.1 vs v1.58.0 distinguishes test from production
- **Safety**: Manual promotion required after testing
- **Flexibility**: Test on production URL before official release
- **Traceability**: Complete audit trail with pre-release tags
- **Rollback**: Don't promote if issues found, create new pre-release
- **Professional**: Industry-standard semantic versioning

## Summary

This implementation provides:

- **Zero Custom Scripts**: Uses semantic-release (industry standard)
- **Pre-Release Validation**: Draft releases require manual promotion
- **Low Complexity**: ~100 lines of config, declarative JSON
- **High Reliability**: Mature tool with active community
- **Easy Rollback**: Draft releases + git tags + changelog
- **Full Traceability**: Version visible in deployed application
- **Scalable**: Works for any team size or commit frequency

The system integrates seamlessly with existing workflows and provides production-grade semantic versioning without custom bash scripts.