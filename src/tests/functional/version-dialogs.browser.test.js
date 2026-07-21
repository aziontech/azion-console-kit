/**
 * Functional (real Chromium) — VersionActionDialog + ProcessingOverlay
 * (spec task 4.5).
 *
 * Real user actions + observable consequences: the confirm button's disabled
 * state gates on a real comment, confirming emits the exact ('confirm', comment)
 * payload and closes, cancel closes; the overlay renders only for processing
 * states and its Cancel emits. Clicks are dispatched as native DOM events so they
 * do not depend on PrimeVue theme CSS for actionability.
 */
import { render } from '@testing-library/vue'
import { describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'
import PrimeVue from 'primevue/config'
import Tooltip from 'primevue/tooltip'
import VersionActionDialog from '@/templates/version-shell-block/components/VersionActionDialog.vue'
import ProcessingOverlay from '@/templates/version-shell-block/components/ProcessingOverlay.vue'

const primevue = { plugins: [PrimeVue], directives: { tooltip: Tooltip } }

// The dialog teleports to <body>; find its testids there.
const inBody = (testId) => document.body.querySelector(`[data-testid="${testId}"]`)
const waitInBody = async (testId) => {
  await vi.waitFor(() => expect(inBody(testId)).not.toBeNull())
  return inBody(testId)
}

const nativeClick = async (el) => {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await nextTick()
}

const typeComment = async (textarea, value) => {
  textarea.value = value
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
}

const renderDialog = (props) =>
  render(VersionActionDialog, {
    props: { visible: true, title: 'Archive Version', actionLabel: 'Archive', ...props },
    global: primevue
  })

describe('VersionActionDialog (functional)', () => {
  it('requireComment: confirm is disabled until a comment is typed, then confirms', async () => {
    const { emitted } = renderDialog({ requireComment: true, showComment: true })
    const confirm = await waitInBody('version-action-dialog__confirm')
    expect(confirm).toBeDisabled()

    const textarea = inBody('version-action-dialog__comment')
    await typeComment(textarea, 'retiring this build')
    await vi.waitFor(() => expect(confirm).not.toBeDisabled())

    await nativeClick(confirm)
    expect(emitted().confirm).toEqual([['retiring this build']])
    expect(emitted()['update:visible']).toEqual([[false]])
  })

  it('DELETE (showComment=false): confirms directly with an empty comment', async () => {
    const { emitted } = renderDialog({
      title: 'Delete Version',
      actionLabel: 'Delete',
      showComment: false,
      message: 'Are you sure you want to delete this version? This action cannot be undone.'
    })
    const confirm = await waitInBody('version-action-dialog__confirm')
    expect(confirm).not.toBeDisabled()
    expect(inBody('version-action-dialog__message')).toHaveTextContent(
      'This action cannot be undone.'
    )
    expect(inBody('version-action-dialog__comment')).toBeNull()

    await nativeClick(confirm)
    expect(emitted().confirm).toEqual([['']])
    expect(emitted()['update:visible']).toEqual([[false]])
  })

  it('cancel emits update:visible false without confirming', async () => {
    const { emitted } = renderDialog({ requireComment: true })
    const cancel = await waitInBody('version-action-dialog__cancel')
    await nativeClick(cancel)
    expect(emitted()['update:visible']).toEqual([[false]])
    expect(emitted().confirm).toBeUndefined()
  })
})

describe('ProcessingOverlay (functional)', () => {
  const renderOverlay = (props) => render(ProcessingOverlay, { props, global: primevue })

  it('renders while building', () => {
    const { getByTestId } = renderOverlay({ state: 'building' })
    expect(getByTestId('processing-overlay')).toBeInTheDocument()
  })

  it('stays hidden when the version is ready', () => {
    const { queryByTestId } = renderOverlay({ state: 'ready' })
    expect(queryByTestId('processing-overlay')).toBeNull()
  })

  it('hides the Cancel button when not cancelable', () => {
    const { getByTestId, queryByTestId } = renderOverlay({ state: 'building', canCancel: false })
    expect(getByTestId('processing-overlay')).toBeInTheDocument()
    expect(queryByTestId('processing-overlay__cancel')).toBeNull()
  })

  it('shows a Cancel button when cancelable and emits cancel on click', async () => {
    const { getByTestId, emitted } = renderOverlay({ state: 'building', canCancel: true })
    await nativeClick(getByTestId('processing-overlay__cancel'))
    expect(emitted().cancel).toEqual([[]])
  })
})
