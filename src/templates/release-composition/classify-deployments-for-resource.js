import { releaseResourceId } from '@/stores/release'

const emptyResult = () => ({
  groups: [
    { key: 'linked', deployments: [] },
    { key: 'available', deployments: [] }
  ],
  hidden: []
})

const scopedResourcesOf = (release, scopedType) =>
  (Array.isArray(release?.resources) ? release.resources : []).filter(
    (resource) => resource?.resource_type === scopedType
  )

const matchesResource = (resource, target) => {
  const candidates = [releaseResourceId(resource), resource?.resource_id, resource?.global_id]
  return candidates.some((candidate) => candidate != null && String(candidate) === target)
}

export const classifyDeploymentsForResource = ({
  deployments,
  activeReleaseByDs,
  scopedType,
  scopedResourceId
} = {}) => {
  if (!Array.isArray(deployments)) return emptyResult()

  const releasesByDs =
    activeReleaseByDs && typeof activeReleaseByDs === 'object' ? activeReleaseByDs : {}
  const target = String(scopedResourceId)

  const result = emptyResult()
  const [linkedGroup, availableGroup] = result.groups

  deployments.forEach((deployment) => {
    const release = releasesByDs[deployment?.id] ?? null
    const scopedResources = scopedResourcesOf(release, scopedType)

    const linkedToThis = scopedResources.some((resource) => matchesResource(resource, target))

    if (linkedToThis) {
      linkedGroup.deployments.push(deployment)
      return
    }

    const bindingPolicy = deployment?.binding_policy

    if (bindingPolicy === 'FLEXIBLE') {
      availableGroup.deployments.push(deployment)
      return
    }

    if (bindingPolicy === 'STRICT' && scopedResources.length === 0) {
      availableGroup.deployments.push(deployment)
      return
    }

    result.hidden.push(deployment)
  })

  return result
}
