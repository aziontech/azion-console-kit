import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, relative, sep } from 'node:path'

const DEPLOYMENTS_DIR = fileURLToPath(new URL('../../../../src/views/Deployments', import.meta.url))

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

describe('Deployment views — Version History surface is read-only (no version mutation)', () => {
  it('discovers deployment view source files to scan', () => {
    expect(scannedFiles.length).toBeGreaterThan(0)
  })

  it.each(scannedFiles)('$rel invokes no version-mutation token', ({ file, rel }) => {
    const src = readFileSync(file, 'utf8')
    const found = VERSION_MUTATION_TOKENS.filter((token) => src.includes(token))
    expect(found, `${rel} must not mutate deployment versions`).toEqual([])
  })

  it('does not forbid legitimate release operations', () => {
    for (const legit of LEGITIMATE_RELEASE_TOKENS) {
      expect(VERSION_MUTATION_TOKENS).not.toContain(legit)
    }
  })

  it('keeps preserved version forms out of the read-only scope (used by Workload / Release Composer)', () => {
    const preserved = walk(DEPLOYMENTS_DIR)
      .map((file) => toPosix(relative(DEPLOYMENTS_DIR, file)))
      .filter((rel) => PRESERVED_VERSION_FORMS_FOR_OTHER_FLOWS.includes(rel))
    expect(preserved.sort()).toEqual([...PRESERVED_VERSION_FORMS_FOR_OTHER_FLOWS].sort())
  })
})
