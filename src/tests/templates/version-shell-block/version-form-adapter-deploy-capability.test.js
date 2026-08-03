/**
 * Coverage-matrix claims (spec versioning-test-coverage / TEST-ARCHITECTURE §3.4).
 * The matrix (tests/coverage-matrix.json) is DERIVED from these markers —
 * run `node scripts/check-coverage-matrix.mjs --write` after changing them.
 * @covers application,connector,custom_page,firewall,workload:J8 component
 * @covers function,network_list,waf:J8 n/a
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import * as yup from 'yup'
import {
  createVersionCommandBus,
  VERSION_COMMAND_BUS_KEY
} from '@/composables/versioning/use-version-command-bus'
import { VERSION_CONTEXT_KEY } from '@/composables/versioning/use-version-context'
import { DEFAULT_CAPABILITY, VERSIONED_ONLY } from '@/composables/versioning/version-capability'
import { useVersionFormAdapter } from '@/composables/versioning/use-version-form-adapter'

const makeService = () => ({
  updateDraft: vi.fn().mockResolvedValue({ id: 'v1' }),
  build: vi.fn(),
  archive: vi.fn(),
  cancelBuild: vi.fn(),
  createDraft: vi.fn(),
  deleteVersion: vi.fn()
})

const Harness = {
  props: ['capability', 'versionService'],
  setup(props) {
    useVersionFormAdapter({
      resource: { name: 'res' },
      resourceId: '10',
      versionId: 'v1',
      versionService: props.versionService,
      validationSchema: yup.object({}),
      capability: props.capability
    })
    return () => null
  }
}

const mountAdapter = (capability) => {
  const bus = createVersionCommandBus()
  mount(Harness, {
    props: { capability, versionService: makeService() },
    global: {
      provide: {
        [VERSION_COMMAND_BUS_KEY]: bus,
        [VERSION_CONTEXT_KEY]: {
          state: ref('ready'),
          version: ref({ id: 'v1', config: {} }),
          capability: ref(capability)
        }
      }
    }
  })
  return bus
}

describe('useVersionFormAdapter — DEPLOY registration gated by capability', () => {
  it('registers DEPLOY for a deployable resource', () => {
    const bus = mountAdapter(DEFAULT_CAPABILITY)
    expect(bus.registered.value.has('DEPLOY')).toBe(true)
  })

  it('does NOT register DEPLOY for a versioned-only resource', () => {
    const bus = mountAdapter(VERSIONED_ONLY)
    expect(bus.registered.value.has('DEPLOY')).toBe(false)
  })

  it('dispatch("DEPLOY") fail-closes (throws) for versioned-only', async () => {
    const bus = mountAdapter(VERSIONED_ONLY)
    await expect(bus.emit('DEPLOY', { resourceId: '10', versionId: 'v1' })).rejects.toThrow(
      /No handler registered for "DEPLOY"/
    )
  })

  it('keeps the non-deploy lifecycle handlers registered regardless of capability', () => {
    const bus = mountAdapter(VERSIONED_ONLY)
    ;['SAVE', 'SAVE_AND_BUILD', 'ARCHIVE', 'CANCEL_BUILD', 'NEW_DRAFT_FROM', 'DELETE'].forEach(
      (command) => expect(bus.registered.value.has(command)).toBe(true)
    )
  })
})
