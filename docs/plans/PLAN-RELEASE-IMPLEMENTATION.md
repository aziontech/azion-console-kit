 Semantic Versioning Release Strategy Implementation Plan

 Context

 The project currently uses manual version management (v1.57.0) with no automated versioning. This implementation adds semantic-release with a three-branch strategy (dev → next
 → main) to automatically version, tag, and create pre-release candidates, enabling easy rollback capabilities and full traceability.

 Why this change is needed:
 - Manual version bumps create operational overhead
 - No automated git tags or GitHub releases exist
 - Rollback is difficult without version checkpoints
 - Team wants pre-release validation before production

 Current State:
 - Manual version in package.json (1.57.0)
 - No automated versioning or tagging
 - Conventional commits already configured (commitlint + husky)
 - Deployment workflow: dev → stage, main → production
 - sync-main-to-dev.yml already handles main → dev back-merge

 Intended Outcome:
 - Automatic semantic versioning based on conventional commits
 - Pre-release candidates (RCs) on next branch (v1.58.0-rc.1)
 - Production releases on main branch (v1.58.0)
 - Version injection into HTML meta tags for runtime visibility
 - Automated back-merge workflow (main → next → dev)
 - One-click rollback capabilities

 Implementation Approach

 Phase 1: Foundation Setup

 1. Install semantic-release dependencies

 File: package.json

 Add to devDependencies:
 {
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
 }

 2. Create semantic-release configuration

 File: .releaserc.json (NEW)

 Configure for three-branch strategy with RC support on next branch and production releases on main.

 3. Create next branch and preview environment

 - Create next branch from main
 - Create azion/preview/ directory with azion.json and args.json (copy from stage config)
 - Important: Do NOT modify existing azion/production/ or azion/stage/ directories

 4. Create CHANGELOG.md

 Initialize changelog file that semantic-release will auto-update.

 Phase 2: Version Injection

 5. Add version injection to vite.config.js

 File: vite.config.js

 Add to define section:
 define: {
   __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
   __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.0.0'),
   __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
   __GIT_COMMIT__: JSON.stringify(process.env.GITHUB_SHA || 'unknown')
 }

 6. Create Vite plugin for HTML meta tags

 File: scripts/vite-plugin-version-inject.js (NEW)

 Plugin to inject version into HTML meta tags at build time.

 7. Update vite.config.js and index.html

 - Import and register the plugin
 - Add meta tags to index.html: app-version, build-time, git-commit

 Phase 3: Workflow Implementation

 8. Create release candidate workflow

 File: .github/workflows/release-next.yml (NEW)

 Triggers on push to next branch → creates RC versions (v1.58.0-rc.1).

 9. Create production release workflow

 File: .github/workflows/release-main.yml (NEW)

 Triggers on push to main branch → creates production versions (v1.58.0).

 10. Create back-merge workflow

 File: .github/workflows/back-merge.yml (NEW)

 Triggers on tag creation → performs main → next → dev synchronization.
 Replaces sync-main-to-dev.yml with extended 3-branch support.

 11. Create deploy preview workflow

 File: .github/workflows/deploy-preview.yml (NEW)

 Deploys to preview environment after RC release completes.
 Uses workflow_run trigger after release-next.yml.

 12. Modify deploy production workflow

 File: .github/workflows/deploy-production.yml

 Change trigger from push: branches: [main] to workflow_run after release-main.yml.
 Ensures deployment happens after semantic-release updates version.

 13. Delete old sync workflow

 File: .github/workflows/sync-main-to-dev.yml (DELETE)

 Remove after back-merge.yml is tested and working.

 Phase 4: Rollback Workflows

 14. Create automatic rollback workflow

 File: .github/workflows/rollback.yml (NEW)

 One-click rollback to previous stable production release.

 15. Create manual rollback workflow

 File: .github/workflows/manual-rollback.yml (NEW)

 Rollback to any specific version (production or RC).

 Phase 5: GitHub Configuration

 16. Configure branch protection rules

 Configure in GitHub UI for main, next, and dev branches with appropriate approval requirements.

 17. Configure workflow permissions

 Enable "Read and write permissions" and allow Actions to create PRs.

 Critical Files

 Files that will be created or modified:

 New Files (10):
 - .releaserc.json - Semantic-release configuration
 - .github/workflows/release-next.yml - RC release workflow
 - .github/workflows/release-main.yml - Production release workflow
 - .github/workflows/back-merge.yml - Branch synchronization
 - .github/workflows/deploy-preview.yml - Preview deployment
 - .github/workflows/rollback.yml - Automatic rollback
 - .github/workflows/manual-rollback.yml - Manual rollback
 - scripts/vite-plugin-version-inject.js - Version injection plugin
 - CHANGELOG.md - Version history
 - azion/preview/azion.json and azion/preview/args.json - Preview environment config

 Modified Files (3):
 - package.json - Add semantic-release dependencies
 - vite.config.js - Add version injection and plugin
 - index.html - Add version meta tags
 - .github/workflows/deploy-production.yml - Change trigger to workflow_run

 Deleted Files (1):
 - .github/workflows/sync-main-to-dev.yml - Replaced by back-merge.yml

 NOT Modified:
 - azion/production/ - Existing production config stays unchanged
 - azion/stage/ - Existing stage config stays unchanged
 - .github/workflows/deploy-stage.yml - No changes needed

 Workflow Changes

 Before:
 feature/* → dev (stage) → main (production)
                 └─ sync ─┘

 After:
 feature/* → dev (stage) → next (preview) → main (production)
                 └────────── back-merge ──────────┘

 Branch → Environment Mapping:
 - dev → stage (no version change)
 - next → preview (v1.58.0-rc.1)
 - main → production (v1.58.0)

 Potential Risks and Mitigation

 ┌──────────────────────────────────────┬─────────────────────────┬─────────────────────────────────────────────────┐
 │                 Risk                 │         Impact          │                   Mitigation                    │
 ├──────────────────────────────────────┼─────────────────────────┼─────────────────────────────────────────────────┤
 │ semantic-release fails               │ No version bump         │ Non-blocking workflow, manual fallback          │
 ├──────────────────────────────────────┼─────────────────────────┼─────────────────────────────────────────────────┤
 │ back-merge conflicts                 │ Branch divergence       │ Use --no-edit flag, manual resolution if needed │
 ├──────────────────────────────────────┼─────────────────────────┼─────────────────────────────────────────────────┤
 │ Preview environment misconfigured    │ RC deployment fails     │ Test manually before enabling workflow          │
 ├──────────────────────────────────────┼─────────────────────────┼─────────────────────────────────────────────────┤
 │ Production deployment trigger broken │ Production not deployed │ Revert to push trigger immediately              │
 ├──────────────────────────────────────┼─────────────────────────┼─────────────────────────────────────────────────┤
 │ Version not injected                 │ Missing meta tags       │ Fallback values in plugin                       │
 └──────────────────────────────────────┴─────────────────────────┴─────────────────────────────────────────────────┘

 Transition Strategy

 Migration Steps:
 1. Install dependencies and create config files (Phase 1-2)
 2. Create next branch and preview environment
 3. Test semantic-release locally with dry-run
 4. Create and test workflows in isolation
 5. Verify preview deployment works
 6. Update production deployment workflow
 7. Test full flow with small change
 8. Delete sync-main-to-dev.yml after verification
 9. Configure branch protection rules
 10. Update team documentation

 Rollback Plan:
 - If issues arise, revert deploy-production.yml to use push trigger
 - Keep old workflow files as backups until transition is complete
 - Manual version tagging still possible as fallback

 Verification Plan

 Local Testing:
 # Install dependencies
 yarn install

 # Dry-run semantic-release
 npx semantic-release --dry-run

 # Build and verify version injection
 yarn build
 grep -E "app-version|build-time|git-commit" dist/index.html

 Workflow Testing:
 1. Create feature branch from dev
 2. Commit: git commit -m "feat: test feature"
 3. Create PR to dev → verify stage deployment (no version change)
 4. Create PR dev → next → verify RC creation (v1.58.0-rc.1)
 5. Verify preview deployment and HTML meta tags
 6. Create PR next → main → verify production release (v1.58.0)
 7. Verify back-merge workflow (main → next → dev)
 8. Test rollback workflows

 Success Criteria:
 - RC versions created on next branch with -rc suffix
 - Production versions created on main branch (no suffix)
 - Git tags and GitHub releases created automatically
 - Version visible in deployed application HTML
 - Back-merge keeps branches synchronized
 - Rollback workflows deploy previous versions successfully

 Key Implementation Notes

 1. Existing Azion configs: Do NOT modify azion/production/ or azion/stage/ directories - only create new azion/preview/ directory
 2. sync-main-to-dev.yml: This already exists and handles main → dev back-merge. We'll replace it with back-merge.yml that handles the 3-branch flow
 3. commitlint: Already configured with conventional commits - no changes needed
 4. Preview environment: Needs to be created manually first before enabling deploy-preview.yml workflow
 5. Workflow order: semantic-release must complete before deployment to ensure version is updated in package.json