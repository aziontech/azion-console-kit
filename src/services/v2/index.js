import { createHttpService } from './base/httpServiceFactory'

// Services
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

export {
  vcsService,
  edgeFirewallService,
  edgeFirewallFunctionService,
  edgeFirewallRulesEngineService
}
