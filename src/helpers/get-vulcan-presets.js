const DELIVER_PRESETS = ['next', 'angular', 'astro', 'hexo', 'react', 'vue']
const COMPUTE_PRESETS = ['next']
const ALL_PRESETS = [...new Set([...DELIVER_PRESETS, ...COMPUTE_PRESETS])]

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
