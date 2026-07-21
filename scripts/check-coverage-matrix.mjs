#!/usr/bin/env node

/**
 * check-coverage-matrix.mjs
 *
 * Task 12.2 gate for the versioning-test-coverage spec (design §3.5).
 *
 * tests/coverage-matrix.json is only worth keeping if it cannot lie. This
 * script cross-checks the matrix against the CODE (which resources are
 * actually plugged into the version shell) and against the FILESYSTEM
 * (which test files actually exist), and fails CI on any divergence:
 *
 *   1. Plugged resource without a matrix row — every key of
 *      RESOURCE_VERSION_ROUTES (use-version-menu-actions.js) must have a row.
 *   2. Missing journey — every row must carry ALL journeys declared in the
 *      `journeys` block (J1–J10); 'n/a' cells count as present.
 *   3. 'missing' cells — a cell with status 'missing' fails, UNLESS it
 *      declares an explicit `acceptedGap: "<justification>"`, which downgrades
 *      it to a WARNING (an audited, deliberate gap — not a forgotten one).
 *   4. Ghost coverage — every path in `coveredBy` must exist on disk.
 *   4b. coveredBy-real — for every covered/partial cell, at least one path in
 *      `coveredBy` must both EXIST and CONTAIN a textual reference to the
 *      journey's command (grep of the file content). A cell whose evidence files
 *      never mention the behavior they claim to prove is a "stale coverage claim"
 *      (the F2 file deletions could otherwise leave a cell pointing at a file
 *      that no longer exercises the journey). Token map per journey below.
 *   5. Class consistency — resources declared VERSIONED_ONLY in
 *      version-capability.js must have class 'versioned-only' and J8 at
 *      level 'n/a' (there is no deploy journey to cover); no other resource
 *      may claim J8 as 'n/a'.
 *   6. Summary drift — totals and perJourney are recomputed from the cells
 *      (level 'n/a' counts as 'na', otherwise the status buckets) and must
 *      match the stored summary byte-for-byte.
 *
 * Usage:
 *   node scripts/check-coverage-matrix.mjs
 *
 * Exit codes:
 *   0 - matrix consistent with code, filesystem and itself
 *   1 - violation found (blocks CI)
 *   2 - script error (unreadable/unparseable inputs)
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const MATRIX_FILE = path.join(PROJECT_ROOT, 'tests/coverage-matrix.json')
const ROUTES_FILE = path.join(
  PROJECT_ROOT,
  'src/composables/versioning/use-version-menu-actions.js'
)
const CAPABILITY_FILE = path.join(PROJECT_ROOT, 'src/composables/versioning/version-capability.js')

const STATUSES = new Set(['covered', 'partial', 'missing'])

/**
 * Journey → command tokens. A covered/partial cell must cite at least one file
 * whose content references one of its journey's tokens. Matched case-insensitively
 * (so `transformCreateDraftPayload` counts for `createDraft`, `Build` for `build`)
 * — the point is that the evidence file genuinely mentions the journey's command,
 * not the exact casing. Mirrors requirements §7 (J1–J10) command vocabulary.
 */
const JOURNEY_TOKENS = {
  J1: ['createDraft'],
  J2: ['SAVE'],
  J3: ['SAVE_AND_BUILD', 'build'],
  J4: ['CANCEL_BUILD', 'cancel'],
  J5: ['NEW_DRAFT_FROM', 'createDraft'],
  J6: ['ARCHIVE', 'archive'],
  J7: ['DELETE', 'deleteVersion'],
  J8: ['DEPLOY', 'PROMOTE'],
  J9: ['readOnly', 'isImmutable', 'disabled'],
  J10: ['command-error', 'showErrors', 'rejects']
}

function readFileOrDie(file, label) {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CI gate script: paths come from the repo-committed matrix/source list, not user input
    return fs.readFileSync(file, 'utf-8')
  } catch (error) {
    console.error(`Cannot read ${label} (${file}): ${error.message}`)
    process.exit(2)
  }
}

function loadMatrix() {
  try {
    return JSON.parse(readFileOrDie(MATRIX_FILE, 'coverage matrix'))
  } catch (error) {
    console.error(`Coverage matrix is not valid JSON: ${error.message}`)
    process.exit(2)
  }
}

/** Extracts the keys of an `export const NAME = {...}` object literal from source. */
function parseObjectKeys(source, declarationRe, label) {
  const match = source.match(declarationRe)
  if (!match) {
    console.error(`Could not locate ${label} in its source file — parser needs updating.`)
    process.exit(2)
  }
  const keys = []
  const keyRe = /^\s*([A-Za-z_]\w*)\s*:/gm
  let key
  while ((key = keyRe.exec(match[1])) !== null) keys.push(key[1])
  if (!keys.length) {
    console.error(`${label} parsed to zero keys — parser needs updating.`)
    process.exit(2)
  }
  return keys
}

function getPluggedResourceTypes() {
  const source = readFileOrDie(ROUTES_FILE, 'RESOURCE_VERSION_ROUTES source')
  return parseObjectKeys(
    source,
    /export const RESOURCE_VERSION_ROUTES\s*=\s*\{([\s\S]*?)\}/,
    'RESOURCE_VERSION_ROUTES'
  )
}

