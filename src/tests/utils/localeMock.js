import { vi } from 'vitest'

const localeMock = (locale = 'en') => {
  const DateTimeFormat = Intl.DateTimeFormat
   vi
  .spyOn(window.global.Intl, 'DateTimeFormat')
  .mockImplementationOnce((_, options) => DateTimeFormat(locale, {...options}))
}

export { localeMock }