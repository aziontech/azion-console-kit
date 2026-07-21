import { describe, it, expect } from 'vitest'
import { createVersionAdapter, stripUndefinedDeep } from '@/services/v2/versioning/version-adapter'

/**
 * Task 5.5 — `referenceCount` is normalized by the SHARED adapter factory so
 * every resource inherits it without a fork. It is INFORMATIVE only: present
 * when the API exposes `reference_count` (e.g. Edge Function), `null` when the
 * API omits it (Network List / WAF). `meta.reference_count` wins over the flat
 * key, mirroring the precedence of the other version fields (Req 3.3, 5.2).
 */

const adapter = createVersionAdapter()

describe('createVersionAdapter — referenceCount normalization', () => {
  it('reads reference_count from the flat payload', () => {
    const version = adapter.normalizeVersion({ version_id: 'v1', reference_count: 3 })
    expect(version.referenceCount).toBe(3)
  })

  it('reads reference_count from meta with precedence over the flat key', () => {
    const version = adapter.normalizeVersion({
      version_id: 'v1',
      reference_count: 1,
      meta: { version_id: 'v1', reference_count: 9 }
    })
    expect(version.referenceCount).toBe(9)
  })

  it('falls back to null when the API omits the count (Network List / WAF)', () => {
    const version = adapter.normalizeVersion({ version_id: 'v1' })
    expect(version.referenceCount).toBeNull()
  })

  it('keeps a real zero count instead of coercing it to null', () => {
    const version = adapter.normalizeVersion({ version_id: 'v1', reference_count: 0 })
    expect(version.referenceCount).toBe(0)
  })

  it('carries referenceCount through transformListVersions for every row', () => {
    const { body } = adapter.transformListVersions([
      { version_id: 'v1', reference_count: 2 },
      { version_id: 'v2' }
    ])
    expect(body.map((entry) => entry.referenceCount)).toEqual([2, null])
  })

  it('carries referenceCount through transformLoadVersion (data envelope)', () => {
    const version = adapter.transformLoadVersion({ data: { version_id: 'v1', reference_count: 5 } })
    expect(version.referenceCount).toBe(5)
  })
})

describe('createVersionAdapter — state normalization', () => {
  it('reads meta.version_state when the flat version_state is null', () => {
    const version = adapter.normalizeVersion({
      id: 77155,
      version_id: null,
      version_state: null,
      meta: { version_id: 'ATNI2BJ9', version_state: 'ready' }
    })
    expect(version.id).toBe('ATNI2BJ9')
    expect(version.state).toBe('ready')
  })

  it('prefers meta.version_state over the flat keys', () => {
    const version = adapter.normalizeVersion({
      version_id: 'v1',
      version_state: 'draft',
      state: 'draft',
      meta: { version_id: 'v1', version_state: 'ready' }
    })
    expect(version.state).toBe('ready')
  })

  it('falls back to the flat version_state, then state, when meta is absent', () => {
    expect(adapter.normalizeVersion({ version_id: 'v1', version_state: 'building' }).state).toBe(
      'building'
    )
    expect(adapter.normalizeVersion({ version_id: 'v1', state: 'ready' }).state).toBe('ready')
  })

  it('still honors meta.state for endpoints that expose it', () => {
    const version = adapter.normalizeVersion({
      version_id: 'v1',
      meta: { version_id: 'v1', state: 'archived' }
    })
    expect(version.state).toBe('archived')
  })
})

/**
 * `normalizeVersion` resolves every field through a `??` fallback chain (source
 * lines ~36-49). `??` only falls through on `null`/`undefined`, so a falsy-but-
 * present value (`''`, `0`, `false`) must STOP the chain. This table exercises
 * each tie-break level of each chain in isolation: a case where ONLY level N is
 * present (higher levels null or absent) plus a case proving a falsy value at a
 * level is NOT skipped. Req 3.3, 5.2.
 */
