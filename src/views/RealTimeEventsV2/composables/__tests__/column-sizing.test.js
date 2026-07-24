import { describe, it, expect } from 'vitest'
import {
  classifyField,
  distributeColumnWidths,
  minColumnWidth,
  COLUMN_CLASS_WIDTHS
} from '../column-sizing'

const LEAD = 40 + 185 // chevron + time

describe('column-sizing — classifyField', () => {
  it.each([
    ['requestUri', 'wide'],
    ['httpReferer', 'wide'],
    ['httpUserAgent', 'wide'],
    ['host', 'wide'],
    ['status', 'narrow'],
    ['requestMethod', 'narrow'],
    ['requestTime', 'narrow'],
    ['scheme', 'narrow'],
    ['debugLog', 'narrow'],
    ['remoteAddress', 'medium'],
    ['geolocCountryName', 'medium'],
    ['configurationId', 'medium']
  ])('classifies %s as %s', (field, expected) => {
    expect(classifyField(field)).toBe(expected)
  })

  it('falls back to heuristics for unknown dataset-specific names', () => {
    expect(classifyField('upstreamCacheStatus')).toBe('narrow') // *status suffix
    expect(classifyField('originUrl')).toBe('wide') // url hint
    expect(classifyField('somethingElse')).toBe('medium')
  })
})

describe('column-sizing — distributeColumnWidths', () => {
  it('wide fields absorb ALL the leftover space; narrow fields stay compact', () => {
    const widths = distributeColumnWidths({
      availableWidth: 1600,
      fields: ['status', 'requestUri', 'requestMethod'],
      fixedLeadWidth: LEAD
    })
    expect(widths.status).toBe(COLUMN_CLASS_WIDTHS.narrow.base)
    expect(widths.requestMethod).toBe(COLUMN_CLASS_WIDTHS.narrow.base)
    // requestUri takes everything else: 1600 - 225 - 110 - 110 = 1155
    expect(widths.requestUri).toBe(1600 - LEAD - 110 - 110)
    // Full consumption: fixed layout gets no extra space to re-distribute.
    const total = LEAD + widths.status + widths.requestUri + widths.requestMethod
    expect(total).toBe(1600)
  })

  it('splits the leftover equally among multiple wide fields (±1px remainder)', () => {
    const widths = distributeColumnWidths({
      availableWidth: 1605,
      fields: ['requestUri', 'httpReferer'],
      fixedLeadWidth: LEAD
    })
    expect(Math.abs(widths.requestUri - widths.httpReferer)).toBeLessThanOrEqual(1)
    expect(LEAD + widths.requestUri + widths.httpReferer).toBe(1605)
  })

  it('clamps wide fields at their base when space is short (h-scroll instead of collapse)', () => {
    const widths = distributeColumnWidths({
      availableWidth: 500, // less than lead + bases
      fields: ['requestUri', 'status'],
      fixedLeadWidth: LEAD
    })
    expect(widths.requestUri).toBe(COLUMN_CLASS_WIDTHS.wide.base)
    expect(widths.status).toBe(COLUMN_CLASS_WIDTHS.narrow.base)
  })

  it('honors a drag-resized override and excludes it from the auto pool', () => {
    const widths = distributeColumnWidths({
      availableWidth: 1600,
      fields: ['requestUri', 'httpReferer'],
      userWidths: { requestUri: 300 },
      fixedLeadWidth: LEAD
    })
    expect(widths.requestUri).toBe(300)
    // httpReferer (the only auto wide) absorbs the rest.
    expect(widths.httpReferer).toBe(1600 - LEAD - 300)
  })

  it('tops up medium fields (capped) when no wide field is selected', () => {
    const widths = distributeColumnWidths({
      availableWidth: 1600,
      fields: ['remoteAddress', 'status'],
      fixedLeadWidth: LEAD
    })
    expect(widths.status).toBe(COLUMN_CLASS_WIDTHS.narrow.base)
    // medium base + capped top-up, never ballooning across the whole screen
    expect(widths.remoteAddress).toBeGreaterThan(COLUMN_CLASS_WIDTHS.medium.base)
    expect(widths.remoteAddress).toBeLessThanOrEqual(COLUMN_CLASS_WIDTHS.medium.base + 160)
  })

  it('returns empty for no fields (Document-column mode)', () => {
    expect(
      distributeColumnWidths({ availableWidth: 1600, fields: [], fixedLeadWidth: LEAD })
    ).toEqual({})
  })

  it('unmeasured viewport (0) falls back to base widths without negatives', () => {
    const widths = distributeColumnWidths({
      availableWidth: 0,
      fields: ['requestUri', 'status'],
      fixedLeadWidth: LEAD
    })
    expect(widths.requestUri).toBe(COLUMN_CLASS_WIDTHS.wide.base)
    expect(widths.status).toBe(COLUMN_CLASS_WIDTHS.narrow.base)
  })
})

describe('column-sizing — minColumnWidth', () => {
  it('uses the class min, and the drag override when present', () => {
    expect(minColumnWidth('requestUri')).toBe(COLUMN_CLASS_WIDTHS.wide.min)
    expect(minColumnWidth('status')).toBe(COLUMN_CLASS_WIDTHS.narrow.min)
    expect(minColumnWidth('requestUri', { requestUri: 320 })).toBe(320)
  })
})
