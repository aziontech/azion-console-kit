const MOCK_PRESETS = [
  { label: 'Next.js', value: 'next' },
  { label: 'Angular', value: 'angular' },
  { label: 'Astro', value: 'astro' },
  { label: 'Hexo', value: 'hexo' },
  { label: 'React', value: 'react' },
  { label: 'Vue', value: 'vue' }
]

const PRESET_MODES = {
  next: ['deliver', 'compute'],
  angular: ['deliver', 'compute'],
  astro: ['deliver', 'compute'],
  hexo: ['deliver'],
  react: ['deliver', 'compute'],
  vue: ['deliver', 'compute']
}

export class VulcanAdapter {
  static transformPresetsList(data) {
    if (!data || !Array.isArray(data)) {
      return MOCK_PRESETS
    }

    return data.map((preset) => ({
      label: preset.label || preset.name || preset,
      value: preset.value || preset.id || preset.slug || preset
    }))
  }

  static getMockPresets() {
    return MOCK_PRESETS
  }

  static getModesByPreset(presetName) {
    return PRESET_MODES[presetName] || []
  }
}
