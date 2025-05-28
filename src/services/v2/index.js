import { createHttpService } from './base/httpServiceFactory'

// Services
import { VcsService } from './vcs-service'
import { VcsAdapter } from './adapters/vcs-adapter'

// Edge Firewall Service
import { EdgeFirewallService } from './edge-firewall-service'
import { EdgeFirewallAdapter } from './adapters/edge-firewall-adapter'

const httpService = createHttpService()
const vcsService = new VcsService(httpService, VcsAdapter)
const edgeFirewallService = new EdgeFirewallService(httpService, EdgeFirewallAdapter)

export { vcsService, edgeFirewallService }
