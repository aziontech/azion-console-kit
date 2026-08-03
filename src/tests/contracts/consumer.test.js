import { describe, it, expect } from 'vitest'
import { contractSchemas } from '../../../tests/contracts/schemas'

import { EdgeAppVersionAdapter } from '@/services/v2/edge-app/edge-app-version-adapter'
import { WorkloadVersionAdapter } from '@/services/v2/workload/workload-version-adapter'
import { CustomPageVersionAdapter } from '@/services/v2/custom-page/custom-page-version-adapter'
import { EdgeFirewallVersionAdapter } from '@/services/v2/edge-firewall/edge-firewall-version-adapter'
import { EdgeConnectorVersionAdapter } from '@/services/v2/edge-connectors/edge-connector-version-adapter'
import { EdgeFunctionVersionAdapter } from '@/services/v2/edge-function/edge-function-version-adapter'
import { NetworkListVersionAdapter } from '@/services/v2/network-lists/network-list-version-adapter'
import { WafVersionAdapter } from '@/services/v2/waf/waf-version-adapter'
import { DeploymentVersionAdapter } from '@/services/v2/deployment/deployment-version-adapter'

import applicationFixture from '../../../tests/contracts/fixtures/application.version.json'
import workloadFixture from '../../../tests/contracts/fixtures/workload.version.json'
import customPageFixture from '../../../tests/contracts/fixtures/customPage.version.json'
import edgeFirewallFixture from '../../../tests/contracts/fixtures/edgeFirewall.version.json'
import edgeConnectorFixture from '../../../tests/contracts/fixtures/edgeConnector.version.json'
import edgeFunctionFixture from '../../../tests/contracts/fixtures/edgeFunction.version.json'
import networkListFixture from '../../../tests/contracts/fixtures/networkList.version.json'
import wafFixture from '../../../tests/contracts/fixtures/waf.version.json'
import deploymentFixture from '../../../tests/contracts/fixtures/deployment.version.json'

const validateStrict = (schema, payload) =>
  schema.validateSync(payload, { strict: true, abortEarly: false })

const expectRequestMatches = (resourceKey, requestKind, payload) => {
  const schema = contractSchemas[resourceKey][requestKind]
  expect(() => validateStrict(schema, payload)).not.toThrow()
}

const expectResponseFixtureValid = (resourceKey, fixture) => {
  const { versionResponse } = contractSchemas[resourceKey]
  expect(() => validateStrict(versionResponse, fixture)).not.toThrow()
}

describe('contract consumer — application (Edge App)', () => {
  const adapter = EdgeAppVersionAdapter

  it('RESPONSE: transformLoadVersion extracts identity/state/config from a contract-valid snapshot', () => {
    expectResponseFixtureValid('application', applicationFixture)
    const loaded = adapter.transformLoadVersion(applicationFixture)

    expect(loaded.id).toBe('AVAPP0001')
    expect(loaded.state).toBe('draft')
    expect(loaded.config).toMatchObject({
      name: 'my-app',
      edgeCacheEnabled: true,
      edgeFunctionsEnabled: false,
      applicationAcceleratorEnabled: true,
      imageProcessorEnabled: false,
      tieredCacheEnabled: true,
      isActive: true,
      debug: false
    })
  })

  it('REQUEST: draft / create-draft / build / archive payloads satisfy their schemas', () => {
    const form = adapter.transformLoadVersion(applicationFixture).config

    const draft = adapter.transformDraftPayload({ ...form, comment: 'edit app' })
    expect(draft.modules.cache.enabled).toBe(true)
    expectRequestMatches('application', 'draftRequest', draft)

    const createDraft = adapter.transformCreateDraftPayload({
      sourceVersionId: 'AVAPP0000',
      comment: 'clone app',
      ...form
    })
    expect(createDraft.source_version).toBe('AVAPP0000')
    expectRequestMatches('application', 'draftRequest', createDraft)

    expectRequestMatches(
      'application',
      'buildRequest',
      adapter.transformBuildPayload({ trace_id: 'trace-1', comment: 'build note' })
    )
    expectRequestMatches(
      'application',
      'archiveRequest',
      adapter.transformArchivePayload({ comment: 'archive note' })
    )
  })
})