describe('normalizeVersion — fallback precedence chains', () => {
  const cases = [
    // id: meta.version_id -> raw.version_id -> raw.id
    ['id: meta.version_id wins', { meta: { version_id: 'M' }, version_id: 'F', id: 1 }, 'id', 'M'],
    [
      'id: raw.version_id when meta.version_id is null',
      { meta: { version_id: null }, version_id: 'F', id: 1 },
      'id',
      'F'
    ],
    ['id: raw.version_id when meta absent', { version_id: 'F', id: 1 }, 'id', 'F'],
    ['id: raw.id when version_id is null', { version_id: null, id: 1 }, 'id', 1],
    ['id: raw.id when version_id absent', { id: 1 }, 'id', 1],
    [
      'id: empty-string version_id does NOT fall through to id',
      { version_id: '', id: 1 },
      'id',
      ''
    ],

    // state: meta.version_state -> meta.state -> raw.version_state -> raw.state
    [
      'state: meta.version_state wins',
      { meta: { version_state: 'A', state: 'B' }, version_state: 'C', state: 'D' },
      'state',
      'A'
    ],
    [
      'state: meta.state when meta.version_state is null',
      { meta: { version_state: null, state: 'B' }, version_state: 'C', state: 'D' },
      'state',
      'B'
    ],
    [
      'state: raw.version_state when both meta.* are null',
      { meta: { version_state: null, state: null }, version_state: 'C', state: 'D' },
      'state',
      'C'
    ],
    ['state: raw.version_state when meta absent', { version_state: 'C', state: 'D' }, 'state', 'C'],
    [
      'state: raw.state when version_state is null',
      { version_state: null, state: 'D' },
      'state',
      'D'
    ],
    ['state: raw.state when version_state absent', { state: 'D' }, 'state', 'D'],
    [
      'state: empty-string version_state does NOT fall through to state',
      { version_state: '', state: 'D' },
      'state',
      ''
    ],

    // version: meta.version -> raw.version -> null
    ['version: meta.version wins', { meta: { version: 2 }, version: 3 }, 'version', 2],
    [
      'version: raw.version when meta.version is null',
      { meta: { version: null }, version: 3 },
      'version',
      3
    ],
    ['version: raw.version when meta absent', { version: 3 }, 'version', 3],
    ['version: null terminal when all absent', { version_id: 'v' }, 'version', null],
    ['version: zero does NOT fall through to null', { version: 0 }, 'version', 0],

    // comment: meta.description -> raw.description -> raw.comment -> ''
    [
      'comment: meta.description wins',
      { meta: { description: 'A' }, description: 'B', comment: 'C' },
      'comment',
      'A'
    ],
    [
      'comment: raw.description when meta.description is null',
      { meta: { description: null }, description: 'B', comment: 'C' },
      'comment',
      'B'
    ],
    [
      'comment: raw.description when meta absent',
      { description: 'B', comment: 'C' },
      'comment',
      'B'
    ],
    [
      'comment: raw.comment when description is null',
      { description: null, comment: 'C' },
      'comment',
      'C'
    ],
    ['comment: raw.comment when description absent', { comment: 'C' }, 'comment', 'C'],
    ["comment: '' terminal default when all absent", { version_id: 'v' }, 'comment', ''],
    [
      'comment: empty-string description does NOT fall through to comment',
      { description: '', comment: 'C' },
      'comment',
      ''
    ],

    // createdAt: meta.created_at -> raw.created_at -> null
    [
      'createdAt: meta.created_at wins',
      { meta: { created_at: 'm' }, created_at: 'r' },
      'createdAt',
      'm'
    ],
    [
      'createdAt: raw.created_at when meta.created_at is null',
      { meta: { created_at: null }, created_at: 'r' },
      'createdAt',
      'r'
    ],
    ['createdAt: raw.created_at when meta absent', { created_at: 'r' }, 'createdAt', 'r'],
    ['createdAt: null terminal when all absent', { version_id: 'v' }, 'createdAt', null],

    // readyAt: meta.ready_at -> raw.ready_at -> null
    ['readyAt: meta.ready_at wins', { meta: { ready_at: 'm' }, ready_at: 'r' }, 'readyAt', 'm'],
    [
      'readyAt: raw.ready_at when meta.ready_at is null',
      { meta: { ready_at: null }, ready_at: 'r' },
      'readyAt',
      'r'
    ],
    ['readyAt: raw.ready_at when meta absent', { ready_at: 'r' }, 'readyAt', 'r'],
    ['readyAt: null terminal when all absent', { version_id: 'v' }, 'readyAt', null],

    // lastModified: meta.last_modified -> raw.last_modified -> raw.ready_at -> raw.created_at -> null
    [
      'lastModified: meta.last_modified wins over all 3 flat keys',
      { meta: { last_modified: 'm' }, last_modified: 'lm', ready_at: 'ra', created_at: 'ca' },
      'lastModified',
      'm'
    ],
    [
      'lastModified: raw.last_modified when meta.last_modified is null',
      { meta: { last_modified: null }, last_modified: 'lm', ready_at: 'ra', created_at: 'ca' },
      'lastModified',
      'lm'
    ],
    [
      'lastModified: raw.last_modified when meta absent',
      { last_modified: 'lm', ready_at: 'ra', created_at: 'ca' },
      'lastModified',
      'lm'
    ],
    [
      'lastModified: raw.ready_at when last_modified is null',
      { last_modified: null, ready_at: 'ra', created_at: 'ca' },
      'lastModified',
      'ra'
    ],
    [
      'lastModified: raw.ready_at when last_modified absent',
      { ready_at: 'ra', created_at: 'ca' },
      'lastModified',
      'ra'
    ],
    [
      'lastModified: raw.created_at when ready_at is null',
      { ready_at: null, created_at: 'ca' },
      'lastModified',
      'ca'
    ],
    [
      'lastModified: raw.created_at when ready_at absent',
      { created_at: 'ca' },
      'lastModified',
      'ca'
    ],
    ['lastModified: null terminal when all 4 absent', { version_id: 'v' }, 'lastModified', null],

    // lastEditor: meta.last_editor -> raw.last_editor -> null
    [
      'lastEditor: meta.last_editor wins',
      { meta: { last_editor: 'm' }, last_editor: 'r' },
      'lastEditor',
      'm'
    ],
    [
      'lastEditor: raw.last_editor when meta.last_editor is null',
      { meta: { last_editor: null }, last_editor: 'r' },
      'lastEditor',
      'r'
    ],
    ['lastEditor: raw.last_editor when meta absent', { last_editor: 'r' }, 'lastEditor', 'r'],
    ['lastEditor: null terminal when all absent', { version_id: 'v' }, 'lastEditor', null],

    // sourceVersionId: meta.source_version_id -> raw.source_version_id -> null
    [
      'sourceVersionId: meta.source_version_id wins',
      { meta: { source_version_id: 'm' }, source_version_id: 'r' },
      'sourceVersionId',
      'm'
    ],
    [
      'sourceVersionId: raw.source_version_id when meta.source_version_id is null',
      { meta: { source_version_id: null }, source_version_id: 'r' },
      'sourceVersionId',
      'r'
    ],
    [
      'sourceVersionId: raw.source_version_id when meta absent',
      { source_version_id: 'r' },
      'sourceVersionId',
      'r'
    ],
    [
      'sourceVersionId: null terminal when all absent',
      { version_id: 'v' },
      'sourceVersionId',
      null
    ],

    // referenceCount: meta.reference_count -> raw.reference_count -> null
    [
      'referenceCount: meta.reference_count wins',
      { meta: { reference_count: 9 }, reference_count: 1 },
      'referenceCount',
      9
    ],
    [
      'referenceCount: raw.reference_count when meta.reference_count is null',
      { meta: { reference_count: null }, reference_count: 1 },
      'referenceCount',
      1
    ],
    [
      'referenceCount: raw.reference_count when meta absent',
      { reference_count: 1 },
      'referenceCount',
      1
    ],
    ['referenceCount: null terminal when all absent', { version_id: 'v' }, 'referenceCount', null],
    [
      'referenceCount: zero does NOT fall through to null',
      { reference_count: 0 },
      'referenceCount',
      0
    ]
  ]

  it.each(cases)('%s', (_name, raw, field, expected) => {
    expect(adapter.normalizeVersion(raw)[field]).toBe(expected)
  })
})

