import { getVulcanPresets } from '@/helpers'

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

  if (getVulcanPresets('deliver').includes(presetName)) {
    modes.push('deliver')
  }
  if (getVulcanPresets('compute').includes(presetName)) {
    modes.push('compute')
  }

  return modes
}
