import { vi } from 'vitest'

const localeMock = (locale = 'en') => {
  const DateTimeFormat = Intl.DateTimeFormat
  // vitest 4 invokes mock implementations with `new` when the spied function
  // is constructed (new Intl.DateTimeFormat(...)); arrow functions are not
  // constructible, so use a regular function that returns the instance.
  vi.spyOn(window.global.Intl, 'DateTimeFormat').mockImplementation(function (__, options) {
    return DateTimeFormat(locale, { ...options })
  })
}

export { localeMock }
