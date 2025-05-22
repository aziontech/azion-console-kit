export const listVulcanPresetsService = async () => {
  const mockPresets = [
    {
      label: 'Next.js',
      value: 'next'
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
      label: 'Vue',
      value: 'vue'
    }
  ]

  return Promise.resolve(mockPresets)
}
