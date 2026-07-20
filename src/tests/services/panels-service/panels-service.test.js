import { describe, expect, it, beforeEach, afterAll, vi } from 'vitest'
import {
  validatePanelConfig,
  filterValidCharts,
  loadPanels,
  savePanel,
  updatePanel,
  deletePanel,
  encodePanelForSharing,
  decodePanelFromSharing,
  encodeShareState,
  decodeShareState
} from '@/services/panels-service'

/* global globalThis */

const makeValidPanel = (overrides = {}) => ({
  id: 'custom-test-1',
  label: 'Test Panel',
  icon: 'pi pi-star',
  description: 'A test panel',
  type: 'custom',
  charts: [{ reportId: '356217848089018959' }],
  eventsConfig: null,
  colorScheme: { primary: 'var(--red-400)', secondary: 'var(--text-color-secondary)' },
  ...overrides
})

const mockLocalStorage = () => {
  const store = {}
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value)
    }),
    removeItem: vi.fn((key) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key])
    }),
    _store: store
  }
}

describe('panels-service', () => {
  const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  let storageMock

  beforeEach(() => {
    storageMock = mockLocalStorage()
    Object.defineProperty(globalThis, 'localStorage', {
      value: storageMock,
      writable: true,
      configurable: true
    })
  })

  afterAll(() => {
    if (originalLocalStorageDescriptor) {
      Object.defineProperty(globalThis, 'localStorage', originalLocalStorageDescriptor)
    }
  })

  describe('validatePanelConfig', () => {
    it('should return valid for a correct panel config with charts', () => {
      const result = validatePanelConfig(makeValidPanel())
      expect(result).toEqual({ valid: true, errors: [] })
    })

    it('should return valid for a config with eventsConfig and no charts', () => {
      const result = validatePanelConfig(
        makeValidPanel({
          charts: [],
          eventsConfig: { dataset: 'workloadEvents', defaultFilters: [], defaultSelectedFields: [] }
        })
      )
      expect(result).toEqual({ valid: true, errors: [] })
    })

    it('should reject null config', () => {
      const result = validatePanelConfig(null)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Config must be a non-null object')
    })

    it('should reject config with empty id', () => {
      const result = validatePanelConfig(makeValidPanel({ id: '' }))
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('id must be a non-empty string')
    })

    it('should reject config with empty label', () => {
      const result = validatePanelConfig(makeValidPanel({ label: '' }))
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('label must be a non-empty string')
    })

    it('should reject config with label longer than 50 chars', () => {
      const result = validatePanelConfig(makeValidPanel({ label: 'a'.repeat(51) }))
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('label must be at most 50 characters')
    })

    it('should reject config with invalid type', () => {
      const result = validatePanelConfig(makeValidPanel({ type: 'invalid' }))
      expect(result.valid).toBe(false)
      expect(result.errors).toContain("type must be 'predefined' or 'custom'")
    })

    it('should reject config with no charts and no eventsConfig', () => {
      const result = validatePanelConfig(makeValidPanel({ charts: [], eventsConfig: null }))
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Must have at least one chart or a non-null eventsConfig')
    })

    it('should accept type predefined', () => {
      const result = validatePanelConfig(makeValidPanel({ type: 'predefined' }))
      expect(result.valid).toBe(true)
    })
  })

  describe('filterValidCharts', () => {
    it('should keep charts with valid reportIds', () => {
      const charts = [{ reportId: '356217848089018959' }]
      const result = filterValidCharts(charts)
      expect(result).toEqual(charts)
    })

    it('should remove charts with invalid reportIds', () => {
      const charts = [{ reportId: 'nonexistent-id' }]
      const result = filterValidCharts(charts)
      expect(result).toEqual([])
    })

    it('should preserve order and filter mixed valid/invalid', () => {
      const charts = [
        { reportId: '356217848089018959' },
        { reportId: 'invalid' },
        { reportId: '356220228059791957' }
      ]
      const result = filterValidCharts(charts)
      expect(result).toEqual([
        { reportId: '356217848089018959' },
        { reportId: '356220228059791957' }
      ])
    })

    it('should return empty array for non-array input', () => {
      expect(filterValidCharts(null)).toEqual([])
      expect(filterValidCharts(undefined)).toEqual([])
    })
  })

  describe('loadPanels', () => {
    it('should return predefined panels when localStorage is empty', () => {
      const panels = loadPanels()
      expect(panels.length).toBeGreaterThanOrEqual(3)
      expect(panels.some((panel) => panel.id === 'security')).toBe(true)
      expect(panels.some((panel) => panel.id === 'performance')).toBe(true)
      expect(panels.some((panel) => panel.id === 'edge-functions')).toBe(true)
    })

    it('should include valid custom panels from localStorage', () => {
      const custom = makeValidPanel()
      storageMock._store['rte-custom-panels'] = JSON.stringify([custom])

      const panels = loadPanels()
      expect(panels.some((panel) => panel.id === 'custom-test-1')).toBe(true)
    })

    it('should discard invalid custom panels individually', () => {
      const valid = makeValidPanel()
      const invalid = { id: '', label: '', type: 'bad' }
      storageMock._store['rte-custom-panels'] = JSON.stringify([valid, invalid])

      const panels = loadPanels()
      expect(panels.some((panel) => panel.id === 'custom-test-1')).toBe(true)
    })

    it('should return only predefined panels when localStorage has corrupted JSON', () => {
      storageMock._store['rte-custom-panels'] = 'not-valid-json{{{'

      const panels = loadPanels()
      expect(panels.length).toBeGreaterThanOrEqual(3)
      expect(panels.every((panel) => panel.type === 'predefined')).toBe(true)
    })
  })

  describe('savePanel', () => {
    it('should save a valid panel to localStorage', () => {
      const panel = makeValidPanel()
      savePanel(panel)

      const stored = JSON.parse(storageMock._store['rte-custom-panels'])
      expect(stored).toHaveLength(1)
      expect(stored[0].id).toBe('custom-test-1')
    })

    it('should throw for invalid panel config', () => {
      expect(() => savePanel({ id: '', label: '' })).toThrow('Invalid panel config')
    })

    it('should append to existing panels', () => {
      savePanel(makeValidPanel({ id: 'panel-1' }))
      savePanel(makeValidPanel({ id: 'panel-2' }))

      const stored = JSON.parse(storageMock._store['rte-custom-panels'])
      expect(stored).toHaveLength(2)
    })
  })

  describe('updatePanel', () => {
    it('should update an existing panel', () => {
      savePanel(makeValidPanel({ id: 'panel-1', label: 'Original' }))
      updatePanel('panel-1', { label: 'Updated' })

      const stored = JSON.parse(storageMock._store['rte-custom-panels'])
      expect(stored[0].label).toBe('Updated')
    })

    it('should throw when panel not found', () => {
      expect(() => updatePanel('nonexistent', { label: 'Test' })).toThrow('not found')
    })

    it('should throw when merged config is invalid', () => {
      savePanel(makeValidPanel({ id: 'panel-1' }))
      expect(() => updatePanel('panel-1', { label: '', id: '' })).toThrow('Invalid panel config')
    })
  })

  describe('deletePanel', () => {
    it('should remove a panel by id', () => {
      savePanel(makeValidPanel({ id: 'panel-1' }))
      savePanel(makeValidPanel({ id: 'panel-2' }))
      deletePanel('panel-1')

      const stored = JSON.parse(storageMock._store['rte-custom-panels'])
      expect(stored).toHaveLength(1)
      expect(stored[0].id).toBe('panel-2')
    })

    it('should handle deleting non-existent panel gracefully', () => {
      savePanel(makeValidPanel({ id: 'panel-1' }))
      deletePanel('nonexistent')

      const stored = JSON.parse(storageMock._store['rte-custom-panels'])
      expect(stored).toHaveLength(1)
    })
  })

  describe('encodePanelForSharing / decodePanelFromSharing', () => {
    it('should round-trip a valid panel config', () => {
      const panel = makeValidPanel()
      const encoded = encodePanelForSharing(panel)
      const decoded = decodePanelFromSharing(encoded)
      expect(decoded).toEqual(panel)
    })

    it('should return null for invalid base64', () => {
      expect(decodePanelFromSharing('not-valid-base64!!!')).toBeNull()
    })

    it('should return null for valid base64 but invalid panel config', () => {
      const encoded = btoa(JSON.stringify({ id: '' }))
      expect(decodePanelFromSharing(encoded)).toBeNull()
    })
  })

  describe('encodeShareState / decodeShareState', () => {
    it('round-trips a share state with filters and dataset', () => {
      const state = {
        tab: 'custom-1',
        viewState: {
          filters: { fields: [{ field: 'status', operator: 'eq', value: '200' }] },
          dataset: 'workloadEvents',
          pageSize: 50
        }
      }
      const encoded = encodeShareState(state)
      const decoded = decodeShareState(encoded)
      expect(decoded.tab).toBe('custom-1')
      expect(decoded.viewState).toEqual(state.viewState)
      expect(decoded.ver).toBe(1)
    })

    it('returns null for invalid input', () => {
      expect(decodeShareState('not-valid-base64!!!')).toBeNull()
      expect(decodeShareState(btoa('not json'))).toBeNull()
    })

    it('returns null for missing version', () => {
      const encoded = btoa(JSON.stringify({ tab: 'x' }))
      expect(decodeShareState(encoded)).toBeNull()
    })

    it('handles UTF-8 payloads (emojis, non-ASCII)', () => {
      const state = { tab: null, viewState: { label: 'Seçāo 🚀' } }
      const decoded = decodeShareState(encodeShareState(state))
      expect(decoded.viewState.label).toBe('Seçāo 🚀')
    })
  })
})
