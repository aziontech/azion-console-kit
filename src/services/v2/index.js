import { createHttpService } from './base/httpServiceFactory'

// Services

// Vcs Service
import { VcsService } from './vcs-service'
import { PurgeService } from './purge-service'

// Adapters
import { VcsAdapter } from './adapters/vcs-adapter'
import { PurgeAdapter } from './adapters/purge-adapter'
// Edge Application Device Group
import { DeviceGroupAdapter } from './adapters/edge-app-device-group-adapter'
import { DeviceGroupService } from './edge-app-device-group-service'
// Edge Application Cache Settings
import { CacheSettingsAdapter } from './adapters/edge-app-cache-settings-adapter'
import { CacheSettingsService } from './edge-app-cache-settings-service'

const httpService = createHttpService()

const vcsService = new VcsService(httpService, VcsAdapter)
const deviceGroupService = new DeviceGroupService(httpService, DeviceGroupAdapter)
const cacheSettingsService = new CacheSettingsService(httpService, CacheSettingsAdapter)
const purgeService = new PurgeService(httpService, PurgeAdapter)

export { vcsService, cacheSettingsService, deviceGroupService, purgeService }
