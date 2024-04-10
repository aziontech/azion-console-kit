/**
 * Lists the available Vulcan presets.
 * Each object has a 'label' property which is the name of the preset and a 'value' property which is the identifier for the preset.
 * @returns {Object[]} An array of objects containing the Vulcan presets.
 */
export const listVulcanPresetsService = () => {
  const vulcanPresets = [
    {
      label: 'Next.js',
      value: 'nextjs',
      icon: ''
    },
    {
      label: 'Angular',
      value: 'angular',
      icon: ''
    },
    {
      label: 'Astro',
      value: 'astro',
      icon: ''
    },
    {
      label: 'Hexo',
      value: 'hexo',
      icon: ''
    },
    {
      label: 'React',
      value: 'react',
      icon: ''
    },
    {
      label: 'Vite',
      value: 'vite',
      icon: ''
    },
    {
      label: 'Vue',
      value: 'vue',
      icon: ''
    },
  ]

  return vulcanPresets
}