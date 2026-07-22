import { render } from '@testing-library/vue'
import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import PrimeVue from 'primevue/config'
import Tooltip from 'primevue/tooltip'
import { userEvent } from 'vitest/browser'
import VersionActionBar from '@/templates/version-shell-block/components/VersionActionBar.vue'
import { VERSION_CONTEXT_KEY } from '@/composables/versioning/use-version-context'
import { VERSIONED_ONLY } from '@/composables/versioning/version-capability'

const primevue = { plugins: [PrimeVue], directives: { tooltip: Tooltip } }

const renderBar = (props, capability) =>
  render(VersionActionBar, {
    props,
    global: {
      ...primevue,
      provide: capability ? { [VERSION_CONTEXT_KEY]: { capability: ref(capability) } } : {}
    }
  })

describe('VersionActionBar (functional)', () => {
  it('draft: renders Save + Save and Build with the editing banner', () => {
    const { getByTestId } = renderBar({
      state: 'draft',
      availableActions: ['SAVE', 'SAVE_AND_BUILD']
    })
    expect(getByTestId('version-action-bar__action-SAVE')).toHaveTextContent('Save')
    expect(getByTestId('version-action-bar__action-SAVE_AND_BUILD')).toHaveTextContent(
      'Save and Build'
    )
    expect(getByTestId('version-action-bar')).toHaveTextContent('Editing version')
    expect(getByTestId('version-action-bar__editable')).toBeInTheDocument()
  })

  it('building: renders only Cancel Build with the building banner', () => {
    const { getByTestId, queryByTestId } = renderBar({
      state: 'building',
      availableActions: ['CANCEL_BUILD']
    })
    expect(getByTestId('version-action-bar__action-CANCEL_BUILD')).toHaveTextContent('Cancel Build')
    expect(queryByTestId('version-action-bar__action-SAVE')).toBeNull()
    expect(getByTestId('version-action-bar')).toHaveTextContent('Building version')
  })

  it('ready: renders New Version + Deploy, read-only chip and Ready banner', () => {
    const { getByTestId } = renderBar({
      state: 'ready',
      availableActions: ['NEW_DRAFT_FROM', 'DEPLOY']
    })
    expect(getByTestId('version-action-bar__action-NEW_DRAFT_FROM')).toHaveTextContent(
      'New Version'
    )
    expect(getByTestId('version-action-bar__action-DEPLOY')).toHaveTextContent('Deploy')
    expect(getByTestId('version-action-bar')).toHaveTextContent('Viewing a Ready version')
    expect(getByTestId('version-action-bar__readonly')).toBeInTheDocument()
  })

  it('active: Deploy button becomes Redeploy with the Deployed banner', () => {
    const { getByTestId } = renderBar({
      state: 'active',
      availableActions: ['NEW_DRAFT_FROM', 'DEPLOY']
    })
    expect(getByTestId('version-action-bar__action-DEPLOY')).toHaveTextContent('Redeploy')
    expect(getByTestId('version-action-bar__action-NEW_DRAFT_FROM')).toHaveTextContent(
      'New Version'
    )
    expect(getByTestId('version-action-bar')).toHaveTextContent('Viewing a Deployed version')
  })

  it('archived: renders only New Version with the Archived banner', () => {
    const { getByTestId, queryByTestId } = renderBar({
      state: 'archived',
      availableActions: ['NEW_DRAFT_FROM']
    })
    expect(getByTestId('version-action-bar__action-NEW_DRAFT_FROM')).toHaveTextContent(
      'New Version'
    )
    expect(queryByTestId('version-action-bar__action-DEPLOY')).toBeNull()
    expect(getByTestId('version-action-bar')).toHaveTextContent('Viewing an Archived version')
  })

  it('deployable ready: subtitle keeps the "deploy it to go live" copy', () => {
    const { getByTestId } = renderBar({
      state: 'ready',
      availableActions: ['NEW_DRAFT_FROM', 'DEPLOY']
    })
    expect(getByTestId('version-action-bar')).toHaveTextContent('or deploy it to go live.')
  })

  it('versioned-only ready: drops Deploy button AND the deploy copy', () => {
    const { getByTestId, queryByTestId } = renderBar(
      { state: 'ready', availableActions: ['NEW_DRAFT_FROM', 'DEPLOY'] },
      VERSIONED_ONLY
    )
    expect(queryByTestId('version-action-bar__action-DEPLOY')).toBeNull()
    const bar = getByTestId('version-action-bar')
    expect(bar).toHaveTextContent(
      'This version is read-only. Create a new version to make changes.'
    )
    expect(bar).not.toHaveTextContent('deploy it to go live')
  })

  it('enabled click emits dispatch with (action, {}) exactly', async () => {
    const { getByTestId, emitted } = renderBar({
      state: 'draft',
      availableActions: ['SAVE', 'SAVE_AND_BUILD']
    })
    await userEvent.click(getByTestId('version-action-bar__action-SAVE_AND_BUILD'))
    expect(emitted().dispatch).toEqual([['SAVE_AND_BUILD', {}]])
  })

  it('disabled action: button is disabled and click emits no dispatch', async () => {
    const { getByTestId, emitted } = renderBar({
      state: 'draft',
      availableActions: ['SAVE', 'SAVE_AND_BUILD'],
      disabledActions: ['SAVE_AND_BUILD']
    })
    const button = getByTestId('version-action-bar__action-SAVE_AND_BUILD')
    expect(button).toBeDisabled()
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(emitted().dispatch).toBeUndefined()
  })
})
