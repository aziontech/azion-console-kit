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
        expect(tab).toHaveProperty('columns')
        expect(tab).toHaveProperty('customColumnMapper')
      })
    })

    it('columns should have the correct structure', () => {
      Object.values(TABS_EVENTS).forEach((tab) => {
        tab.columns.forEach((column) => {
          expect(column).toHaveProperty('field')
          expect(column).toHaveProperty('header')
        })
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
      expect(httpRequests.dataset).toBe('httpEvents')
      expect(httpRequests.tabRouter).toBe('http-requests')
      expect(httpRequests.columns.length).toBe(6)
    })

    it('should have the correct columns for each tab', () => {
      const expectedColumns = {
        httpRequests: [
          'tsFormat',
          'configurationId',
          'host',
          'requestMethod',
          'status',
          'requestUri'
        ],
        edgeFunctions: [
          'tsFormat',
          'configurationId',
          'functionLanguage',
          'edgeFunctionsInitiatorTypeList',
          'edgeFunctionsList',
          'edgeFunctionsTime'
        ],
        edgeFunctionsConsole: [
          'tsFormat',
          'configurationId',
          'functionId',
          'lineSource',
          'level',
          'line'
        ],
        imageProcessor: [
          'tsFormat',
          'configurationId',
          'host',
          'status',
          'bytesSent',
          'requestUri'
        ],
        tieredCache: [
          'tsFormat',
          'configurationId',
          'host',
          'requestMethod',
          'upstreamCacheStatus',
          'requestUri'
        ],
        edgeDNS: ['tsFormat', 'level', 'zoneId', 'qtype', 'resolutionType', 'solutionId'],
        dataStream: ['tsFormat', 'configurationId', 'jobName', 'endpointType', 'url', 'statusCode'],
        activityHistory: ['tsFormat', 'userIp', 'authorName', 'title', 'resourceType', 'resourceId']
      }

      Object.entries(TABS_EVENTS).forEach(([tabName, tabData]) => {
        const actualColumns = tabData.columns.map((column) => column.field)
        expect(actualColumns).toEqual(expectedColumns[tabName])
      })
    })

    it('should have tsFormat field with sortField set to "ts" in all tabs', () => {
      Object.values(TABS_EVENTS).forEach((tabData) => {
        const tsFormatColumn = tabData.columns.find((column) => column.field === 'tsFormat')
        expect(tsFormatColumn).toBeDefined()
        expect(tsFormatColumn.field).toBe('tsFormat')
        expect(tsFormatColumn.header).toBe('TS')
      })
    })
  })
})
