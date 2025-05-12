export class AbortManager {
  constructor(keyBuilder) {
    this.keyBuilder = keyBuilder
    this.controllers = new Map()
    this.groups = new Map()
  }

  getSignal(method, url, identifier, group) {
    const key = this.keyBuilder.build(method, url, identifier)
    const controller = new AbortController()
    this.controllers.set(key, controller)

    if (group) {
      if (!this.groups.has(group)) {
        this.groups.set(group, new Set())
      }
      this.groups.get(group).add(key)
    }

    return controller.signal
  }

  abort(method, url, identifier) {
    const key = this.keyBuilder.build(method, url, identifier)
    const controller = this.controllers.get(key)
    if (controller) {
      controller.abort()
      this.controllers.delete(key)
    }
  }

  abortGroup(group) {
    const keys = this.groups.get(group)
    if (keys) {
      for (const key of keys) {
        const controller = this.controllers.get(key)
        if (controller) {
          controller.abort()
          this.controllers.delete(key)
        }
      }
      this.groups.delete(group)
    }
  }
}
