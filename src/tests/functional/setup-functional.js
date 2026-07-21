/**
 * Setup for the FUNCTIONAL suite (Vitest browser mode — real Chromium).
 *
 * Intentionally minimal: no DOM polyfills here. If a test "needs" a polyfill
 * for focus/layout/Teleport, the test is wrong — the whole point of this suite
 * is that those are real (rule: .claude/rules/testing-versioning.md).
 */
import { cleanup } from '@testing-library/vue'
import { afterEach, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

beforeEach(() => {
  setActivePinia(createPinia())
})

afterEach(() => {
  cleanup()
})
