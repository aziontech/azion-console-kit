import { workloadService } from '@/services/v2/workload/workload-service'
import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
import { variablesService } from '@/services/v2/variables/variables-service'
import { edgeConnectorsService } from '@/services/v2/edge-connectors/edge-connectors-service'
import { edgeDNSService } from '@/services/v2/edge-dns/edge-dns-service'
import { edgeFirewallService } from '@/services/v2/edge-firewall/edge-firewall-service'
import { edgeNodeService } from '@/services/v2/edge-node/edge-node-service'
import { dataStreamService } from '@/services/v2/data-stream/data-stream-service'
import { digitalCertificatesService } from '@/services/v2/digital-certificates/digital-certificates-service'
import { customPageService } from '@/services/v2/custom-page/custom-page-service'
import { edgeServiceService } from '@/services/v2/edge-service/edge-service-service'
import { edgeFunctionService } from '@/services/v2/edge-function/edge-function-service'
import { networkListsService } from '@/services/v2/network-lists/network-lists-service'
import { wafService } from '@/services/v2/waf/waf-service'
import { edgeStorageService } from '@/services/v2/edge-storage/edge-storage-service'
import { edgeSQLService } from '@/services/v2/edge-sql/edge-sql-service'

const defaultDropdownParams = { page: 1, pageSize: 100, ordering: 'name' }

export const resourceRegistry = Object.freeze({
  workload: {
    list: (params) => workloadService.listWorkloads(params),
    idField: 'id',
    labelField: 'name',
    defaultParams: defaultDropdownParams
  },
  application: {
    list: (params) => edgeAppService.listEdgeApplicationsServiceDropdown(params),
    idField: 'id',
    labelField: 'name',
    defaultParams: defaultDropdownParams
  },
  variable: {
    list: (params) => variablesService.list(params),
    idField: 'uuid',
    labelField: 'key',
    defaultParams: {}
  },
  connector: {
    list: (params) => edgeConnectorsService.listEdgeConnectorsDropDownService(params),
    idField: 'id',
    labelField: 'name',
    defaultParams: defaultDropdownParams
  },
  edgeDns: {
    list: (params) => edgeDNSService.listEdgeDNSService(params),
    idField: 'id',
    labelField: 'name',
    defaultParams: defaultDropdownParams
  },
  firewall: {
    list: (params) => edgeFirewallService.listEdgeFirewallServiceDropdown(params),
    idField: 'id',
    labelField: 'name',
    defaultParams: defaultDropdownParams
  },
  edgeNode: {
    list: (params) => edgeNodeService.listEdgeNodeService(params),
    idField: 'id',
    labelField: 'name',
    defaultParams: defaultDropdownParams
  },
  dataStream: {
    list: (params) => dataStreamService.listDataStreamService(params),
    idField: 'id',
    labelField: 'name',
    defaultParams: defaultDropdownParams
  },
  digitalCertificate: {
    list: (params) => digitalCertificatesService.listDigitalCertificatesDropdown(params),
    idField: 'id',
    labelField: 'name',
    defaultParams: defaultDropdownParams
  },
  customPage: {
    list: (params) => customPageService.listCustomPagesService(params),
    idField: 'id',
    labelField: 'name',
    defaultParams: defaultDropdownParams
  },
  edgeService: {
    list: (params) => edgeServiceService.listEdgeServiceService(params),
    idField: 'id',
    labelField: 'name',
    defaultParams: defaultDropdownParams
  },
  function: {
    list: (params) => edgeFunctionService.listEdgeFunctionsDropdown(params),
    idField: 'id',
    labelField: 'name',
    defaultParams: defaultDropdownParams
  },
  networkList: {
    list: (params) => networkListsService.listNetworkListsDropdown(params),
    idField: 'id',
    labelField: 'name',
    defaultParams: defaultDropdownParams
  },
  wafRule: {
    list: (params) => wafService.listWafRules(params),
    idField: 'id',
    labelField: 'name',
    defaultParams: defaultDropdownParams
  },
  objectStorage: {
    list: (params) => edgeStorageService.listEdgeStorageBuckets(params),
    idField: 'name',
    labelField: 'name',
    defaultParams: defaultDropdownParams
  },
  sqlDatabase: {
    list: (params) => edgeSQLService.listDatabases(params),
    idField: 'id',
    labelField: 'name',
    defaultParams: defaultDropdownParams
  }
})

export const hasResourceListing = (kind) => Boolean(resourceRegistry[kind])