function getVersionedOnlyTypes() {
  const source = readFileOrDie(CAPABILITY_FILE, 'RESOURCE_CAPABILITY source')
  return parseObjectKeys(
    source,
    /export const RESOURCE_CAPABILITY\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\)/,
    'RESOURCE_CAPABILITY'
  )
}

/** Check 1 — every resource plugged in the code has a matrix row. */
function checkPluggedResources(matrix, plugged, errors, warnings) {
  for (const type of plugged) {
    if (!matrix.matrix[type]) {
      errors.push(
        `[plugged-without-row] "${type}" is plugged (RESOURCE_VERSION_ROUTES) but has no row in matrix — add its 10 journey cells.`
      )
    }
  }
  for (const row of Object.keys(matrix.matrix)) {
    if (!plugged.includes(row)) {
      warnings.push(
        `[stale-row] matrix documents "${row}" but it is not in RESOURCE_VERSION_ROUTES — unplugged resource or stale row.`
      )
    }
  }
}

/** Check 2 — every row carries every declared journey (n/a counts as present). */
function checkJourneyCompleteness(matrix, journeyIds, errors, warnings) {
  for (const [resource, row] of Object.entries(matrix.matrix)) {
    for (const journey of journeyIds) {
      if (!row[journey]) {
        errors.push(
          `[journey-missing] ${resource} has no ${journey} cell — every row needs J1–J10.`
        )
      }
    }
    for (const key of Object.keys(row)) {
      if (!journeyIds.includes(key)) {
        warnings.push(`[unknown-journey] ${resource}.${key} is not declared in the journeys block.`)
      }
    }
  }
}

/** Checks 3 + 4 — per-cell honesty: missing cells and ghost coveredBy paths. */
function checkCells(matrix, errors, warnings) {
  for (const [resource, row] of Object.entries(matrix.matrix)) {
    for (const [journey, cell] of Object.entries(row)) {
      const id = `${resource}.${journey}`

      if (!STATUSES.has(cell.status)) {
        errors.push(
          `[bad-status] ${id} has status "${cell.status}" (expected covered|partial|missing).`
        )
      }

      if (cell.status === 'missing') {
        if (typeof cell.acceptedGap === 'string' && cell.acceptedGap.trim()) {
          warnings.push(
            `[accepted-gap] ${id} is missing but explicitly accepted: ${cell.acceptedGap}`
          )
        } else {
          errors.push(
            `[missing-cell] ${id} has status "missing" with no acceptedGap — write the test or declare acceptedGap: "<justification>".`
          )
        }
      } else if (cell.acceptedGap) {
        warnings.push(
          `[stale-accepted-gap] ${id} declares acceptedGap but is not missing — drop it.`
        )
      }

      const coveredBy = Array.isArray(cell.coveredBy) ? cell.coveredBy : []
      for (const file of coveredBy) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- CI gate script: coveredBy paths come from the repo-committed matrix
        if (!fs.existsSync(path.join(PROJECT_ROOT, file))) {
          errors.push(`[ghost-coverage] ${id} claims "${file}" but the file does not exist.`)
        }
      }
      if (!coveredBy.length && cell.status !== 'missing' && cell.level !== 'n/a') {
        errors.push(
          `[unbacked-status] ${id} is "${cell.status}" with an empty coveredBy — evidence required.`
        )
      }
    }
  }
}

/**
 * Check 4b — coveredBy-real: a covered/partial cell must cite at least one file
 * that actually mentions the journey's command. Reads each existing coveredBy
 * file once and greps (case-insensitive) for the journey's tokens.
 */
function checkCoveredByReal(matrix, errors) {
  const fileMentions = (file, tokens) => {
    const abs = path.join(PROJECT_ROOT, file)
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CI gate: paths come from the repo-committed matrix
    if (!fs.existsSync(abs)) return false
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CI gate: paths come from the repo-committed matrix
    const content = fs.readFileSync(abs, 'utf-8').toLowerCase()
    return tokens.some((token) => content.includes(token.toLowerCase()))
  }

  for (const [resource, row] of Object.entries(matrix.matrix)) {
    for (const [journey, cell] of Object.entries(row)) {
      if (cell.status !== 'covered' && cell.status !== 'partial') continue
      const tokens = JOURNEY_TOKENS[journey]
      if (!tokens) continue
      const coveredBy = Array.isArray(cell.coveredBy) ? cell.coveredBy : []
      const backed = coveredBy.some((file) => fileMentions(file, tokens))
      if (!backed) {
        errors.push(
          `[stale-coverage-claim] ${resource}.${journey} is "${cell.status}" but none of its coveredBy files mention the journey command (${tokens.join('/')}). Cite a file that actually exercises ${journey}, or downgrade the cell.`
        )
      }
    }
  }
}

