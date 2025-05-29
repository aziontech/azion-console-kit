import { createHttpService } from './base/httpServiceFactory'

// Vcs Service
import { VcsService } from './vcs-service'
import { VcsAdapter } from './adapters/vcs-adapter'

// Purge
import { PurgeService } from './purge-service'
import { PurgeAdapter } from './adapters/purge-adapter'

// Network Lists
import { NetworkListsService } from './network-lists-service'
import { NetworkListsAdapter } from './adapters/network-lists-adapter'

// Edge Application Device Group
import { DeviceGroupAdapter } from './adapters/edge-app-device-group-adapter'
import { DeviceGroupService } from './edge-app-device-group-service'

// Edge Application Cache Settings
import { CacheSettingsAdapter } from './adapters/edge-app-cache-settings-adapter'
import { CacheSettingsService } from './edge-app-cache-settings-service'

// Waf
import { WafService } from './waf-service'
import { WafAdapter } from './adapters/waf-adapter'

const httpService = createHttpService()

const services = {
  vcsService: new VcsService(httpService, VcsAdapter),
  wafService: new WafService(httpService, WafAdapter),
  networkListsService: new NetworkListsService(httpService, NetworkListsAdapter),
  deviceGroupService: new DeviceGroupService(httpService, DeviceGroupAdapter),
  cacheSettingsService: new CacheSettingsService(httpService, CacheSettingsAdapter),
  purgeService: new PurgeService(httpService, PurgeAdapter)
}

export default services
