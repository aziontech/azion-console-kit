import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const repoPath = (relative) =>
  resolve(dirname(fileURLToPath(import.meta.url)), `../../../${relative}`)

const VIEWS_DIR = repoPath('src/views')

const VERSION_KEYED = /:key="[^"]*[vV]ersionId[^"]*"/

const discoverEditorViews = () =>
  readdirSync(VIEWS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `src/views/${entry.name}/v6/VersionEditView.vue`)
    .filter((relative) => existsSync(repoPath(relative)))
    .sort()

const editorViews = discoverEditorViews()

describe('SENTINEL — v6 VersionEditView remounts the editor on version change', () => {
  it('discovers at least one v6 VersionEditView (guards against a vacuous it.each)', () => {
    expect(editorViews.length).toBeGreaterThan(0)
  })

  it.each(editorViews)('%s keys the editor by versionId (forced remount)', (relative) => {
    const source = readFileSync(repoPath(relative), 'utf8')

    expect(
      VERSION_KEYED.test(source),
      `${relative} renders the version editor WITHOUT a \`:key="versionId"\`.\n` +
        'The editor must REMOUNT when versionId changes: its query, deploy context\n' +
        'and form snapshot are captured by value at setup. Without the key Vue\n' +
        'patches the stale instance in place and SAVE/BUILD/DEPLOY hit the wrong\n' +
        'version. Add `:key="versionId"` to the editor component (see design trap\n' +
        '#2 / docs/TESTING-VERSIONING.md). If this view uses a different remount\n' +
        'strategy on purpose, do NOT relax this test — surface it in review.'
    ).toBe(true)
  })
})