describe('contract consumer — workload', () => {
  const adapter = WorkloadVersionAdapter

  it('RESPONSE: transformLoadVersion exposes bindings + full config from a contract-valid snapshot', () => {
    expectResponseFixtureValid('workload', workloadFixture)
    const loaded = adapter.transformLoadVersion(workloadFixture)

    expect(loaded.id).toBe('AY2JRCD3')
    expect(loaded.state).toBe('ready')
    expect(loaded.deploymentId).toBe('AXK29QMP')
    expect(loaded.environmentId).toBe('BZ3KSDE4')
    expect(loaded.config.name).toBe('prod-workload')
    expect(loaded.config.active).toBe(true)
    expect(loaded.config.infrastructure).toBe('1')
    expect(loaded.config.protocols.http.useHttps).toBe(true)
    expect(loaded.config.mtls.isEnabled).toBe(false)
  })

  it('REQUEST: draft / create-draft / build / archive payloads satisfy their schemas', () => {
    const form = adapter.transformLoadVersion(workloadFixture).config

    const draft = adapter.transformDraftPayload({ ...form, comment: 'edit workload' })
    expect(draft.name).toBe('prod-workload')
    expect(draft.protocols.http.https_ports).toEqual([443])
    expectRequestMatches('workload', 'draftRequest', draft)

    const createDraft = adapter.transformCreateDraftPayload({
      sourceVersionId: 'PARENT1',
      comment: 'clone workload',
      ...form
    })
    expect(createDraft.source_version).toBe('PARENT1')
    expectRequestMatches('workload', 'draftRequest', createDraft)

    expectRequestMatches(
      'workload',
      'buildRequest',
      adapter.transformBuildPayload({ comment: 'go' })
    )
    expectRequestMatches(
      'workload',
      'archiveRequest',
      adapter.transformArchivePayload({ comment: 'bye' })
    )
  })
})

describe('contract consumer — customPage', () => {
  const adapter = CustomPageVersionAdapter

  it('RESPONSE: transformLoadVersion extracts name/active/pages from a contract-valid snapshot', () => {
    expectResponseFixtureValid('customPage', customPageFixture)
    const loaded = adapter.transformLoadVersion(customPageFixture)

    expect(loaded.id).toBe('AVCPG002')
    expect(loaded.state).toBe('draft')
    expect(loaded.config.name).toBe('maintenance')
    expect(loaded.config.active).toBe(true)
    expect(loaded.config.pages).toHaveLength(2)
    expect(loaded.config.pages[0]).toMatchObject({ type: 'page_default' })
  })

  it('REQUEST: draft / create-draft / build / archive payloads satisfy their schemas', () => {
    const form = { name: 'edited-page', active: false, pages: [] }

    const draft = adapter.transformDraftPayload({ ...form, comment: 'edit page' })
    expect(draft.name).toBe('edited-page')
    expectRequestMatches('customPage', 'draftRequest', draft)

    const createDraft = adapter.transformCreateDraftPayload({
      sourceVersionId: 'AVCPG001',
      comment: 'clone page',
      ...form
    })
    expect(createDraft.source_version).toBe('AVCPG001')
    expectRequestMatches('customPage', 'draftRequest', createDraft)

    expectRequestMatches(
      'customPage',
      'buildRequest',
      adapter.transformBuildPayload({ trace_id: 'trace-1', comment: 'build note' })
    )
    expectRequestMatches(
      'customPage',
      'archiveRequest',
      adapter.transformArchivePayload({ comment: 'archive note' })
    )
  })
})

describe('contract consumer — edgeFirewall', () => {
  const adapter = EdgeFirewallVersionAdapter

  it('RESPONSE: transformLoadVersion maps flat module flags into the UI config', () => {
    expectResponseFixtureValid('edgeFirewall', edgeFirewallFixture)
    const loaded = adapter.transformLoadVersion(edgeFirewallFixture)

    expect(loaded.id).toBe('AVFW0002')
    expect(loaded.state).toBe('draft')
    expect(loaded.config).toMatchObject({
      name: 'edge-firewall-prod',
      isActive: true,
      edgeFunctionsEnabled: true,
      networkProtectionEnabled: false,
      wafEnabled: true,
      ddosProtectionUnmetered: true,
      debugRules: false
    })
  })

  it('REQUEST: draft / create-draft / build / archive payloads satisfy their schemas', () => {
    const form = adapter.transformLoadVersion(edgeFirewallFixture).config

    const draft = adapter.transformDraftPayload({ ...form, comment: 'edit fw' })
    expect(draft.modules.functions.enabled).toBe(true)
    expectRequestMatches('edgeFirewall', 'draftRequest', draft)

    const createDraft = adapter.transformCreateDraftPayload({
      sourceVersionId: 'SRC',
      comment: 'clone fw',
      ...form
    })
    expect(createDraft.source_version).toBe('SRC')
    expectRequestMatches('edgeFirewall', 'draftRequest', createDraft)

    expectRequestMatches(
      'edgeFirewall',
      'buildRequest',
      adapter.transformBuildPayload({ trace_id: 'trace-1', comment: 'build note' })
    )
    expectRequestMatches(
      'edgeFirewall',
      'archiveRequest',
      adapter.transformArchivePayload({ comment: 'archive note' })
    )
  })
})

