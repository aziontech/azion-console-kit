import { describe, expect, it } from 'vitest'
import TABS_EVENTS from '@/views/RealTimeEvents/Blocks/constants/tabs-events'

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
        expect(tab).toHaveProperty('index')
        expect(tab).toHaveProperty('title')
        expect(tab).toHaveProperty('description')
        expect(tab).toHaveProperty('dataset')
        expect(tab).toHaveProperty('tabRouter')
        expect(tab).toHaveProperty('availableFields')
        expect(tab).toHaveProperty('defaultSelectedFields')
        expect(tab).toHaveProperty('customColumnMapper')
      })
    })

    it('customColumnMapper should return the correct structure', () => {
      Object.values(TABS_EVENTS).forEach((tab) => {
        const result = tab.customColumnMapper({ data: 'test' })
        expect(result).toHaveProperty('tsFormat')
        expect(result).toHaveProperty('summary')
      })
    })

    it('should have the correct number of tabs', () => {
      expect(Object.keys(TABS_EVENTS).length).toBe(8)
    })

    it('httpRequests tab should have the correct properties', () => {
      const httpRequests = TABS_EVENTS.httpRequests
      expect(httpRequests.panel).toBe('httpRequests')
      expect(httpRequests.index).toBe(0)
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
})
