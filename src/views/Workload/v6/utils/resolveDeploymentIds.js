export const resolveDeploymentIds = (bindings) => {
  const ids = []
  const seen = new Set()

  for (const binding of Array.isArray(bindings) ? bindings : []) {
    const deploymentId = binding?.deployment_id
    if (deploymentId == null) continue

    const key = String(deploymentId)
    if (seen.has(key)) continue
    seen.add(key)
    ids.push(key)
  }

  return ids
}