describe('contract consumer — edgeConnector', () => {
  const adapter = EdgeConnectorVersionAdapter

  it('RESPONSE: transformLoadVersion extracts the full HTTP snapshot from a contract-valid version', () => {
    expectResponseFixtureValid('edgeConnector', edgeConnectorFixture)
    const loaded = adapter.transformLoadVersion(edgeConnectorFixture)

    expect(loaded.id).toBe('AVCONN001')
    expect(loaded.state).toBe('draft')
    expect(loaded.config).toMatchObject({ name: 'http-connector', type: 'http', active: true })
    expect(loaded.config.addresses).toHaveLength(2)
    expect(loaded.config.connectionOptions).toMatchObject({ host: 'app.example.com', path: '/api' })
    expect(loaded.config.modules.loadBalancer.config.maxRetries).toBe(3)
  })

  it('REQUEST: draft / create-draft / build / archive payloads satisfy their schemas', () => {
    const form = adapter.transformLoadVersion(edgeConnectorFixture).config

    const draft = adapter.transformDraftPayload({ ...form, comment: 'edit connector' })
    expect(draft).toMatchObject({ name: 'http-connector', type: 'http', active: true })
    expect(draft.attributes.connection_options.host).toBe('app.example.com')
    expectRequestMatches('edgeConnector', 'draftRequest', draft)

    const createDraft = adapter.transformCreateDraftPayload({
      sourceVersionId: 'AVCONN000',
      comment: 'clone connector',
      ...form
    })
    expect(createDraft.source_version).toBe('AVCONN000')
    expectRequestMatches('edgeConnector', 'draftRequest', createDraft)

    expectRequestMatches(
      'edgeConnector',
      'buildRequest',
      adapter.transformBuildPayload({ trace_id: 'trace-1', comment: 'build note' })
    )
    expectRequestMatches(
      'edgeConnector',
      'archiveRequest',
      adapter.transformArchivePayload({ comment: 'archive note' })
    )
  })
})

describe('contract consumer — edgeFunction', () => {
  const adapter = EdgeFunctionVersionAdapter

  it('RESPONSE: transformLoadVersion coalesces legacy keys into the UI config', () => {
    expectResponseFixtureValid('edgeFunction', edgeFunctionFixture)
    const loaded = adapter.transformLoadVersion(edgeFunctionFixture)

    expect(loaded.id).toBe('AVFN002')
    expect(loaded.state).toBe('draft')
    expect(loaded.config).toMatchObject({
      name: 'my-fn',
      active: true,
      code: 'export default {}',
      runtime: 'azion_js',
      executionEnvironment: 'application',
      azionForm: { fields: [] }
    })
    expect(loaded.config.defaultArgs).toBe(JSON.stringify({ foo: 'bar' }, null, 2))
  })

  it('REQUEST: draft / create-draft / build / archive payloads satisfy their schemas', () => {
    const form = {
      name: 'edited-fn',
      active: false,
      code: 'export default { ok: true }',
      runtime: 'javascript',
      executionEnvironment: 'application',
      defaultArgs: JSON.stringify({ key: 'value' }),
      azionForm: { fields: [] }
    }

    const draft = adapter.transformDraftPayload({ ...form, comment: 'edit fn' })
    expect(draft.runtime).toBe('azion_js')
    expect(draft.execution_environment).toBe('application')
    expectRequestMatches('edgeFunction', 'draftRequest', draft)

    const createDraft = adapter.transformCreateDraftPayload({
      sourceVersionId: 'AVFN001',
      comment: 'clone fn',
      ...form
    })
    expect(createDraft.source_version).toBe('AVFN001')
    expectRequestMatches('edgeFunction', 'draftRequest', createDraft)

    expectRequestMatches(
      'edgeFunction',
      'buildRequest',
      adapter.transformBuildPayload({ trace_id: 'trace-1', comment: 'build note' })
    )
    expectRequestMatches(
      'edgeFunction',
      'archiveRequest',
      adapter.transformArchivePayload({ comment: 'archive note' })
    )
  })
})

