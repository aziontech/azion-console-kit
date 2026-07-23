import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

/**
 * themeGuard — applies the persisted (or system) theme exactly once per app
 * load. The module keeps a run-once flag, so each test re-imports a fresh
 * module instance (vi.resetModules).
 */
const loadGuard = async () => (await import('@/router/hooks/guards/themeGuard')).themeGuard

beforeEach(() => {
  vi.resetModules()
  setActivePinia(createPinia())
  localStorage.clear()
  document.documentElement.className = ''
})

describe('theme resolution', () => {
  it('applies the theme persisted in localStorage', async () => {
    localStorage.setItem('theme', 'dark')
    const themeGuard = await loadGuard()
    const { useThemeStore } = await import('@/stores/theme')

    themeGuard()

    expect(useThemeStore().theme).toBe('dark')
  })

  it('falls back to the system preference when nothing is persisted (light here — matchMedia stub)', async () => {
    const themeGuard = await loadGuard()
    const { useThemeStore } = await import('@/stores/theme')

    themeGuard()

    // the suite-wide matchMedia stub answers matches:false → light
    expect(useThemeStore().theme).toBe('light')
  })

  it('runs only once per module lifetime (second navigation is a no-op)', async () => {
    const themeGuard = await loadGuard()
    const { useThemeStore } = await import('@/stores/theme')

    themeGuard()
    localStorage.setItem('theme', 'dark')
    themeGuard()

    expect(useThemeStore().theme).toBe('light')
  })
})
