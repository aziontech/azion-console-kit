const DELIVER_PRESETS = ['nextjs', 'angular', 'astro', 'hexo', 'react', 'vite', 'vue']
const COMPUTE_PRESETS = ['nextjs']

/**
 * @typedef {'nextjs'|'angular'|'astro'|'hexo'|'react'|'vite'|'vue'} PresetName
 */

/**
 * Retrieves the modes based on the preset service name.
 *
 * @param {PresetName} presetName - The name of the preset service
 * @return {string[]} The modes corresponding to the preset service name, or an empty array if not found
 */
export const getModesByPresetService = (presetName) => {
  const modes = []

  if (DELIVER_PRESETS.includes(presetName)) {
    modes.push('deliver')
  }
  if (COMPUTE_PRESETS.includes(presetName)) {
    modes.push('compute')
  }

  return modes
}
