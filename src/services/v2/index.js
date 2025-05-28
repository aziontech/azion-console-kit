import { createHttpService } from './base/httpServiceFactory'

// Services

// Vcs Service
import { VcsService } from './vcs-service'
import { VcsAdapter } from './adapters/vcs-adapter'

// Edge Application Cache Settings
import { CacheSettingsAdapter } from './adapters/edge-app-cache-settings-adapter'
import { CacheSettingsService } from './edge-app-cache-settings-service'

const httpService = createHttpService()
const vcsService = new VcsService(httpService, VcsAdapter)
const cacheSettingsService = new CacheSettingsService(httpService, CacheSettingsAdapter)

export { vcsService, cacheSettingsService }
