/**
 * Coverage-matrix claims (spec versioning-test-coverage / TEST-ARCHITECTURE §3.4).
 * The matrix (tests/coverage-matrix.json) is DERIVED from these markers —
 * run `node scripts/check-coverage-matrix.mjs --write` after changing them.
 * @covers waf:J2 component
 */
import { describeVersionedSubresourceCrud } from '@/tests/shared/versioning/subresource-crud.contract'
import { RESOURCE_TEST_REGISTRY } from '@/tests/support/versioning/registry'

RESOURCE_TEST_REGISTRY.waf.subresources
  .filter((sub) => !sub.bespoke)
  .forEach((sub) => describeVersionedSubresourceCrud({ ownerLabel: 'waf', ...sub }))