describe('normalizeVersion — non-object / falsy raw is returned verbatim', () => {
  // Guards the `if (!raw || typeof raw !== 'object') return raw` short-circuit:
  // a primitive or null must pass straight through (no meta/field reads).
  it('returns null unchanged', () => {
    expect(adapter.normalizeVersion(null)).toBeNull()
  })

  it('returns undefined unchanged', () => {
    expect(adapter.normalizeVersion(undefined)).toBeUndefined()
  })

  it('returns a string primitive unchanged (not wrapped into a version object)', () => {
    expect(adapter.normalizeVersion('not-an-object')).toBe('not-an-object')
  })

  it('returns a number primitive unchanged', () => {
    expect(adapter.normalizeVersion(42)).toBe(42)
  })
})

describe('createVersionAdapter — factory fallbacks (toConfig / mapMeta / mapResourceFields)', () => {
  it('toConfig defaults to an empty object, so config is {} when no normalizeConfig is given', () => {
    const version = createVersionAdapter().normalizeVersion({ version_id: 'v' })
    expect(version.config).toEqual({})
  })

  it('mapMeta, when provided, merges extra meta fields onto the normalized version', () => {
    const withMeta = createVersionAdapter({
      mapMeta: (raw) => ({ deploymentId: raw.deployment_id })
    })
    const version = withMeta.normalizeVersion({ version_id: 'v', deployment_id: 'dep-1' })
    expect(version.deploymentId).toBe('dep-1')
  })

  it('omits extra meta fields when no mapMeta is given (base meta only)', () => {
    const version = createVersionAdapter().normalizeVersion({ version_id: 'v', deployment_id: 'x' })
    expect(version).not.toHaveProperty('deploymentId')
  })

  it('mapResourceFields defaults to an empty object, so a draft payload carries only comment/source', () => {
    // Default adapter: toFields() returns {} which strips to undefined, so the
    // payload is exactly the explicit comment/source_version keys.
    const payload = createVersionAdapter().transformDraftPayload({ comment: 'c' })
    expect(payload).toStrictEqual({ comment: 'c' })
  })
})

