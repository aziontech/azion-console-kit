import { describeVersionedSubresourceCrud } from '@/tests/shared/versioning/subresource-crud.contract'
import { RESOURCE_TEST_REGISTRY } from '@/tests/support/versioning/registry'

RESOURCE_TEST_REGISTRY.waf.subresources
  .filter((sub) => !sub.bespoke)
  .forEach((sub) => describeVersionedSubresourceCrud({ ownerLabel: 'waf', ...sub }))
