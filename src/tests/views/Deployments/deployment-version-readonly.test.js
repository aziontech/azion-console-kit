// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, relative, sep, dirname, resolve } from 'node:path'

const DEPLOYMENTS_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../src/views/Deployments'
)

const SOURCE_EXTENSIONS = ['.vue', '.js', '.ts', '.jsx', '.tsx']

const PRESERVED_VERSION_FORMS_FOR_OTHER_FLOWS = [
  'Config/createVersionValidation.js',
  'FormFields/FormFieldsDeploymentVersion.vue'
]

const VERSION_MUTATION_TOKENS = [
  'createDraft',
  'updateDraft',
  'patchDraft',
  'deleteVersion',
  'cancelBuild',
  'createVersionService',
  'useVersionMenuActions',
  'deploymentVersionService.build',
  'deploymentVersionService.archive'
]

const LEGITIMATE_RELEASE_TOKENS = [
  'buildAndActivate',
  'buildReleaseService',
  'archiveReleaseService',
  'rollbackReleaseService',
  'activateReleaseService',
  '.build(',
  '.archive('
]

// ENG-46694: revert is now an allowed version-history operation. It generates a
// NEW version from the chosen version's config (it is not a draft/build mutation),
// so it stays out of VERSION_MUTATION_TOKENS on purpose.
const LEGITIMATE_VERSION_HISTORY_TOKENS = ['deploymentVersionService.revert', '.revert(']

const toPosix = (value) => value.split(sep).join('/')

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })

const scannedFiles = walk(DEPLOYMENTS_DIR)
  .filter((file) => SOURCE_EXTENSIONS.some((ext) => file.endsWith(ext)))
  .map((file) => ({ file, rel: toPosix(relative(DEPLOYMENTS_DIR, file)) }))
  .filter(({ rel }) => !PRESERVED_VERSION_FORMS_FOR_OTHER_FLOWS.includes(rel))

describe('Deployment views — Version History surface performs no version mutation except revert', () => {
  it('discovers deployment view source files to scan', () => {
    expect(scannedFiles.length).toBeGreaterThan(0)
  })

  it.each(scannedFiles)('$rel invokes no version-mutation token', ({ file, rel }) => {
    const src = readFileSync(file, 'utf8')
    const found = VERSION_MUTATION_TOKENS.filter((token) => src.includes(token))
    expect(found, `${rel} must not mutate deployment versions`).toEqual([])
  })

  it('does not forbid legitimate release or revert operations', () => {
    for (const legit of [...LEGITIMATE_RELEASE_TOKENS, ...LEGITIMATE_VERSION_HISTORY_TOKENS]) {
      expect(VERSION_MUTATION_TOKENS).not.toContain(legit)
    }
  })

  it('wires the revert action on the Version History tab (ENG-46694)', () => {
    const tab = readFileSync(join(DEPLOYMENTS_DIR, 'tabs', 'VersionHistoryTab.vue'), 'utf8')
    expect(tab).toContain('deploymentVersionService.revert')
  })

  it('keeps preserved version forms out of the read-only scope (used by Workload / Release Composer)', () => {
    const preserved = walk(DEPLOYMENTS_DIR)
      .map((file) => toPosix(relative(DEPLOYMENTS_DIR, file)))
      .filter((rel) => PRESERVED_VERSION_FORMS_FOR_OTHER_FLOWS.includes(rel))
    expect(preserved.sort()).toEqual([...PRESERVED_VERSION_FORMS_FOR_OTHER_FLOWS].sort())
  })
})
