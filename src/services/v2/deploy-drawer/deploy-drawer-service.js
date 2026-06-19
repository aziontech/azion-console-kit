import { workloadService } from '@/services/v2/workload/workload-service'
import { environmentService } from '@/services/v2/environment/environment-service'
import { deploymentService } from '@/services/v2/deployment/deployment-service'
import { deploymentReleaseService } from '@/services/v2/deployment/deployment-release-service'
import { mapPolicyToLabel } from '@/services/v2/deployment/deployment-adapter'

// Resolves a workload's bindings (ids only) into environment cards with names,
// fetching environment + deployment + active release. Keeps the composable free
// of cross-service plumbing.
export class DeployDrawerService {
  #loadEnvironment = async (id) => {
    try {
      return await environmentService.loadEnvironmentService({ id })
    } catch {
      return null
    }
  }

  #loadDeployment = async (id) => {
    try {
      const { data } = await deploymentService.getDeploymentByIdService(id)
      return data ?? null
    } catch {
      return null
    }
  }

  #loadActiveRelease = async (id) => {
    try {
      return await deploymentReleaseService.getActiveReleaseComposition(id)
    } catch {
      return null
    }
  }

  // Cache fast-path; only hits the per-id endpoint when the id is absent from the
  // (possibly paginated) listing.
  #resolveEnv = (id, environments) => {
    const cached = Array.isArray(environments) ? environments.find((env) => env.id === id) : null
    return cached ?? this.#loadEnvironment(id)
  }

  #resolveDeployment = (id, deployments) => {
    const cached = Array.isArray(deployments)
      ? deployments.find((deployment) => deployment.id === id)
      : null
    return cached ?? this.#loadDeployment(id)
  }

  // Base card: name/policy/deployment only (no release) so it renders instantly
  // from the cached listings; release enrichment is a separate async step.
  #composeBaseCard = async (binding, environments, deployments) => {
    const [environment, deployment] = await Promise.all([
      this.#resolveEnv(binding.environment_id, environments),
      this.#resolveDeployment(binding.deployment_id, deployments)
    ])

    return {
      id: binding.environment_id,
      name: environment?.name ?? binding.environment_id,
      policy: environment?.deployment_policy ?? null,
      policyLabel: environment ? mapPolicyToLabel(environment.deployment_policy) : '',
      deploymentId: binding.deployment_id,
      deploymentName: deployment?.name ?? binding.deployment_id,
      domains: Array.isArray(binding.domains) ? binding.domains : [],
      activeRelease: null,
      activeReleaseName: null,
      workloadCount: null,
      consumes: false
    }
  }

  // Phase 1: bindings from the list item (else workload detail); names from the
  // cached listings (fast-path), per-id only for misses. No release call here.
  loadWorkloadEnvironments = async (workloadId, { bindings, environments, deployments } = {}) => {
    if (!workloadId) return []

    const resolved =
      Array.isArray(bindings) && bindings.length
        ? bindings
        : await workloadService.loadWorkloadBindings(workloadId)

    if (!resolved.length) return []

    return Promise.all(
      resolved.map((binding) => this.#composeBaseCard(binding, environments, deployments))
    )
  }

  // Phase 2 (async, non-blocking): enrich each card with its deployment's active
  // release (name, consumes, workload count). Returns enriched copies.
  enrichReleases = async (cards, resourceType) => {
    if (!Array.isArray(cards) || !cards.length) return cards ?? []

    return Promise.all(
      cards.map(async (card) => {
        const release = await this.#loadActiveRelease(card.deploymentId)
        return {
          ...card,
          activeRelease: release ?? null,
          activeReleaseName: release?.name ?? release?.id ?? null,
          workloadCount: release?.workload_count ?? null,
          consumes: Boolean(
            resourceType &&
            (release?.resources ?? []).some((resource) => resource.resource_type === resourceType)
          )
        }
      })
    )
  }
}

export const deployDrawerService = new DeployDrawerService()
