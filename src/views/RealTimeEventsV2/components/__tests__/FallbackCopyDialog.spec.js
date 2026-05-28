/**
 * FallbackCopyDialog — render + interaction tests.
 *
 * Scope:
 *  1. Component mounts and exposes `show()` / `close()` imperatively.
 *  2. After `show(url)`, the URL is presented in a readonly input.
 *  3. Clicking the Copy button invokes `document.execCommand('copy')`
 *     and emits `copied` with the URL.
 *  4. When `execCommand` throws, the component emits `copy-error`
 *     instead of crashing.
 *
 * We do **not** snapshot the whole SFC (per frontend-guidelines tests
 * defaults). Assertions target user-visible behavior + the imperative
 * contract documented in the component header.
 *
 * Validates: Requirements 1.4, N.8
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { WebkitPlugin } from '@aziontech/webkit/plugin'
import FallbackCopyDialog from '../FallbackCopyDialog.vue'

const SHARE_URL = 'https://console.azion.com/real-time-events?shareState=abc'

const mountDialog = () =>
  mount(FallbackCopyDialog, {
    attachTo: document.body,
    global: {
      plugins: [WebkitPlugin]
    }
  })

describe('FallbackCopyDialog', () => {
  let execCommandSpy
  let originalExecCommand

  beforeEach(() => {
    // jsdom does not implement `document.execCommand`. Define it as a
    // configurable property so vi.spyOn can install a mock implementation
    // (and remove the property cleanly after the test).
    originalExecCommand = Object.getOwnPropertyDescriptor(document, 'execCommand')
    if (!originalExecCommand) {
      Object.defineProperty(document, 'execCommand', {
        value: () => true,
        configurable: true,
        writable: true
      })
    }
    execCommandSpy = vi.spyOn(document, 'execCommand').mockImplementation(() => true)
  })

  afterEach(() => {
    execCommandSpy?.mockRestore?.()
    if (!originalExecCommand) {
      delete document.execCommand
    }
    document.body.innerHTML = ''
  })

  it('renders nothing initially (dialog is hidden)', () => {
    const wrapper = mountDialog()
    // The dialog teleports/conditionally renders — the body should not
    // contain the dialog content while visible === false.
    expect(document.querySelector('[data-testid="fallback-copy-dialog__input"]')).toBeNull()
    wrapper.unmount()
  })

  it('exposes show() and close() via defineExpose', () => {
    const wrapper = mountDialog()
    expect(typeof wrapper.vm.show).toBe('function')
    expect(typeof wrapper.vm.close).toBe('function')
    wrapper.unmount()
  })

  it('show(url) opens the dialog with the URL bound to the input', async () => {
    const wrapper = mountDialog()
    await wrapper.vm.show(SHARE_URL)
    await flushPromises()

    const input = document.querySelector('[data-testid="fallback-copy-dialog__input"]')
    expect(input).not.toBeNull()
    // The PrimeVue InputText wraps a native <input>. Confirm the value.
    const nativeInput = input.tagName === 'INPUT' ? input : input.querySelector('input')
    expect(nativeInput).not.toBeNull()
    expect(nativeInput.value).toBe(SHARE_URL)
    expect(nativeInput.readOnly).toBe(true)

    wrapper.unmount()
  })

  it('clicking Copy invokes execCommand("copy") and emits "copied"', async () => {
    const wrapper = mountDialog()
    await wrapper.vm.show(SHARE_URL)
    await flushPromises()

    const copyBtn = document.querySelector('[data-testid="fallback-copy-dialog__copy"]')
    expect(copyBtn).not.toBeNull()
    copyBtn.click()
    await flushPromises()

    expect(execCommandSpy).toHaveBeenCalledWith('copy')
    expect(wrapper.emitted('copied')).toBeTruthy()
    expect(wrapper.emitted('copied')[0]).toEqual([SHARE_URL])

    wrapper.unmount()
  })

  it('emits "copy-error" when execCommand throws', async () => {
    execCommandSpy.mockImplementation(() => {
      throw new Error('boom')
    })
    const wrapper = mountDialog()
    await wrapper.vm.show(SHARE_URL)
    await flushPromises()

    const copyBtn = document.querySelector('[data-testid="fallback-copy-dialog__copy"]')
    copyBtn.click()
    await flushPromises()

    expect(wrapper.emitted('copy-error')).toBeTruthy()
    expect(wrapper.emitted('copied')).toBeFalsy()

    wrapper.unmount()
  })

  it('emits "copy-error" when execCommand returns false', async () => {
    execCommandSpy.mockImplementation(() => false)
    const wrapper = mountDialog()
    await wrapper.vm.show(SHARE_URL)
    await flushPromises()

    const copyBtn = document.querySelector('[data-testid="fallback-copy-dialog__copy"]')
    copyBtn.click()
    await flushPromises()

    expect(wrapper.emitted('copy-error')).toBeTruthy()
    expect(wrapper.emitted('copied')).toBeFalsy()

    wrapper.unmount()
  })

  it('close() hides the dialog', async () => {
    const wrapper = mountDialog()
    await wrapper.vm.show(SHARE_URL)
    await flushPromises()
    expect(document.querySelector('[data-testid="fallback-copy-dialog__input"]')).not.toBeNull()

    wrapper.vm.close()
    await flushPromises()
    expect(document.querySelector('[data-testid="fallback-copy-dialog__input"]')).toBeNull()

    wrapper.unmount()
  })
})
