import { vi } from 'vitest'

export const createMockService = (methods = {}) => {
  const mocks = {}
  for (const [name, returnValue] of Object.entries(methods)) {
    mocks[name] = vi.fn(() =>
      typeof returnValue === 'function' ? returnValue() : Promise.resolve(returnValue)
    )
  }
  return mocks
}

export const resetMockService = (service) => {
  for (const fn of Object.values(service)) {
    if (typeof fn?.mockReset === 'function') fn.mockReset()
  }
}
