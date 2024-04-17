const DELIVER_PRESETS = ['nextjs', 'angular', 'astro', 'hexo', 'react', 'vite', 'vue']
const COMPUTE_PRESETS = ['nextjs']
const ALL_PRESETS = [...DELIVER_PRESETS, ...COMPUTE_PRESETS]

/**
 * Returns all presets of a specific type.
 *
 * @param {'deliver'|'compute'} type - The type of preset to return
 * @return {string[]} List of presets of the specified type
 */
export const getVulcanPresets = (type = null) => {
  const presets = {
    deliver: DELIVER_PRESETS, 
    compute: COMPUTE_PRESETS
  }
  return presets[type] || ALL_PRESETS
}
