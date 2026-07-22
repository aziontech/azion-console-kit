import { inject, onBeforeUnmount } from 'vue'
import { VERSION_COMMAND_BUS_KEY } from './use-version-command-bus'

/**
 * @param {string} command
 * @param {Function | { execute: Function, ready?: import('vue').Ref<boolean> }} options
 */
export const onVersionCommand = (command, options) => {
  const bus = inject(VERSION_COMMAND_BUS_KEY, null)
  if (!bus) {
    throw new Error('[onVersionCommand] no bus in scope — use inside <VersionShell>')
  }

  const config = typeof options === 'function' ? { execute: options } : options

  const unregister = bus.register(command, config)
  onBeforeUnmount(unregister)
}
