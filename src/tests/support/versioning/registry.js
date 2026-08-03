import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { contractSchemas } from '../../../../tests/contracts/schemas'
import { buildVersionResponse, buildFormValues } from './builders'

import {
  EdgeAppVersionService,
  edgeAppVersionService
} from '@/services/v2/edge-app/edge-app-version-service'
import { WafVersionService, wafVersionService } from '@/services/v2/waf/waf-version-service'
import {
  NetworkListVersionService,
  networkListVersionService
} from '@/services/v2/network-lists/network-list-version-service'
import {
  EdgeFunctionVersionService,
  edgeFunctionVersionService
} from '@/services/v2/edge-function/edge-function-version-service'
import {
  WorkloadVersionService,
  workloadVersionService
} from '@/services/v2/workload/workload-version-service'
import {
  DeploymentVersionService,
  deploymentVersionService
} from '@/services/v2/deployment/deployment-version-service'
import {
  CustomPageVersionService,
  customPageVersionService
} from '@/services/v2/custom-page/custom-page-version-service'
import {
  EdgeFirewallVersionService,
  edgeFirewallVersionService
} from '@/services/v2/edge-firewall/edge-firewall-version-service'
import {
  EdgeConnectorVersionService,
  edgeConnectorVersionService
} from '@/services/v2/edge-connectors/edge-connector-version-service'

import { EdgeAppVersionAdapter } from '@/services/v2/edge-app/edge-app-version-adapter'
import { WafVersionAdapter } from '@/services/v2/waf/waf-version-adapter'
import { NetworkListVersionAdapter } from '@/services/v2/network-lists/network-list-version-adapter'
import { EdgeFunctionVersionAdapter } from '@/services/v2/edge-function/edge-function-version-adapter'
import { WorkloadVersionAdapter } from '@/services/v2/workload/workload-version-adapter'
import { DeploymentVersionAdapter } from '@/services/v2/deployment/deployment-version-adapter'
import { CustomPageVersionAdapter } from '@/services/v2/custom-page/custom-page-version-adapter'
import { EdgeFirewallVersionAdapter } from '@/services/v2/edge-firewall/edge-firewall-version-adapter'
import { EdgeConnectorVersionAdapter } from '@/services/v2/edge-connectors/edge-connector-version-adapter'

import { versionedCacheSettingsService } from '@/services/v2/edge-app/versioned/versioned-cache-settings-service'
import { versionedDeviceGroupService } from '@/services/v2/edge-app/versioned/versioned-device-group-service'
import { versionedFunctionService } from '@/services/v2/edge-app/versioned/versioned-function-service'
import { versionedRulesEngineService } from '@/services/v2/edge-app/versioned/versioned-rules-engine-service'
import { versionedWafExceptionsService } from '@/services/v2/waf/versioned/versioned-waf-exceptions-service'
import { versionedFirewallFunctionService } from '@/services/v2/edge-firewall/versioned/versioned-firewall-function-service'
import { versionedFirewallRulesEngineService } from '@/services/v2/edge-firewall/versioned/versioned-firewall-rules-engine-service'

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url))
const servicePath = (relative) => resolve(CURRENT_DIR, '../../../services/v2', relative)

