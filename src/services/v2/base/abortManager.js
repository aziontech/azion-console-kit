export class AbortManager {
  constructor() {
    this.controllers = new Map()
    this.groups = new Map()
  }

  getSignal(identifier, group) {
    const controller = new AbortController()
    this.controllers.set(identifier, controller)

    if (group) {
      if (!this.groups.has(group)) {
        this.groups.set(group, new Set())
      }
      this.groups.get(group).add(identifier)
    }

    controller.signal.addEventListener('abort', () => {
      this.controllers.delete(identifier)
      if (group) {
        const groupSet = this.groups.get(group)
        if (groupSet) {
          groupSet.delete(identifier)
          if (groupSet.size) {
            this.groups.delete(group)
          }
        }
      }
    })

    return controller.signal
  }

  abort(identifier) {
    const controller = this.controllers.get(identifier)
    if (controller) {
      controller.abort()
      this.controllers.delete(identifier)
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

  abortAll() {
    this.controllers.forEach((controller) => controller.abort())
  }
}
