import { createHttpService } from './base/httpServiceFactory'

// Services

// Vcs Service
import { VcsService } from './vcs-service'
import { VcsAdapter } from './adapters/vcs-adapter'
import { NetworkListsService } from './network-lists-service'
import { NetworkListsAdapter } from './adapters/network-lists-adapter'
// Edge Application Device Group
import { DeviceGroupAdapter } from './adapters/edge-app-device-group-adapter'
import { DeviceGroupService } from './edge-app-device-group-service'
// Edge Application Cache Settings
import { CacheSettingsAdapter } from './adapters/edge-app-cache-settings-adapter'
import { CacheSettingsService } from './edge-app-cache-settings-service'

const httpService = createHttpService()

const vcsService = new VcsService(httpService, VcsAdapter)
const networkListsService = new NetworkListsService(httpService, NetworkListsAdapter)
const deviceGroupService = new DeviceGroupService(httpService, DeviceGroupAdapter)
const cacheSettingsService = new CacheSettingsService(httpService, CacheSettingsAdapter)

export { vcsService, cacheSettingsService, deviceGroupService, networkListsService }
