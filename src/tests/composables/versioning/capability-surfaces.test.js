import { RESOURCE_TEST_REGISTRY } from '@/tests/support/versioning/registry'
import { describeCapabilitySurfaces } from '@/tests/shared/versioning/capability-surfaces.contract'

Object.values(RESOURCE_TEST_REGISTRY).forEach((descriptor) => {
  describeCapabilitySurfaces(descriptor)
})
