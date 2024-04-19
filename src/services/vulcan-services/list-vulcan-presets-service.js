/**
 * Lists the available Vulcan presets.
 * Each object has a 'label' property which is the name of the preset and a 'value' property which is the identifier for the preset.
 * @returns {Object[]} An array of objects containing the Vulcan presets.
 */
export const listVulcanPresetsService = () => {
  const vulcanPresets = [
    {
      label: 'Next.js',
      value: 'nextjs'
    },
    {
      label: 'Angular',
      value: 'angular'
    },
    {
      label: 'Astro',
      value: 'astro'
    },
    {
      label: 'Hexo',
      value: 'hexo'
    },
    {
      label: 'React',
      value: 'react'
    },
    {
      label: 'Vite',
      value: 'vite'
    },
    {
      label: 'Vue',
      value: 'vue'
    }
  ]

  return vulcanPresets
}
