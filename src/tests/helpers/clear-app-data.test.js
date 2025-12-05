import { describe, it, expect, beforeEach, vi } from 'vitest'
import { clearAppData } from '@/helpers/clear-app-data'

describe('clearAppData', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('should clear all specified localStorage items', () => {
    const itemsToSet = [
      'account',
      'tableDefinitions',
      'deploy',
      'edgeDNS',
      'solutionCreate',
      'redirectRoute',
      'edge_sql_query_history',
      'edge_sql_current_database',
      'lastModifiedToggled'
    ]

    itemsToSet.forEach((key) => {
      localStorage.setItem(key, JSON.stringify({ test: 'data' }))
    })

    clearAppData()

    itemsToSet.forEach((key) => {
      expect(localStorage.getItem(key)).toBeNull()
    })
  })

  it('should clear items with specific prefixes', () => {
    localStorage.setItem('edge_sql_test', 'data')
    localStorage.setItem('schema_cache_test', 'data')
    localStorage.setItem('other_key', 'data')

    clearAppData()

    expect(localStorage.getItem('edge_sql_test')).toBeNull()
    expect(localStorage.getItem('schema_cache_test')).toBeNull()
  })

  it('should clear sessionStorage', () => {
    sessionStorage.setItem('test', 'data')
    clearAppData()
    expect(sessionStorage.length).toBe(0)
  })

  it('should handle localStorage errors gracefully', () => {
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem')
    removeItemSpy.mockImplementation(() => {
      throw new Error('Storage error')
    })
    expect(() => clearAppData()).not.toThrow()
    removeItemSpy.mockRestore()
  })

  it('should handle sessionStorage errors gracefully', () => {
    const clearSpy = vi.spyOn(Storage.prototype, 'clear')
    clearSpy.mockImplementation(() => {
      throw new Error('Storage error')
    })

    expect(() => clearAppData()).not.toThrow()
    clearSpy.mockRestore()
  })
})
