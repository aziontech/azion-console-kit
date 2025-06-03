import { createHttpService } from './base/httpServiceFactory'

// Services

// Vcs Service
import { VcsService } from './vcs-service'
import { VcsAdapter } from './adapters/vcs-adapter'

// Edge Firewall Service
import { EdgeFirewallService } from './edge-firewall-service'
import { EdgeFirewallAdapter } from './adapters/edge-firewall-adapter'
// Edge Firewall - Functions Service
import { EdgeFirewallFunctionAdapter } from './adapters/edge-firewall-function-adapter'
import { EdgeFirewallFunctionService } from './edge-firewall-function-service'
// Edge Firewall - Rules Engine Service
import { EdgeFirewallRulesEngineAdapter } from './adapters/edge-firewall-rules-engine-adapter'
import { EdgeFirewallRulesEngineService } from './edge-firewall-rules-engine-service'
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

//Data Stream
import { DataStreamService } from './data-stream-service'
import { DataStreamAdapter } from './adapters/data-stream-adapter'

const httpService = createHttpService()

const vcsService = new VcsService(httpService, VcsAdapter)
const edgeFirewallService = new EdgeFirewallService(httpService, EdgeFirewallAdapter)
const edgeFirewallFunctionService = new EdgeFirewallFunctionService(
  httpService,
  EdgeFirewallFunctionAdapter
)
const edgeFirewallRulesEngineService = new EdgeFirewallRulesEngineService(
  httpService,
  EdgeFirewallRulesEngineAdapter
)
const networkListsService = new NetworkListsService(httpService, NetworkListsAdapter)
const deviceGroupService = new DeviceGroupService(httpService, DeviceGroupAdapter)
const cacheSettingsService = new CacheSettingsService(httpService, CacheSettingsAdapter)
const purgeService = new PurgeService(httpService, PurgeAdapter)
const edgeApplicationFunctionService = new EdgeApplicationFunctionService(
  httpService,
  EdgeApplicationFunctionsAdapter
)
const edgeFunctionService = new EdgeFunctionService(httpService, EdgeFunctionsAdapter)
const dataStreamService = new DataStreamService(httpService, DataStreamAdapter)

export {
  vcsService,
  cacheSettingsService,
  deviceGroupService,
  purgeService,
  networkListsService,
  edgeFirewallService,
  edgeFirewallFunctionService,
  edgeFirewallRulesEngineService,
  edgeApplicationFunctionService,
  edgeFunctionService,
  dataStreamService
}
