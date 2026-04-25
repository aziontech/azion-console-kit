import { describe, expect, it } from 'vitest'
import TABS_EVENTS, {
  defaultColumnMapper
} from '@/views/RealTimeEvents/Blocks/constants/tabs-events'

describe('RealTimeEventsModule', () => {
  describe('Tabs events constants', () => {
    it('should be defined', () => {
      expect(TABS_EVENTS).toBeDefined()
    })

    it('should have the correct keys', () => {
      const expectedKeys = [
        'httpRequests',
        'edgeFunctions',
        'edgeFunctionsConsole',
        'imageProcessor',
        'tieredCache',
        'edgeDNS',
        'dataStream',
        'activityHistory'
      ]

      expect(Object.keys(TABS_EVENTS)).toEqual(expectedKeys)
    })

    it('each tab should have the correct structure', () => {
      Object.values(TABS_EVENTS).forEach((tab) => {
        expect(tab).toHaveProperty('panel')
        expect(tab).toHaveProperty('title')
        expect(tab).toHaveProperty('description')
        expect(tab).toHaveProperty('dataset')
        expect(tab).toHaveProperty('tabRouter')
        expect(tab).toHaveProperty('availableFields')
        expect(tab).toHaveProperty('defaultSelectedFields')
      })
    })

    it('tabs should not have per-dataset customColumnMapper or index properties', () => {
      Object.values(TABS_EVENTS).forEach((tab) => {
        expect(tab).not.toHaveProperty('customColumnMapper')
        expect(tab).not.toHaveProperty('index')
      })
    })

    it('should have the correct number of tabs', () => {
      expect(Object.keys(TABS_EVENTS).length).toBe(8)
    })

    it('httpRequests tab should have the correct properties', () => {
      const httpRequests = TABS_EVENTS.httpRequests
      expect(httpRequests.panel).toBe('httpRequests')
      expect(httpRequests.title).toBe('HTTP Requests')
      expect(httpRequests.dataset).toBe('workloadEvents')
      expect(httpRequests.tabRouter).toBe('http-requests')
      expect(httpRequests.availableFields.length).toBeGreaterThan(0)
    })

    it('each tab should have availableFields as a non-empty array', () => {
      Object.values(TABS_EVENTS).forEach((tab) => {
        expect(Array.isArray(tab.availableFields)).toBe(true)
        expect(tab.availableFields.length).toBeGreaterThan(0)
      })
    })
  })

  describe('defaultColumnMapper', () => {
    it('should return the correct structure', () => {
      const result = defaultColumnMapper({ data: 'test' })
      expect(result).toHaveProperty('tsFormat')
      expect(result).toHaveProperty('summary')
    })

    it('should map rowData.data to both tsFormat and summary', () => {
      const testData = [{ key: 'host', value: 'example.com' }]
      const result = defaultColumnMapper({ data: testData })
      expect(result.tsFormat).toBe(testData)
      expect(result.summary).toBe(testData)
    })
  })
})
