import { createHttpService } from './base/httpServiceFactory'

// Services

// Vcs Service
import { VcsService } from './vcs-service'
import { VcsAdapter } from './adapters/vcs-adapter'

// Edge Application Cache Settings
import { CacheSettingAdapter } from './adapters/edge-app-cache-setting-adapter'
import { CacheSettingService } from './edge-app-cache-setting-service'

const httpService = createHttpService()
const vcsService = new VcsService(httpService, VcsAdapter)
const cacheSettinService = new CacheSettingService(httpService, CacheSettingAdapter)

export { vcsService, cacheSettinService }
