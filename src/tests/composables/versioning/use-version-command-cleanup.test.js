import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { onVersionCommand } from '@/composables/versioning/use-version-command'
import {
  createVersionCommandBus,
  VERSION_COMMAND_BUS_KEY
} from '@/composables/versioning/use-version-command-bus'

/**
 * Lifecycle contract of onVersionCommand, proven with REAL components mounted
 * and unmounted against the REAL command bus (createVersionCommandBus). No
 * module mocks: the bus is the collaborator under test, provided by injection
 * exactly as the VersionShell provides it in production.
 *
 * Guards the three things that keep the bus honest as editor tabs come and go:
 *   (a) unmount auto-unregisters (onBeforeUnmount),
 *   (b) using the composable outside a shell fails loud,
 *   (c) a fresh mount can re-register a command the previous one released.
 */

// A minimal descendant that registers `command` on the injected bus at setup.
const commandComponent = (command, execute = vi.fn()) => ({
  name: 'command-registrar',
  setup() {
    onVersionCommand(command, execute)
    return () => null
  }
})

const mountInShell = (component, bus) =>
  mount(component, {
    global: { provide: { [VERSION_COMMAND_BUS_KEY]: bus } }
  })

describe('onVersionCommand — auto-unregister on unmount', () => {
  it('removes the command from the bus registry when the component unmounts', () => {
    const bus = createVersionCommandBus()
    const wrapper = mountInShell(commandComponent('SAVE'), bus)

    expect(bus.registered.value.has('SAVE')).toBe(true)

    wrapper.unmount()

    expect(bus.registered.value.has('SAVE')).toBe(false)
  })
})

describe('onVersionCommand — used outside a VersionShell', () => {
  it('throws the source error when no bus is provided in scope', () => {
    expect(() => mount(commandComponent('SAVE'))).toThrow(
      '[onVersionCommand] no bus in scope — use inside <VersionShell>'
    )
  })
})

describe('onVersionCommand — re-registration after unmount', () => {
  it('lets a new component register the same command once the previous one is gone', () => {
    const bus = createVersionCommandBus()

    const first = mountInShell(commandComponent('SAVE'), bus)
    first.unmount()

    // A live registration would make this throw the "already registered" error;
    // clean unregister on unmount is what keeps re-mounting safe.
    let second
    expect(() => {
      second = mountInShell(commandComponent('SAVE'), bus)
    }).not.toThrow()

    expect(bus.registered.value.has('SAVE')).toBe(true)

    second.unmount()
    expect(bus.registered.value.has('SAVE')).toBe(false)
  })
})
