import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

/**
 * SENTINEL — the v6 version editor MUST remount on version change (design trap #2).
 *
 * Every `<resource>/v6/VersionEditView.vue` renders the editor keyed by the
 * current `versionId`. That `:key` is not cosmetic: the editor tabs capture the
 * TanStack query, the deploy context and the form snapshot BY VALUE at setup
 * time. Without `:key="versionId"` Vue patches the existing instance in place
 * when the user switches versions, so the stale captured state stays wired —
 * a SAVE / BUILD / DEPLOY command then lands on the previously-selected
 * version. Forcing a remount (fresh key) rebuilds those captures for the new
 * version. See docs/TESTING-VERSIONING.md (real tests only — this guards the
 * one structural fact that keeps commands on the right version).
 *
 * This test reads the SOURCE of each editor view (no mount, no runtime) and
 * fails the moment a view drops the version-keyed editor. It discovers the
 * views dynamically so a newly added resource is covered automatically.
 */

const repoPath = (relative) =>
  resolve(dirname(fileURLToPath(import.meta.url)), `../../../${relative}`)

const VIEWS_DIR = repoPath('src/views')

// A `:key` binding whose expression mentions versionId — accepts `:key="versionId"`
// and defensively any expression that derives from it (e.g. `:key="current.versionId"`).
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
    // If discovery silently found nothing the per-file assertions below would
    // never run, turning this whole guard into a placebo. Fail loudly instead.
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