describe('transformDraftPayload — comment/source at the root (clean adapter)', () => {
  // Default adapter (no mapResourceFields) so comment/source come ONLY from the
  // explicit branches, not echoed back through mapResourceFields.
  const clean = createVersionAdapter()

  it('writes comment and source_version when defined', () => {
    expect(clean.transformDraftPayload({ comment: 'c', sourceVersionId: 's' })).toStrictEqual({
      comment: 'c',
      source_version: 's'
    })
  })

  it('omits comment and source_version when undefined', () => {
    expect(clean.transformDraftPayload({})).toStrictEqual({})
  })

  it('keeps a defined empty-string comment (undefined check, not truthiness)', () => {
    expect(clean.transformDraftPayload({ comment: '' })).toStrictEqual({ comment: '' })
  })
})

describe('transformCreateDraftPayload — isDefined boundary + mapped fields', () => {
  const withFields = createVersionAdapter({
    mapResourceFields: (body) => ({ settings: body.settings })
  })

  it('includes source_version and comment when both are defined', () => {
    expect(
      createVersionAdapter().transformCreateDraftPayload({ sourceVersionId: 's', comment: 'c' })
    ).toStrictEqual({ source_version: 's', comment: 'c' })
  })

  it('drops null values (isDefined excludes null, not just undefined)', () => {
    expect(
      createVersionAdapter().transformCreateDraftPayload({ sourceVersionId: null, comment: null })
    ).toStrictEqual({})
  })

  it('drops undefined values (no key with an undefined value leaks out)', () => {
    expect(createVersionAdapter().transformCreateDraftPayload({})).toStrictEqual({})
  })

  it('keeps a defined empty-string comment', () => {
    expect(createVersionAdapter().transformCreateDraftPayload({ comment: '' })).toStrictEqual({
      comment: ''
    })
  })

  it('merges stripped mapped fields into the payload when present', () => {
    expect(withFields.transformCreateDraftPayload({ settings: { retries: 2 } })).toStrictEqual({
      settings: { retries: 2 }
    })
  })

  it('omits the mapped fields when they strip to nothing', () => {
    expect(withFields.transformCreateDraftPayload({})).toStrictEqual({})
  })
})

