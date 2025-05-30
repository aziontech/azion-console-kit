import { createHttpService } from './base/httpServiceFactory'

// Services

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

// Edge Functions
import { EdgeApplicationFunctionService } from './edge-application-functions-service'
import { EdgeApplicationFunctionsAdapter } from './adapters/edge-application-functions-adapter'

// Edge Functions
import { EdgeFunctionService } from './edge-function-service'
import { EdgeFunctionsAdapter } from './adapters/edge-function-adapter'

const httpService = createHttpService()

const vcsService = new VcsService(httpService, VcsAdapter)
const networkListsService = new NetworkListsService(httpService, NetworkListsAdapter)
const deviceGroupService = new DeviceGroupService(httpService, DeviceGroupAdapter)
const cacheSettingsService = new CacheSettingsService(httpService, CacheSettingsAdapter)
const purgeService = new PurgeService(httpService, PurgeAdapter)
const edgeApplicationFunctionService = new EdgeApplicationFunctionService(
  httpService,
  EdgeApplicationFunctionsAdapter
)
const edgeFunctionService = new EdgeFunctionService(httpService, EdgeFunctionsAdapter)

export {
  vcsService,
  cacheSettingsService,
  deviceGroupService,
  purgeService,
  networkListsService,
  edgeApplicationFunctionService,
  edgeFunctionService
}
