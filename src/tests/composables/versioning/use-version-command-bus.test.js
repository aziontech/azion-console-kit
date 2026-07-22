import { describe, it, expect, vi } from 'vitest'
import { computed, isRef, ref, nextTick, watch } from 'vue'
import {
  createVersionCommandBus,
  VERSION_COMMAND_BUS_KEY
} from '@/composables/versioning/use-version-command-bus'

describe('createVersionCommandBus - registration contract', () => {
  it('rejects a second handler for the same command', () => {
    const bus = createVersionCommandBus()
    bus.register('SAVE', { execute: () => {} })

    expect(() => bus.register('SAVE', { execute: () => {} })).toThrow(
      '[VersionShell] Command "SAVE" already registered'
    )
  })

  it('throws when emitting a command that has no handler', async () => {
    const bus = createVersionCommandBus()
    await expect(bus.emit('BUILD', {})).rejects.toThrow(
      '[VersionShell] No handler registered for "BUILD"'
    )
  })

  it('invokes the registered handler with the context and returns its result', async () => {
    const bus = createVersionCommandBus()
    const execute = vi.fn().mockResolvedValue('done')
    bus.register('SAVE', { execute })

    const result = await bus.emit('SAVE', { versionId: 'v1' })

    expect(execute).toHaveBeenCalledWith({ versionId: 'v1' })
    expect(result).toBe('done')
  })
})

describe('createVersionCommandBus - reactive registry', () => {
  it('tracks register/unregister reactively so the shell can recompute actions', async () => {
    const bus = createVersionCommandBus()
    const seen = []
    watch(
      () => [...bus.registered.value.keys()],
      (keys) => seen.push(keys),
      { immediate: true }
    )

    const unregister = bus.register('SAVE', { execute: () => {} })
    await nextTick()
    expect(bus.registered.value.has('SAVE')).toBe(true)

    unregister()
    await nextTick()
    expect(bus.registered.value.has('SAVE')).toBe(false)

    expect(seen).toEqual([[], ['SAVE'], []])
  })

  it('unregister removes only its own command, leaving siblings intact', () => {
    const bus = createVersionCommandBus()
    bus.register('SAVE', { execute: () => {} })
    const removeBuild = bus.register('BUILD', { execute: () => {} })

    removeBuild()

    expect(bus.registered.value.has('SAVE')).toBe(true)
    expect(bus.registered.value.has('BUILD')).toBe(false)
  })
})

describe('createVersionCommandBus - ready ref is not unwrapped (shallowRef regression)', () => {
  it('keeps the stored ready as a live ref with a functional .value', async () => {
    const bus = createVersionCommandBus()
    const ready = ref(false)
    bus.register('SAVE', { execute: () => {}, ready })

    const entry = bus.registered.value.get('SAVE')

    expect(isRef(entry.ready)).toBe(true)
    expect(entry.ready.value).toBe(false)

    const mirror = computed(() => entry.ready.value)
    expect(mirror.value).toBe(false)
    ready.value = true
    await nextTick()
    expect(entry.ready.value).toBe(true)
    expect(mirror.value).toBe(true)
  })

  it('defaults ready to null when the caller omits it', () => {
    const bus = createVersionCommandBus()
    bus.register('SAVE', { execute: () => {} })

    expect(bus.registered.value.get('SAVE').ready).toBeNull()
  })
})

describe('createVersionCommandBus - isolation', () => {
  it('exposes a stable inject key and gives each shell an independent registry', () => {
    expect(typeof VERSION_COMMAND_BUS_KEY).toBe('symbol')

    const busA = createVersionCommandBus()
    const busB = createVersionCommandBus()
    busA.register('SAVE', { execute: () => {} })

    expect(busA.registered.value.has('SAVE')).toBe(true)
    expect(busB.registered.value.has('SAVE')).toBe(false)
  })
})
