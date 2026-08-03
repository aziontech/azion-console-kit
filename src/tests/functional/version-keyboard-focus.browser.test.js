import { render } from '@testing-library/vue'
import { describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'
import PrimeVue from 'primevue/config'
import Tooltip from 'primevue/tooltip'
import { userEvent } from 'vitest/browser'
import VersionActionBar from '@/templates/version-shell-block/components/VersionActionBar.vue'
import VersionActionDialog from '@/templates/version-shell-block/components/VersionActionDialog.vue'

const primevue = { plugins: [PrimeVue], directives: { tooltip: Tooltip } }

const inBody = (testId) => document.body.querySelector(`[data-testid="${testId}"]`)
const waitInBody = async (testId) => {
  await vi.waitFor(() => expect(inBody(testId)).not.toBeNull())
  return inBody(testId)
}

const typeComment = async (textarea, value) => {
  textarea.value = value
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
}

describe('keyboard & focus (functional)', () => {
  it('action bar: focus + Enter dispatches the same command as a click', async () => {
    const { getByTestId, emitted } = render(VersionActionBar, {
      props: { state: 'draft', availableActions: ['SAVE', 'SAVE_AND_BUILD'] },
      global: primevue
    })
    const button = getByTestId('version-action-bar__action-SAVE_AND_BUILD')
    button.focus()
    expect(document.activeElement).toBe(button)

    await userEvent.keyboard('{Enter}')
    expect(emitted().dispatch).toEqual([['SAVE_AND_BUILD', {}]])
  })

  it('dialog: Tab moves real focus from the comment box onto a dialog button', async () => {
    render(VersionActionDialog, {
      props: {
        visible: true,
        title: 'Archive Version',
        actionLabel: 'Archive',
        requireComment: true,
        showComment: true
      },
      global: primevue
    })
    const textarea = await waitInBody('version-action-dialog__comment')
    textarea.focus()
    expect(document.activeElement).toBe(textarea)

    await userEvent.tab()
    const cancel = inBody('version-action-dialog__cancel')
    const confirm = inBody('version-action-dialog__confirm')
    expect(document.activeElement).not.toBe(textarea)
    expect([cancel, confirm]).toContain(document.activeElement)
  })

  it('dialog: Enter on the focused confirm button confirms with the typed comment', async () => {
    const { emitted } = render(VersionActionDialog, {
      props: {
        visible: true,
        title: 'Archive Version',
        actionLabel: 'Archive',
        requireComment: true,
        showComment: true
      },
      global: primevue
    })
    const textarea = await waitInBody('version-action-dialog__comment')
    await typeComment(textarea, 'archiving via keyboard')

    const confirm = inBody('version-action-dialog__confirm')
    await vi.waitFor(() => expect(confirm).not.toBeDisabled())
    confirm.focus()
    expect(document.activeElement).toBe(confirm)

    await userEvent.keyboard('{Enter}')
    expect(emitted().confirm).toEqual([['archiving via keyboard']])
  })
})
