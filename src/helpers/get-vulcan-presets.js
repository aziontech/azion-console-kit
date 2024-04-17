/**
 * Returns all presets of a specific type.
 *
 * @param {'deliver'|'compute'} type - The type of preset to return
 * @return {string[]} List of presets of the specified type
 */
export const getVulcanPresets = (type = null) => {
  const DELIVER_PRESETS = ['nextjs', 'angular', 'astro', 'hexo', 'react', 'vite', 'vue']
  const COMPUTE_PRESETS = ['nextjs']

  if (type === 'deliver') {
    return DELIVER_PRESETS
  }

  if (type === 'compute') {
    return COMPUTE_PRESETS
  }

  const allPresets = [...DELIVER_PRESETS, ...COMPUTE_PRESETS]
  return allPresets
}
