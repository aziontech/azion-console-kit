import { describeVersionedSubresourceCrud } from '@/tests/shared/versioning/subresource-crud.contract'
import { RESOURCE_TEST_REGISTRY } from '@/tests/support/versioning/registry'

/**
 * WAF versioned sub-resources — registry-driven (TEST-ARCHITECTURE §3.3).
 *
 * `exceptions` (allowed rules) is produced by `createVersionedSubResourceService`,
 * so it runs the shared factory-contract suite, fed entirely from
 * `RESOURCE_TEST_REGISTRY.waf.subresources`. This is now the SINGLE source of truth
 * for the versioned exceptions service — the former hand-written
 * `versioned-waf-exceptions-service.test.js` was deleted in F4 because every one of
 * its its (list/load/create/edit/remove, incl. the exact success messages) is a
 * strict subset of this shared contract, which additionally proves the search-skip
 * read and the (rid, vid) version-isolation invariant.
 */

RESOURCE_TEST_REGISTRY.waf.subresources
  .filter((sub) => !sub.bespoke)
  .forEach((sub) => describeVersionedSubresourceCrud({ ownerLabel: 'waf', ...sub }))
