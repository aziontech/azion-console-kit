import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { describeVersionedSubresourceCrud } from '@/tests/shared/versioning/subresource-crud.contract'
import { versionedWafExceptionsService } from '@/services/v2/waf/versioned/versioned-waf-exceptions-service'

/**
 * WAF versioned sub-resources.
 *
 * `exceptions` (allowed rules) is produced by `createVersionedSubResourceService`,
 * so it runs the shared factory-contract suite.
 *
 * OVERLAP: `versioned-waf-exceptions-service.test.js` already covers this service
 * with hand-written per-method tests. The shared instantiation COEXISTS with it
 * (both green); consolidation is deferred to F4 — do not delete the existing file.
 *
 * TODO (F4): move this sub-resource descriptor into
 * `RESOURCE_TEST_REGISTRY.waf.subresources` (it carries only `{ key, service }`
 * on this branch).
 */
describeVersionedSubresourceCrud({
  ownerLabel: 'waf',
  subKey: 'exceptions',
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
})
