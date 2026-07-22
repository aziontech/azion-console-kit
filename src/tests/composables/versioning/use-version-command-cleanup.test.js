import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { onVersionCommand } from '@/composables/versioning/use-version-command'
import {
  createVersionCommandBus,
  VERSION_COMMAND_BUS_KEY
} from '@/composables/versioning/use-version-command-bus'

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

    let second
    expect(() => {
      second = mountInShell(commandComponent('SAVE'), bus)
    }).not.toThrow()

    expect(bus.registered.value.has('SAVE')).toBe(true)

    second.unmount()
    expect(bus.registered.value.has('SAVE')).toBe(false)
  })
})
