<script setup>
  /**
   * FallbackCopyDialog
   *
   * Manual-copy fallback dialog for share-URL flows.
   *
   * Surfaced when the Clipboard API path fails (insecure context, denied
   * permission, browser without `navigator.clipboard`, etc.). The dialog
   * presents the URL inside a readonly `InputText` so the user can copy it
   * by hand, plus a "Copy" button that retries the copy via the legacy
   * `document.execCommand('copy')` path — the only escape hatch that still
   * works without HTTPS / user-gesture restrictions in most browsers.
   *
   * Decoupled from any toast/notification system: emits `copied` (success)
   * and `copy-error` so the parent (typically `useSessionManager`) can drive
   * the toast it already owns. This keeps the component free of business /
   * I/O concerns (see frontend-guidelines: component purity).
   *
   * Imperative surface (via `defineExpose`):
   *  - `show(url: string)`  — open the dialog with the given URL.
   *  - `close()`            — close the dialog programmatically.
   *
   * Requirements: 1.4, N.8
   */
  import { ref, nextTick } from 'vue'
  import PrimeDialog from '@aziontech/webkit/dialog'
  import InputText from '@aziontech/webkit/inputtext'
  import PrimeButton from '@aziontech/webkit/button'

  defineOptions({ name: 'FallbackCopyDialog' })

  const emit = defineEmits(['copied', 'copy-error'])

  const visible = ref(false)
  const sharedUrl = ref('')
  // Template ref on the InputText wrapper — used to scope the
  // execCommand-based copy to *this* input (not any other readonly input
  // that might be mounted at the same time).
  const inputRef = ref(null)

  /**
   * Resolve the underlying `<input>` element regardless of whether
   * `inputRef` is bound to the Vue component instance (with `$el`) or
   * directly to a DOM element. Returns `null` if no input is found.
   */
  // Returns a live <input> DOM element reference (or null) for focus/select —
  // it never produces or assigns HTML strings.
  // eslint-disable-next-line xss/no-mixed-html
  const resolveInputElement = () => {
    const ref = inputRef.value
    if (!ref) return null
    // PrimeVue InputText exposes the native input via `$el`.
    const el = ref.$el || ref
    if (el instanceof HTMLInputElement) return el
    if (typeof el.querySelector === 'function') {
      return el.querySelector('input')
    }
    return null
  }

  /**
   * Open the dialog with the given URL and auto-select the input so the
   * user can copy it with a single keystroke.
   */
  const show = async (url) => {
    sharedUrl.value = String(url ?? '')
    visible.value = true
    // Wait for the dialog/input to mount before focusing+selecting.
    await nextTick()
    const inputEl = resolveInputElement()
    if (inputEl) {
      inputEl.focus()
      inputEl.select()
    }
  }

  const close = () => {
    visible.value = false
  }

  /**
   * Legacy copy path: select the input and call `document.execCommand`.
   * Deliberately wrapped in try/catch and capability checks because
   * `execCommand` is deprecated and may throw / no-op on stricter
   * browsers — in which case the user can still copy manually via
   * Ctrl/Cmd+C, hence why the dialog stays open.
   */
  const copyViaExecCommand = () => {
    const inputEl = resolveInputElement()
    if (!inputEl) {
      emit('copy-error', new Error('Input element not available'))
      return
    }
    try {
      inputEl.focus()
      inputEl.select()
      const ok = typeof document.execCommand === 'function' && document.execCommand('copy')
      if (ok) {
        emit('copied', sharedUrl.value)
      } else {
        emit('copy-error', new Error('execCommand returned false'))
      }
    } catch (err) {
      emit('copy-error', err)
    }
  }

  const handleInputFocus = (event) => {
    // Auto-select on focus to make manual Ctrl/Cmd+C trivial.
    event?.target?.select?.()
  }

  defineExpose({ show, close })
</script>

<template>
  <PrimeDialog
    v-model:visible="visible"
    modal
    header="Share URL"
    :closable="true"
    :dismissable-mask="true"
    :style="{ width: '35rem', maxWidth: 'min(35rem, 90vw)' }"
    class="fallback-copy-dialog"
    data-testid="fallback-copy-dialog"
  >
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <label
          for="fallback-copy-dialog__url"
          class="text-sm font-medium text-color"
          data-testid="fallback-copy-dialog__label"
        >
          Share URL
        </label>
        <InputText
          id="fallback-copy-dialog__url"
          ref="inputRef"
          :model-value="sharedUrl"
          readonly
          class="w-full"
          aria-label="Share URL"
          data-testid="fallback-copy-dialog__input"
          @focus="handleInputFocus"
        />
        <small
          class="text-xs text-color-secondary"
          data-testid="fallback-copy-dialog__hint"
        >
          Automatic clipboard copy is unavailable. Use the Copy button or press Ctrl/Cmd+C to copy
          manually.
        </small>
      </div>

      <div
        class="flex justify-end gap-2 pt-4 border-t surface-border"
        data-testid="fallback-copy-dialog__actions"
      >
        <PrimeButton
          label="Close"
          text
          aria-label="Close share URL dialog"
          data-testid="fallback-copy-dialog__close"
          @click="close"
        />
        <PrimeButton
          label="Copy"
          aria-label="Copy share URL"
          data-testid="fallback-copy-dialog__copy"
          @click="copyViaExecCommand"
        />
      </div>
    </div>
  </PrimeDialog>
</template>

<style scoped>
  /*
   * Responsive width breakdown:
   *   ≥ desktop  → 35rem (from inline :style)
   *   tablet     → min(35rem, 90vw) (from inline :style maxWidth)
   *   mobile     → calc(100vw - 1rem), enforced via the dialog mask root.
   *
   * PrimeVue/@aziontech Dialog renders the dialog surface as
   * `.p-dialog` inside a `.p-dialog-mask`. Scoped styles wouldn't reach
   * that surface in shadow scope, but the dialog mounts in the same DOM
   * subtree; we therefore use a custom class on the dialog and a `:deep`
   * selector to target the surface element.
   */
  .fallback-copy-dialog :deep(.p-dialog) {
    width: 35rem;
    max-width: min(35rem, 90vw);
  }

  @media (max-width: 640px) {
    .fallback-copy-dialog :deep(.p-dialog) {
      width: calc(100vw - 1rem);
      max-width: calc(100vw - 1rem);
      margin: 0.5rem;
    }
  }
</style>
