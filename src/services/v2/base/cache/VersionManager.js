import { cacheManager } from './CacheManager'

export class VersionManager {
  constructor(cacheManager) {
    this.cacheManager = cacheManager
    this.versionKey = 'app_version'
  }

  async initialize() {
    const currentVersion = this._getCurrentVersion()
    const storedVersion = await this.cacheManager.get(this.versionKey)

    if (storedVersion && storedVersion !== currentVersion) {
      await this.cacheManager.clear()
      await this.cacheManager.set(this.versionKey, currentVersion)
    } else if (!storedVersion) {
      await this.cacheManager.set(this.versionKey, currentVersion)
    }
  }

  _getCurrentVersion() {
    return '1.0.0'
  }
}

export const versionManager = new VersionManager(cacheManager)