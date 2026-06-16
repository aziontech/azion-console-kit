/**
 * Orchestrator composable for the reusable Deploy/Release drawer.
 *
 * Owns the whole data flow described in `specs/deploy-release-drawer/design.md`
 * §3.5: it fires the three listing queries on open (workloads, environments,
 * deployments) via the existing v2 services, derives the progressive steps from
 * the selected workload's `bindings`, and dispatches a one-shot release through
 * `deploymentReleaseService.buildAndActivate`.
 *
 * Adaptable per `create-adaptable-composable`: `resourceContext` and `visible`
 * may be a plain value, ref, or getter — both are unwrapped with `toValue`
 * inside the reactive derivations. The composable is pure in its derivations
 * (computeds over already-fetched lists), holds no UI, and issues zero direct
 * HTTP — all I/O lives in the v2 services it consumes.
 */

import { ref, computed, watch, toValue } from 'vue'
import { workloadService } from '@/services/v2/workload/workload-service'
import { environmentService } from '@/services/v2/environment/environment-service'
import { deploymentService } from '@/services/v2/deployment/deployment-service'
import { deploymentReleaseService } from '@/services/v2/deployment/deployment-release-service'
import { DeploymentAdapter, mapPolicyToLabel } from '@/services/v2/deployment/deployment-adapter'

/**
 * @typedef {Object} ResourceContext
 * @property {string} resourceType  Origin resource type (e.g. `application`).
 * @property {number} resourceId    Origin resource id (`resources[].resource_id`).
 * @property {string} resourceName  Origin resource name (`resources[].name`).
 * @property {{ id: string } | null} version  Prefill version (`id` = version_id ULID).
 * @property {Array<{ label: string, value: string }>} versions  Selectable version options.
 */

/**
 * @param {import('vue').MaybeRefOrGetter<ResourceContext>} resourceContext
 * @param {{ visible: import('vue').MaybeRefOrGetter<boolean> }} options
 */
export function useDeployDrawer(resourceContext, { visible } = {}) {
  // `enabled` gates fetching to the drawer's open state (req 1.1, 1.5): closed
  // drawer never fetches, reopen reuses the vue-query cache.
  const enabled = computed(() => Boolean(toValue(visible)))

  const workloadsQuery = workloadService.useWorkloadsListQuery({ enabled })
  const environmentsQuery = environmentService.useEnvironmentsListQuery({ enabled })
  const deploymentsQuery = deploymentService.useDeploymentsListQuery({ enabled })

  const queries = [workloadsQuery, environmentsQuery, deploymentsQuery]

  // Aggregated loading/error across the three listings (req 1.2, 1.4).
  const isLoading = computed(() => queries.some((query) => query.isLoading.value))
  const hasError = computed(() => queries.some((query) => query.isError.value))

  const refetch = () => {
    queries.forEach((query) => query.refetch())
  }

  // --- Step 1: workload selection -----------------------------------------

  const workloadsBody = computed(() => workloadsQuery.data.value?.body ?? [])
  const environmentsBody = computed(() => environmentsQuery.data.value?.body ?? [])
  const deploymentsBody = computed(() => deploymentsQuery.data.value?.body ?? [])

  // `name` comes from the workload adapter as `{ text, tagProps }`; fall back to
  // a plain string for resilience (req 2.1).
  const workloadOptions = computed(() =>
    workloadsBody.value.map((workload) => ({
      label: workload.name?.text ?? workload.name,
      value: workload.id
    }))
  )

  const selectedWorkloadId = ref(null)

  const selectedWorkload = computed(
    () => workloadsBody.value.find((workload) => workload.id === selectedWorkloadId.value) ?? null
  )

  // `bindings` is the seam onto environment/deployment derivation (design §5.0).
  // Absent/empty bindings block the flow (req 2.4).
  const workloadBindings = computed(() => selectedWorkload.value?.bindings ?? [])

  const workloadHasBindings = computed(() => workloadBindings.value.length > 0)

  // --- Step 2: environment selection --------------------------------------

  // One card per binding (req 2.2, 3.1, 3.3). The listings only enrich the card
  // (name, policy, deployment name); a binding whose env/deployment is missing
  // from the listing degrades to its short_id and still allows dispatch (§7.5).
  const environmentCards = computed(() => {
    if (!workloadHasBindings.value) return []

    return workloadBindings.value.map((binding) => {
      const environment = environmentsBody.value.find((env) => env.id === binding.environment_id)
      const deployment = deploymentsBody.value.find((dep) => dep.id === binding.deployment_id)

      return {
        id: binding.environment_id,
        name: environment?.name ?? binding.environment_id,
        policyLabel: environment ? mapPolicyToLabel(environment.deployment_policy) : '',
        deploymentName: deployment?.name ?? binding.deployment_id,
        deploymentId: binding.deployment_id
      }
    })
  })

  const selectedEnvironmentId = ref(null)

  const selectedEnvironmentCard = computed(
    () => environmentCards.value.find((card) => card.id === selectedEnvironmentId.value) ?? null
  )

  // Target deployment short_id used directly in the build_and_activate URL (req 3.4).
  const targetDeploymentId = computed(() => selectedEnvironmentCard.value?.deploymentId ?? null)

  // --- Step 3: resource + version -----------------------------------------

  const resourceName = computed(() => toValue(resourceContext)?.resourceName ?? '')

  // Version options and prefill come from the origin resource, not the workload
  // (req 4.1–4.3).
  const versionOptions = computed(() => toValue(resourceContext)?.versions ?? [])

  const selectedVersionId = ref(toValue(resourceContext)?.version?.id ?? null)

  // Switching workload invalidates the environment selection (req 2.5). The
  // version is the resource's, not the workload's — it is intentionally kept.
  watch(selectedWorkloadId, () => {
    selectedEnvironmentId.value = null
  })

  // --- Dispatch ------------------------------------------------------------

  const isDeploying = ref(false)
  const deployError = ref(null)

  const canDeploy = computed(
    () =>
      Boolean(selectedWorkloadId.value) &&
      Boolean(selectedEnvironmentId.value) &&
      Boolean(selectedVersionId.value) &&
      workloadHasBindings.value &&
      !isDeploying.value
  )

  /**
   * Dispatches the one-shot release. Builds the payload via the deployment
   * adapter and posts through the release service; manages `isDeploying`/
   * `deployError` and rethrows so the caller can surface the API error without
   * losing form state (req 5.1–5.3, 5.5). Returns the service result on success.
   */
  const deploy = async () => {
    isDeploying.value = true
    deployError.value = null

    try {
      const payload = DeploymentAdapter.transformBuildAndActivatePayload(
        toValue(resourceContext),
        selectedVersionId.value
      )

      return await deploymentReleaseService.buildAndActivate(targetDeploymentId.value, payload)
    } catch (error) {
      deployError.value = error
      throw error
    } finally {
      isDeploying.value = false
    }
  }

  return {
    isLoading,
    hasError,
    refetch,
    workloadOptions,
    selectedWorkloadId,
    workloadHasBindings,
    environmentCards,
    selectedEnvironmentId,
    targetDeploymentId,
    resourceName,
    versionOptions,
    selectedVersionId,
    canDeploy,
    isDeploying,
    deployError,
    deploy
  }
}