describe('contract consumer — networkList', () => {
  const adapter = NetworkListVersionAdapter

  it('RESPONSE: transformLoadVersion extracts the IP/CIDR snapshot from a contract-valid version', () => {
    expectResponseFixtureValid('networkList', networkListFixture)
    const loaded = adapter.transformLoadVersion(networkListFixture)

    expect(loaded.id).toBe('AVNL0001')
    expect(loaded.state).toBe('draft')
    expect(loaded.config).toMatchObject({ name: 'ip-list', networkListType: 'ip_cidr' })
    expect(loaded.config.itemsValues).toBe('10.0.0.0/24\n192.168.0.1')
  })

  it('REQUEST: draft / create-draft / build / archive payloads satisfy their schemas', () => {
    const form = adapter.transformLoadVersion(networkListFixture).config

    const draft = adapter.transformDraftPayload({ ...form, comment: 'edit list' })
    expect(draft).toMatchObject({ name: 'ip-list', type: 'ip_cidr' })
    expect(draft.items).toEqual(['10.0.0.0/24', '192.168.0.1'])
    expectRequestMatches('networkList', 'draftRequest', draft)

    const createDraft = adapter.transformCreateDraftPayload({
      sourceVersionId: 'AVNL0000',
      comment: 'clone list',
      ...form
    })
    expect(createDraft.source_version).toBe('AVNL0000')
    expectRequestMatches('networkList', 'draftRequest', createDraft)

    expectRequestMatches(
      'networkList',
      'buildRequest',
      adapter.transformBuildPayload({ trace_id: 'trace-1', comment: 'build note' })
    )
    expectRequestMatches(
      'networkList',
      'archiveRequest',
      adapter.transformArchivePayload({ comment: 'archive note' })
    )
  })
})

describe('contract consumer — waf', () => {
  const adapter = WafVersionAdapter

  it('RESPONSE: transformLoadVersion extracts Main Settings thresholds from a contract-valid version', () => {
    expectResponseFixtureValid('waf', wafFixture)
    const loaded = adapter.transformLoadVersion(wafFixture)

    expect(loaded.id).toBe('AVWAF0001')
    expect(loaded.state).toBe('draft')
    expect(loaded.config).toMatchObject({ name: 'waf-main', active: true })
    expect(loaded.config.sqlInjection).toBe(true)
    expect(loaded.config.sqlInjectionSensitivity).toBe('high')
    expect(loaded.config.crossSiteScripting).toBe(true)
    expect(loaded.config.crossSiteScriptingSensitivity).toBe('low')
  })

  it('REQUEST: draft / create-draft / build / archive payloads satisfy their schemas', () => {
    const form = adapter.transformLoadVersion(wafFixture).config

    const draft = adapter.transformDraftPayload({ ...form, comment: 'edit waf' })
    expect(draft).toMatchObject({ name: 'waf-main', active: true })
    expect(draft.engine_settings.attributes.thresholds).toEqual(
      expect.arrayContaining([{ threat: 'sql_injection', sensitivity: 'high' }])
    )
    expectRequestMatches('waf', 'draftRequest', draft)

    const createDraft = adapter.transformCreateDraftPayload({
      sourceVersionId: 'AVWAF0000',
      comment: 'clone waf',
      ...form
    })
    expect(createDraft.source_version).toBe('AVWAF0000')
    expectRequestMatches('waf', 'draftRequest', createDraft)

    expectRequestMatches(
      'waf',
      'buildRequest',
      adapter.transformBuildPayload({ trace_id: 'trace-1', comment: 'build note' })
    )
    expectRequestMatches(
      'waf',
      'archiveRequest',
      adapter.transformArchivePayload({ comment: 'archive note' })
    )
  })
})

describe('contract consumer — deployment (divergent envelope)', () => {
  const adapter = DeploymentVersionAdapter

  it('RESPONSE: transformLoadVersion keys identity off `id` and maps resources[]', () => {
    expectResponseFixtureValid('deployment', deploymentFixture)
    const loaded = adapter.transformLoadVersion(deploymentFixture)

    expect(loaded.id).toBe('AVDEP0001')
    expect(loaded.deployment_id).toBe('ADEP0001')
    expect(loaded.state).toBe('ready')
    expect(loaded.status).toEqual({ content: 'Ready', severity: 'success' })
    expect(loaded.resources).toHaveLength(2)
    expect(loaded.resources[0]).toMatchObject({
      id: 900,
      type: 'application',
      versionId: 'AVAPP0007'
    })
  })

  it('REQUEST: draft (resource selection) / build+archive (reason) payloads satisfy their schemas', () => {
    const createDraft = adapter.transformCreateDraftPayload({
      strategy: 'canary',
      origin: 'console',
      resources: [
        { id: 900, resource_type: 'application', extra: 'dropped' },
        { id: 901, resource_type: 'firewall' }
      ]
    })
    expect(createDraft.resources).toEqual([
      { id: 900, resource_type: 'application' },
      { id: 901, resource_type: 'firewall' }
    ])
    expectRequestMatches('deployment', 'draftRequest', createDraft)

    const draft = adapter.transformDraftPayload({ strategy: 'atomic' })
    expect(draft).toEqual({ strategy: 'atomic' })
    expectRequestMatches('deployment', 'draftRequest', draft)

    expectRequestMatches(
      'deployment',
      'buildRequest',
      adapter.transformBuildPayload({ reason: 'go-live', comment: 'ship note' })
    )
    expectRequestMatches(
      'deployment',
      'archiveRequest',
      adapter.transformArchivePayload({ reason: 'rollback', comment: 'archive note' })
    )
  })
})
