import { RESOURCE_TEST_REGISTRY } from '@/tests/support/versioning/registry'
import { describeCapabilitySurfaces } from '@/tests/shared/versioning/capability-surfaces.contract'

/**
 * Registry-driven capability-surface coverage. The shared contract runs once per
 * resource descriptor, so every resource's declared class (`deployable` /
 * `versioned-only`) is proven across all three surfaces
 * (`getAvailableActions` / `getVersionBarActions` / `buildVersionMenuItems`) —
 * and a resource added to the registry is covered automatically.
 *
 * Read-only: the registry is authored by a parallel agent; we iterate whatever
 * descriptors are present on this branch.
 */
Object.values(RESOURCE_TEST_REGISTRY).forEach((descriptor) => {
  describeCapabilitySurfaces(descriptor)
})
