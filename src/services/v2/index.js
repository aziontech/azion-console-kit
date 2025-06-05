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

// Waf
import { WafService } from './waf-service'
import { WafAdapter } from './adapters/waf-adapter'

// Edge Application Rules Engine
import { RulesEngineAdapter } from './adapters/edge-app-rules-engine-adapter'
import { RulesEngineService } from './edge-app-rules-engine-service'

// Edge Application
import { EdgeAppAdapter } from './adapters/edge-app-adapter'
import { EdgeAppService } from './edge-app-service'
// Edge Functions
import { EdgeApplicationFunctionService } from './edge-application-functions-service'
import { EdgeApplicationFunctionsAdapter } from './adapters/edge-application-functions-adapter'

// Edge Functions
import { EdgeFunctionService } from './edge-function-service'
import { EdgeFunctionsAdapter } from './adapters/edge-function-adapter'

//Data Stream
import { DataStreamService } from './data-stream-service'
import { DataStreamAdapter } from './adapters/data-stream-adapter'

// Custom Pages
import { CustomPageAdapter } from './adapters/custom-page-adapter'
import { CustomPageService } from './custom-page-service'

// MFA
import { MFAService } from './mfa-service'
import { MFAAdapter } from './adapters/mfa-adapter'

const httpService = createHttpService()

const vcsService = new VcsService(httpService, VcsAdapter)
const wafService = new WafService(httpService, WafAdapter)
const edgeFirewallService = new EdgeFirewallService(httpService, EdgeFirewallAdapter)
const edgeFirewallFunctionService = new EdgeFirewallFunctionService(
  httpService,
  EdgeFirewallFunctionAdapter
)
const edgeFirewallRulesEngineService = new EdgeFirewallRulesEngineService(
  httpService,
  EdgeFirewallRulesEngineAdapter
)
const cacheSettingsService = new CacheSettingsService(httpService, CacheSettingsAdapter)
const deviceGroupService = new DeviceGroupService(httpService, DeviceGroupAdapter)
const purgeService = new PurgeService(httpService, PurgeAdapter)
const edgeAppService = new EdgeAppService(httpService, EdgeAppAdapter)
const networkListsService = new NetworkListsService(httpService, NetworkListsAdapter)
const rulesEngineService = new RulesEngineService(httpService, RulesEngineAdapter)
const edgeApplicationFunctionService = new EdgeApplicationFunctionService(
  httpService,
  EdgeApplicationFunctionsAdapter
)
const edgeFunctionService = new EdgeFunctionService(httpService, EdgeFunctionsAdapter)
const dataStreamService = new DataStreamService(httpService, DataStreamAdapter)
const customPageService = new CustomPageService(httpService, CustomPageAdapter)
const mafService = new MFAService(httpService, MFAAdapter)

export {
  vcsService,
  cacheSettingsService,
  deviceGroupService,
  purgeService,
  wafService,
  networkListsService,
  edgeAppService,
  edgeFirewallService,
  edgeFirewallFunctionService,
  edgeFirewallRulesEngineService,
  rulesEngineService,
  edgeApplicationFunctionService,
  edgeFunctionService,
  dataStreamService,
  customPageService,
  mafService
}