/** Check 5 — capability class consistency (versioned-only never deploys). */
function checkClassConsistency(matrix, versionedOnly, errors) {
  const declaredClass = new Map(
    (matrix.resources ?? []).map((r) => [r.resourceType ?? r.id, r.class])
  )

  for (const type of versionedOnly) {
    if (declaredClass.has(type) && declaredClass.get(type) !== 'versioned-only') {
      errors.push(
        `[class-mismatch] "${type}" is VERSIONED_ONLY in version-capability.js but declared class "${declaredClass.get(type)}" in resources.`
      )
    }
    const j8 = matrix.matrix[type]?.J8
    if (j8 && j8.level !== 'n/a') {
      errors.push(
        `[versioned-only-J8] ${type}.J8 must be level "n/a" (versioned-only resources have no deploy journey), got "${j8.level}".`
      )
    }
  }
  for (const [resource, row] of Object.entries(matrix.matrix)) {
    if (!versionedOnly.includes(resource) && row.J8?.level === 'n/a') {
      errors.push(
        `[deployable-J8-na] ${resource}.J8 claims level "n/a" but the resource is deployable (not in RESOURCE_CAPABILITY).`
      )
    }
  }
}

/** Recomputes the summary from the cells: level 'n/a' → na, else the status bucket. */
function computeSummary(matrix, journeyIds) {
  const emptyBuckets = () => ({ covered: 0, partial: 0, missing: 0, na: 0 })
  const totals = emptyBuckets()
  const perJourney = Object.fromEntries(journeyIds.map((j) => [j, emptyBuckets()]))

  for (const row of Object.values(matrix.matrix)) {
    for (const journey of journeyIds) {
      const cell = row[journey]
      if (!cell) continue
      const bucket = cell.level === 'n/a' ? 'na' : cell.status
      if (!(bucket in totals)) continue
      totals[bucket]++
      perJourney[journey][bucket]++
    }
  }
  return { totals, perJourney }
}

/** Check 6 — the stored summary must match the recomputed one. */
function checkSummary(matrix, computed, errors) {
  const stored = matrix.summary ?? {}
  const diffBuckets = (label, expected, actual) => {
    for (const bucket of ['covered', 'partial', 'missing', 'na']) {
      if ((actual?.[bucket] ?? null) !== expected[bucket]) {
        errors.push(
          `[summary-drift] ${label}.${bucket}: matrix says ${actual?.[bucket] ?? 'undefined'}, cells say ${expected[bucket]}.`
        )
      }
    }
  }
  diffBuckets('totals', computed.totals, stored.totals)
  for (const [journey, expected] of Object.entries(computed.perJourney)) {
    diffBuckets(`perJourney.${journey}`, expected, stored.perJourney?.[journey])
  }
}

function printJourneySummary(matrix, computed) {
  const titles = Object.fromEntries((matrix.journeys ?? []).map((j) => [j.id, j.title]))
  console.log('Per-journey coverage (from cells):\n')
  for (const [journey, buckets] of Object.entries(computed.perJourney)) {
    const counts = `covered ${buckets.covered} | partial ${buckets.partial} | missing ${buckets.missing} | n/a ${buckets.na}`
    console.log(`  ${journey.padEnd(4)} ${counts}   ${titles[journey] ?? ''}`)
  }
  const t = computed.totals
  console.log(
    `\n  Totals: covered ${t.covered} | partial ${t.partial} | missing ${t.missing} | n/a ${t.na}\n`
  )
}

function printIssues(errors, warnings) {
  if (errors.length) {
    console.log('ERRORS:\n')
    for (const error of errors) console.log(`  ${error}`)
    console.log('')
  }
  if (warnings.length) {
    console.log('WARNINGS (non-blocking):\n')
    for (const warning of warnings) console.log(`  ${warning}`)
    console.log('')
  }
}

function main() {
  console.log('=== Coverage-Matrix Gate (versioning-test-coverage, task 12.2) ===\n')

  const matrix = loadMatrix()
  const plugged = getPluggedResourceTypes()
  const versionedOnly = getVersionedOnlyTypes()
  const journeyIds = (matrix.journeys ?? []).map((j) => j.id)
  if (!journeyIds.length) {
    console.error('Matrix declares no journeys — nothing to verify.')
    process.exit(2)
  }

  console.log(
    `Plugged resources (RESOURCE_VERSION_ROUTES): ${plugged.length} — ${plugged.join(', ')}`
  )
  console.log(`Versioned-only (RESOURCE_CAPABILITY):        ${versionedOnly.join(', ')}`)
  console.log(`Journeys declared:                           ${journeyIds.join(', ')}\n`)

  const errors = []
  const warnings = []

  checkPluggedResources(matrix, plugged, errors, warnings)
  checkJourneyCompleteness(matrix, journeyIds, errors, warnings)
  checkCells(matrix, errors, warnings)
  checkCoveredByReal(matrix, errors)
  checkClassConsistency(matrix, versionedOnly, errors)

  const computed = computeSummary(matrix, journeyIds)
  checkSummary(matrix, computed, errors)

  printJourneySummary(matrix, computed)
  printIssues(errors, warnings)

  if (errors.length) {
    console.error(`Coverage-matrix gate FAILED: ${errors.length} error(s).`)
    process.exit(1)
  }
  console.log(`Coverage-matrix gate PASSED (${warnings.length} warning(s)).`)
}

main()
