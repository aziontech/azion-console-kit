import { themeSelect } from '@/helpers/theme-select'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const makeSut = ({ matchesSystemThemeDark, initialTheme }) => {
  const sut = themeSelect
  vi.spyOn(window, 'matchMedia').mockReturnValueOnce({
    matches: matchesSystemThemeDark
  })
  const rootElementMock = document.createElement('div')
  rootElementMock.classList.add(`azion-${initialTheme}`)
  vi.spyOn(document, 'querySelector').mockReturnValueOnce(rootElementMock)

  return {
    sut,
    rootElementMock
  }
}

describe('themeSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    {
      useSystemInDarkMode: true,
      initialTheme: 'light',
      result: 'dark'
    },
    {
      useSystemInDarkMode: false,
      initialTheme: 'light',
      result: 'light'
    }
  ])(
    'should define theme as $result when system theme is $useSystemInDarkMode for dark mode',
    ({ useSystemInDarkMode, initialTheme, result }) => {
      const { sut, rootElementMock } = makeSut({
        matchesSystemThemeDark: useSystemInDarkMode,
        initialTheme: initialTheme
      })
      vi.spyOn(document, 'querySelector').mockReturnValue(rootElementMock)

      sut({ theme: 'system' })

      expect(rootElementMock.className).toBe(`azion-${result}`)
    }
  )

  it.each([
    {
      selectedTheme: 'dark',
      initialTheme: 'light',
      result: 'dark'
    },
    {
      selectedTheme: 'light',
      initialTheme: 'dark',
      result: 'light'
    }
  ])(
    `should change application theme to $selectedTheme`,
    ({ selectedTheme, initialTheme, result }) => {
      const { sut, rootElementMock } = makeSut({
        matchesSystemThemeDark: false,
        initialTheme
      })

      sut({ theme: selectedTheme })

      expect(rootElementMock.className).toBe(`azion-${result}`)
    }
  )
})
