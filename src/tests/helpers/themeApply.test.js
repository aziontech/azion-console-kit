import { themeApply } from '@/helpers/theme-apply'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const makeSut = ({ matchesSystemThemeDark }) => {
  const sut = themeApply

  vi.spyOn(window, 'matchMedia').mockReturnValueOnce({
    matches: matchesSystemThemeDark
  })

  const rootElementMock = document.createElement('div')
  rootElementMock.classList.add(`azion-light`)
  vi.spyOn(document, 'querySelector').mockReturnValueOnce(rootElementMock)

  return {
    sut,
    rootElementMock
  }
}

describe('themeApply', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    {
      useSystemInDarkMode: true,
      result: 'azion-dark'
    },
    {
      useSystemInDarkMode: false,
      result: 'azion-light'
    }
  ])(
    'should define theme as $result when system theme is $useSystemInDarkMode for dark mode',
    ({ useSystemInDarkMode, result }) => {
      const { rootElementMock, sut } = makeSut({
        matchesSystemThemeDark: useSystemInDarkMode
      })

      vi.spyOn(document, 'querySelector').mockReturnValue(rootElementMock)

      sut('system')

      expect(rootElementMock.classList.contains('azion')).toBe(true)
      expect(rootElementMock.classList.contains(result)).toBe(true)
    }
  )

  it.each([
    {
      matchesSystemThemeDark: true,
      selectedTheme: 'dark',
      result: 'azion-dark'
    },
    {
      matchesSystemThemeDark: true,
      selectedTheme: 'light',
      result: 'azion-light'
    },
    {
      matchesSystemThemeDark: false,
      selectedTheme: undefined,
      result: 'azion-light'
    },
    {
      matchesSystemThemeDark: true,
      selectedTheme: undefined,
      result: 'azion-dark'
    }
  ])(
    `should change application theme when $selectedTheme to $result`,
    ({ selectedTheme, matchesSystemThemeDark, result }) => {
      const { sut, rootElementMock } = makeSut({
        matchesSystemThemeDark
      })
      sut(selectedTheme)

      expect(rootElementMock.classList.contains('azion')).toBe(true)
      expect(rootElementMock.classList.contains(result)).toBe(true)
    }
  )
})
