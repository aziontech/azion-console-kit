/**
 * Contract-schema registry for versioned resources. Each entry is the single
 * source of truth for the request/response shapes the FRONT depends on, derived
 * from the real adapters in `src/services/v2/**`. Fixtures and the pre-deploy
 * drift check both validate against these.
 *
 *   versionResponse — envelope + config fields the adapter READS from a snapshot
 *   draftRequest    — root fields the adapter WRITES on create/edit draft
 *   buildRequest    — build payload
 *   archiveRequest  — archive payload
 */
import * as application from './application.schema'
import * as workload from './workload.schema'
import * as customPage from './custom-page.schema'
import * as edgeFirewall from './edge-firewall.schema'
import * as edgeConnector from './edge-connector.schema'
import * as edgeFunction from './edge-function.schema'
import * as networkList from './network-list.schema'
import * as waf from './waf.schema'
import * as deployment from './deployment.schema'

const toEntry = (resource) => ({
  versionResponse: resource.versionResponse,
  draftRequest: resource.draftRequest,
  buildRequest: resource.buildRequest,
  archiveRequest: resource.archiveRequest
})

export const contractSchemas = {
  application: toEntry(application),
  workload: toEntry(workload),
  customPage: toEntry(customPage),
  edgeFirewall: toEntry(edgeFirewall),
  edgeConnector: toEntry(edgeConnector),
  edgeFunction: toEntry(edgeFunction),
  networkList: toEntry(networkList),
  waf: toEntry(waf),
  deployment: toEntry(deployment)
}

export default contractSchemas