export const RESOURCE_TEST_REGISTRY = {
  application: {
    resourceType: 'application',
    resourceKey: 'application',
    capabilityClass: 'deployable',
    ServiceClass: EdgeAppVersionService,
    service: () => edgeAppVersionService,
    adapter: EdgeAppVersionAdapter,
    schemas: contractSchemas.application,
    baseURL: 'v4/workspace/applications',
    versionKeys: queryKeys.application.version,
    serviceModulePath: servicePath('edge-app/edge-app-version-service.js'),
    buildVersion: (overrides) => buildVersionResponse('application', overrides),
    buildFormValues: () => buildFormValues('application'),
    configMarkers: {
      name: 'my-app',
      edgeCacheEnabled: true,
      edgeFunctionsEnabled: false,
      applicationAcceleratorEnabled: true,
      imageProcessorEnabled: false,
      tieredCacheEnabled: true,
      isActive: true,
      debug: false
    },
    payloadMarkers: { name: 'app', active: true, modules: { cache: { enabled: true } } },
    metadataOnly: { config: {}, exact: true },
    saveStrategy: 'default',
    updateVerb: 'PATCH',
    envelope: 'standard',
    polymorphic: false,
    mapMetaFields: [],
    extraMutations: [],
    overridesActionPayloads: false,
    subresources: [
      {
        key: 'cacheSettings',
        service: () => versionedCacheSettingsService,
        path: 'cache_settings',
        queryKeyGroup: queryKeys.application.version.cacheSettings,
        idKey: 'cacheId',
        buildPayload: () => ({
          name: 'cs-1',
          browserCacheSettings: 'honor',
          cdnCacheSettings: 'honor',
          cacheByQueryString: 'ignore',
          cacheByCookies: 'ignore',
          adaptiveDeliveryAction: 'ignore'
        })
      },
      {
        key: 'deviceGroups',
        service: () => versionedDeviceGroupService,
        path: 'device_groups',
        queryKeyGroup: queryKeys.application.version.deviceGroups,
        buildPayload: () => ({ name: 'dg-1', userAgent: 'Mozilla/5.0' })
      },
      {
        key: 'functions',
        service: () => versionedFunctionService,
        path: 'functions',
        queryKeyGroup: queryKeys.application.version.functions,
        buildPayload: () => ({ name: 'fn-1', edgeFunctionID: 3, args: '{}', azionForm: '{}' })
      },
      { key: 'rulesEngine', service: () => versionedRulesEngineService, bespoke: true }
    ]
  },

  waf: {
    resourceType: 'waf',
    resourceKey: 'waf',
    capabilityClass: 'versioned-only',
    ServiceClass: WafVersionService,
    service: () => wafVersionService,
    adapter: WafVersionAdapter,
    schemas: contractSchemas.waf,
    baseURL: 'v4/workspace/wafs',
    versionKeys: queryKeys.waf.version,
    serviceModulePath: servicePath('waf/waf-version-service.js'),
    buildVersion: (overrides) => buildVersionResponse('waf', overrides),
    buildFormValues: () => buildFormValues('waf'),
    configMarkers: {
      id: 902,
      name: 'waf-main',
      active: true,
      sqlInjection: true,
      sqlInjectionSensitivity: 'high',
      crossSiteScripting: true,
      crossSiteScriptingSensitivity: 'low'
    },
    payloadMarkers: {
      name: 'waf-main',
      active: true,
      engine_settings: {
        attributes: { thresholds: [{ threat: 'sql_injection', sensitivity: 'high' }] }
      }
    },
    metadataOnly: {
      config: { sqlInjection: false, sqlInjectionSensitivity: 'medium', unwantedAccess: false },
      exact: false
    },
    saveStrategy: 'default',
    updateVerb: 'PATCH',
    envelope: 'standard',
    polymorphic: false,
    mapMetaFields: [],
    extraMutations: [],
    overridesActionPayloads: false,
    subresources: [
      {
        key: 'exceptions',
        service: () => versionedWafExceptionsService,
        path: 'exceptions',
        queryKeyGroup: queryKeys.waf.version.exceptions,
        buildPayload: () => ({
          name: 'allow-1',
          path: '/x',
          ruleId: 9,
          status: true,
          conditions: []
        })
      }
    ]
  },

  network_list: {
    resourceType: 'network_list',
    resourceKey: 'networkList',
    capabilityClass: 'versioned-only',
    ServiceClass: NetworkListVersionService,
    service: () => networkListVersionService,
    adapter: NetworkListVersionAdapter,
    schemas: contractSchemas.networkList,
    baseURL: 'v4/workspace/network_lists',
    versionKeys: queryKeys.networkList.version,
    serviceModulePath: servicePath('network-lists/network-list-version-service.js'),
    buildVersion: (overrides) => buildVersionResponse('networkList', overrides),
    buildFormValues: () => buildFormValues('networkList'),
    configMarkers: {
      id: 701,
      name: 'ip-list',
      networkListType: 'ip_cidr',
      itemsValues: '10.0.0.0/24\n192.168.0.1'
    },
    payloadMarkers: { name: 'ip-list', type: 'ip_cidr', items: ['10.0.0.0/24', '192.168.0.1'] },
    metadataOnly: { config: {}, exact: true },
    saveStrategy: 'default',
    updateVerb: 'PATCH',
    envelope: 'standard',
    polymorphic: false,
    mapMetaFields: [],
    extraMutations: [],
    overridesActionPayloads: false,
    subresources: []
  },

  function: {
    resourceType: 'function',
    resourceKey: 'edgeFunction',
    capabilityClass: 'versioned-only',
    ServiceClass: EdgeFunctionVersionService,
    service: () => edgeFunctionVersionService,
    adapter: EdgeFunctionVersionAdapter,
    schemas: contractSchemas.edgeFunction,
    baseURL: 'v4/workspace/functions',
    versionKeys: queryKeys.edgeFunction.version,
    serviceModulePath: servicePath('edge-function/edge-function-version-service.js'),
    buildVersion: (overrides) => buildVersionResponse('edgeFunction', overrides),
    buildFormValues: () => buildFormValues('edgeFunction'),
    configMarkers: {
      name: 'my-fn',
      active: true,
      code: 'export default {}',
      runtime: 'azion_js',
      executionEnvironment: 'application'
    },
    payloadMarkers: { name: 'my-fn', runtime: 'azion_js', execution_environment: 'application' },
    metadataOnly: { config: {}, exact: true },
    saveStrategy: 'default',
    updateVerb: 'PATCH',
    envelope: 'standard',
    polymorphic: false,
    mapMetaFields: [],
    extraMutations: [],
    overridesActionPayloads: false,
    subresources: []
  },

  workload: {
    resourceType: 'workload',
    resourceKey: 'workload',
    capabilityClass: 'deployable',
    ServiceClass: WorkloadVersionService,
    service: () => workloadVersionService,
    adapter: WorkloadVersionAdapter,
    schemas: contractSchemas.workload,
    baseURL: 'v4/workspace/workloads',
    versionKeys: queryKeys.workload.version,
    serviceModulePath: servicePath('workload/workload-version-service.js'),
    buildVersion: (overrides) => buildVersionResponse('workload', overrides),
    buildFormValues: () => buildFormValues('workload'),
    configMarkers: {
      id: 54321,
      name: 'prod-workload',
      active: true,
      infrastructure: '1',
      mtls: { isEnabled: false },
      protocols: { http: { useHttps: true, useHttp3: false } },
      tls: { minimumVersion: 'tls_1_2' }
    },
    payloadMarkers: { name: 'my-workload', active: true, infrastructure: 1 },
    metadataOnly: { config: {}, exact: true },
    saveStrategy: 'workload',
    updateVerb: 'PATCH',
    envelope: 'standard',
    polymorphic: false,
    mapMetaFields: ['deploymentId', 'environmentId', 'lastError'],
    extraMutations: ['rollback'],
    overridesActionPayloads: true,
    draftCarriesSourceVersion: false,
    subresources: []
  },

  custom_page: {
    resourceType: 'custom_page',
    resourceKey: 'customPage',
    capabilityClass: 'deployable',
    ServiceClass: CustomPageVersionService,
    service: () => customPageVersionService,
    adapter: CustomPageVersionAdapter,
    schemas: contractSchemas.customPage,
    baseURL: 'v4/workspace/custom_pages',
    versionKeys: queryKeys.customPages.version,
    serviceModulePath: servicePath('custom-page/custom-page-version-service.js'),
    buildVersion: (overrides) => buildVersionResponse('customPage', overrides),
    buildFormValues: () => buildFormValues('customPage'),
    configMarkers: { name: 'maintenance', active: true },
    payloadMarkers: { name: 'maintenance', active: true },
    metadataOnly: { config: {}, exact: true },
    saveStrategy: 'customPage',
    updateVerb: 'PATCH',
    envelope: 'standard',
    polymorphic: false,
    mapMetaFields: [],
    extraMutations: [],
    overridesActionPayloads: false,
    subresources: []
  },

  firewall: {
    resourceType: 'firewall',
    resourceKey: 'edgeFirewall',
    capabilityClass: 'deployable',
    ServiceClass: EdgeFirewallVersionService,
    service: () => edgeFirewallVersionService,
    adapter: EdgeFirewallVersionAdapter,
    schemas: contractSchemas.edgeFirewall,
    baseURL: 'v4/workspace/firewalls',
    versionKeys: queryKeys.firewall.version,
    serviceModulePath: servicePath('edge-firewall/edge-firewall-version-service.js'),
    buildVersion: (overrides) => buildVersionResponse('edgeFirewall', overrides),
    buildFormValues: () => buildFormValues('edgeFirewall'),
    configMarkers: {
      name: 'edge-firewall-prod',
      isActive: true,
      edgeFunctionsEnabled: true,
      networkProtectionEnabled: false,
      wafEnabled: true,
      ddosProtectionUnmetered: true,
      debugRules: false
    },
    payloadMarkers: {
      name: 'edge-firewall-prod',
      active: true,
      modules: {
        ddos_protection: { enabled: true },
        functions: { enabled: true },
        network_protection: { enabled: false },
        waf: { enabled: true }
      },
      debug: false
    },
    metadataOnly: { config: {}, exact: true },
    saveStrategy: 'default',
    updateVerb: 'PATCH',
    envelope: 'standard',
    polymorphic: false,
    mapMetaFields: [],
    extraMutations: [],
    overridesActionPayloads: false,
    subresources: [
      { key: 'firewallFunction', service: () => versionedFirewallFunctionService, bespoke: true },
      {
        key: 'firewallRulesEngine',
        service: () => versionedFirewallRulesEngineService,
        bespoke: true
      }
    ]
  },

  connector: {
    resourceType: 'connector',
    resourceKey: 'edgeConnector',
    capabilityClass: 'deployable',
    ServiceClass: EdgeConnectorVersionService,
    service: () => edgeConnectorVersionService,
    adapter: EdgeConnectorVersionAdapter,
    schemas: contractSchemas.edgeConnector,
    baseURL: 'v4/workspace/connectors',
    versionKeys: queryKeys.connector.version,
    serviceModulePath: servicePath('edge-connectors/edge-connector-version-service.js'),
    buildVersion: (overrides) => buildVersionResponse('edgeConnector', overrides),
    buildFormValues: () => buildFormValues('edgeConnector'),
    configMarkers: { id: 901, name: 'http-connector', type: 'http', active: true },
    payloadMarkers: { name: 'storage-connector', type: 'storage', active: true },
    metadataOnly: { config: {}, exact: true },
    saveStrategy: 'default',
    updateVerb: 'PATCH',
    envelope: 'standard',
    polymorphic: true,
    mapMetaFields: [],
    extraMutations: [],
    overridesActionPayloads: false,
    subresources: []
  },

  deployment: {
    resourceType: 'deployment',
    resourceKey: 'deployment',
    capabilityClass: 'deployable',
    ServiceClass: DeploymentVersionService,
    service: () => deploymentVersionService,
    adapter: DeploymentVersionAdapter,
    schemas: contractSchemas.deployment,
    baseURL: '/deployment-api/v4/deployments',
    versionKeys: queryKeys.deployments.versions,
    serviceModulePath: servicePath('deployment/deployment-version-service.js'),
    buildVersion: (overrides) => buildVersionResponse('deployment', overrides),
    saveStrategy: 'deployment',
    updateVerb: 'PATCH',
    envelope: 'wrapped',
    polymorphic: false,
    mapMetaFields: [],
    extraMutations: [],
    overridesActionPayloads: true,
    subresources: []
  }
}
