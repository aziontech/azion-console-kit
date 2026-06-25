import { describe, it, expect } from 'vitest'
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Property P4 — no Version Shell fork (Req 8.1, 8.4, NFR-A.1).
 * The `versioned-only` class is plugged by configuration (capability), never by
 * copying the framework. This structural test snapshots the file inventory of
 * `templates/version-shell-block` + `composables/versioning` and fails if a
 * per-resource copy of the shell/machine/bus appears. A genuinely new shared
 * artifact is added to the allowlist on purpose; a resource-prefixed clone is not.
 */

const resolveDir = (relative) => fileURLToPath(new URL(`../../../../${relative}`, import.meta.url))

const listFiles = (relative) => {
  const dir = resolveDir(relative)
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const base = entry.parentPath ?? entry.path
      const rel = `${base}/${entry.name}`.slice(dir.length + 1)
      return rel.split('\\').join('/')
    })
    .sort()
}

const SHELL_DIR = 'src/templates/version-shell-block'
const COMPOSABLES_DIR = 'src/composables/versioning'

// Allowlist of shared framework files. Every entry is generic (no resource name
// baked in). Adding a file here must be a deliberate, shared addition.
const SHELL_ALLOWLIST = [
  'ResourceVersionLanding.vue',
  'VersionEditScreen.vue',
  'VersionEditorTabsShell.vue',
  'components/ProcessingOverlay.vue',
  'components/VersionActionBar.vue',
  'components/VersionActionDialog.vue',
  'components/VersionHeadingActions.vue',
  'components/VersionStateBadge.vue',
  'index.vue',
  'use-version-shell.js'
]

const COMPOSABLES_ALLOWLIST = [
  'to-version-options.js',
  'use-deploy-resource-context.js',
  'use-deployment-release-drawer.js',
  'use-resource-version-landing.js',
  'use-version-command-bus.js',
  'use-version-command.js',
  'use-version-context.js',
  'use-version-edit-screen.js',
  'use-version-form-adapter.js',
  'use-version-list.js',
  'use-version-menu-actions.js',
  'use-version-row-actions.js',
  'use-workload-version-environments.js',
  'version-actions.js',
  'version-capability.js',
  'version-machine.js'
]

// Resource names that must never prefix a shell/machine/bus artifact — that is
// exactly what a per-resource fork would look like.
const RESOURCE_PREFIXES = [
  'application',
  'firewall',
  'workload',
  'custom-page',
  'customPage',
  'connector',
  'function',
  'network-list',
  'networkList',
  'waf'
]

// Core framework primitives that must remain single-sourced (Req 8.1).
const FORKABLE_PRIMITIVES = [
  'VersionShell',
  'VersionMachine',
  'version-machine',
  'VersionActionBar',
  'VersionActionDialog',
  'ProcessingOverlay',
  'VersionStateBadge',
  'CommandBus',
  'command-bus',
  'VersionActions',
  'version-actions',
  'FormAdapter',
  'form-adapter',
  'MenuActions',
  'menu-actions'
]

describe('P4 — Version Shell inventory matches the shared allowlist', () => {
  it('templates/version-shell-block exposes exactly the allowlisted files', () => {
    expect(listFiles(SHELL_DIR)).toEqual([...SHELL_ALLOWLIST].sort())
  })

  it('composables/versioning exposes exactly the allowlisted files', () => {
    expect(listFiles(COMPOSABLES_DIR)).toEqual([...COMPOSABLES_ALLOWLIST].sort())
  })
})

describe('P4 — no per-resource copy of the shell/machine/bus', () => {
  const allFiles = [...listFiles(SHELL_DIR), ...listFiles(COMPOSABLES_DIR)]

  it.each(allFiles)('"%s" carries no resource prefix on a framework primitive', (file) => {
    const baseName = file.split('/').pop().toLowerCase()
    const offenders = RESOURCE_PREFIXES.filter((resource) => {
      const needle = resource.toLowerCase()
      const hasResource = baseName.includes(needle)
      const hasPrimitive = FORKABLE_PRIMITIVES.some((primitive) =>
        baseName.includes(primitive.toLowerCase())
      )
      return hasResource && hasPrimitive
    })

    expect(offenders).toEqual([])
  })
})
