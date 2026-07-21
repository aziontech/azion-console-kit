// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, relative } from 'node:path'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))

const SCAN_DIRS = ['src/views/Deployments', 'src/services/v2/deployment']

const SOURCE_EXTENSIONS = ['.vue', '.js', '.ts', '.mjs', '.cjs', '.jsx', '.tsx']

const FORBIDDEN = [
  { label: "'user-flag' import", pattern: /user-flag/ },
  { label: 'useFlag()', pattern: /\buseFlag\b/ },
  { label: 'hasFlagUseV6Configurations', pattern: /\bhasFlagUseV6Configurations\b/ }
]

const collectFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return collectFiles(full)
    return SOURCE_EXTENSIONS.some((ext) => entry.name.endsWith(ext)) ? [full] : []
  })

const offenders = (files, pattern) =>
  files
    .filter((file) => pattern.test(readFileSync(file, 'utf8')))
    .map((file) => relative(ROOT, file))

describe('Deployment v6 — flag verification stays centralized in the router (Req 6.5, 7.1)', () => {
  for (const dir of SCAN_DIRS) {
    describe(dir, () => {
      const files = collectFiles(join(ROOT, dir))

      it('actually finds source files to scan', () => {
        expect(files.length).toBeGreaterThan(0)
      })

      for (const { label, pattern } of FORBIDDEN) {
        it(`no file references ${label}`, () => {
          expect(offenders(files, pattern)).toEqual([])
        })
      }
    })
  }
})