describe('transformBuildPayload — isDefined boundary for trace_id/comment', () => {
  const adapterBuild = createVersionAdapter()

  it('includes trace_id and comment when defined', () => {
    expect(adapterBuild.transformBuildPayload({ trace_id: 't', comment: 'c' })).toStrictEqual({
      trace_id: 't',
      comment: 'c'
    })
  })

  it('drops null trace_id/comment', () => {
    expect(adapterBuild.transformBuildPayload({ trace_id: null, comment: null })).toStrictEqual({})
  })

  it('drops undefined trace_id/comment (default empty args)', () => {
    expect(adapterBuild.transformBuildPayload()).toStrictEqual({})
  })

  it('keeps a defined empty-string comment', () => {
    expect(adapterBuild.transformBuildPayload({ comment: '' })).toStrictEqual({ comment: '' })
  })
})

describe('transformArchivePayload — passes the comment through', () => {
  it('returns an object carrying the given comment', () => {
    expect(adapter.transformArchivePayload({ comment: 'archived' })).toStrictEqual({
      comment: 'archived'
    })
  })
})

describe('transformListVersions — falsy input and non-array envelopes', () => {
  it('returns an empty page for null', () => {
    expect(adapter.transformListVersions(null)).toStrictEqual({ count: 0, body: [] })
  })

  it('returns an empty page for undefined', () => {
    expect(adapter.transformListVersions(undefined)).toStrictEqual({ count: 0, body: [] })
  })

  it('yields an empty body when the source has no results array, honoring source.count', () => {
    expect(adapter.transformListVersions({ count: 5 })).toStrictEqual({ count: 5, body: [] })
  })

  it('falls back to results.length when count is not a number', () => {
    const { count, body } = adapter.transformListVersions([{ version_id: 'v1' }])
    expect(count).toBe(1)
    expect(body).toHaveLength(1)
  })
})

describe('stripUndefinedDeep', () => {
  it('removes only undefined keys, preserving null values verbatim', () => {
    expect(stripUndefinedDeep({ one: 1, gone: undefined, nothing: null })).toEqual({
      one: 1,
      nothing: null
    })
  })

  it('recurses into arrays: drops undefined entries and cleans each item', () => {
    const input = { items: [1, undefined, null, { keep: 2, gone: undefined }] }
    const result = stripUndefinedDeep(input)
    // The undefined entry is removed; null is preserved; the object item keeps its
    // defined field and loses `gone`. (Before the fix the array was opaque, so the
    // in-array `undefined` leaked to the wire as `null` via JSON.stringify.)
    expect(result.items).toEqual([1, null, { keep: 2 }])
  })

  it('drops an array item that collapses to an empty object', () => {
    // Each item is cleaned recursively; an object whose only field is undefined
    // collapses to undefined and is then filtered out of the array.
    expect(stripUndefinedDeep({ items: [{ gone: undefined }, { keep: 1 }] })).toEqual({
      items: [{ keep: 1 }]
    })
  })

  it('keeps an empty array as an empty array (arrays never collapse to undefined)', () => {
    // Only OBJECTS collapse to undefined when empty; an array stays a (possibly
    // empty) array so callers still send `[]` rather than dropping the key.
    expect(stripUndefinedDeep({ items: [] })).toEqual({ items: [] })
    expect(stripUndefinedDeep({ items: [undefined, undefined] })).toEqual({ items: [] })
  })

  it('cleans undefined nested at any depth inside arrays', () => {
    const input = { rules: [{ criteria: [{ op: 'eq', val: undefined }, undefined] }] }
    expect(stripUndefinedDeep(input)).toEqual({ rules: [{ criteria: [{ op: 'eq' }] }] })
  })

  it('recurses into nested objects and collapses an all-undefined branch to undefined', () => {
    expect(
      stripUndefinedDeep({ keep: { one: 1, gone: undefined }, drop: { gone: undefined } })
    ).toEqual({ keep: { one: 1 } })
  })

  it('returns undefined for an object that becomes empty after stripping', () => {
    expect(stripUndefinedDeep({ gone: undefined })).toBeUndefined()
    expect(stripUndefinedDeep({})).toBeUndefined()
  })

  it('passes primitives and null through unchanged', () => {
    expect(stripUndefinedDeep(undefined)).toBeUndefined()
    expect(stripUndefinedDeep(null)).toBeNull()
    expect(stripUndefinedDeep(5)).toBe(5)
    expect(stripUndefinedDeep('literal')).toBe('literal')
  })

  it('cleans a top-level array: drops undefined entries, keeps null', () => {
    expect(stripUndefinedDeep([1, undefined, null])).toEqual([1, null])
  })
})
