const COLORS = {
  light: {
    limit1: {
      fillColor: '#f1e8ca',
      strokeColor: '#f6de95'
    },
    limit2: {
      fillColor: '#f3d2bb',
      strokeColor: '#fba86f'
    },
    limit3: {
      fillColor: '#f3c8a9',
      strokeColor: '#fa8e42'
    },
    limit4: {
      fillColor: '#f5c5c2',
      strokeColor: '#ff8780'
    },
    limit5: {
      fillColor: '#f5b6b2',
      strokeColor: '#ff6259'
    }
  },

  dark: {
    limit1: {
      fillColor: '#776d50',
      strokeColor: '#f6de95'
    },
    limit2: {
      fillColor: '#795841',
      strokeColor: '#fba86f'
    },
    limit3: {
      fillColor: '#784d2f',
      strokeColor: '#fa8e42'
    },
    limit4: {
      fillColor: '#7a4a48',
      strokeColor: '#ff8780'
    },
    limit5: {
      fillColor: '#7a3c38',
      strokeColor: '#ff6259'
    }
  }
}

export const VARIATIONS = {
  'regular-limit5': {
    light: COLORS.light.limit5,
    dark: COLORS.dark.limit5
  },
  'regular-limit4': {
    light: COLORS.light.limit4,
    dark: COLORS.dark.limit4
  },
  'regular-limit3': {
    light: COLORS.light.limit3,
    dark: COLORS.dark.limit3
  },
  'regular-limit2': {
    light: COLORS.light.limit2,
    dark: COLORS.dark.limit2
  },
  'regular-limit1': {
    light: COLORS.light.limit1,
    dark: COLORS.dark.limit1
  },
  'inverse-limit1': {
    light: COLORS.light.limit1,
    dark: COLORS.dark.limit1
  },
  'inverse-limit2': {
    light: COLORS.light.limit2,
    dark: COLORS.dark.limit2
  },
  'inverse-limit3': {
    light: COLORS.light.limit3,
    dark: COLORS.dark.limit3
  },
  'inverse-limit4': {
    light: COLORS.light.limit4,
    dark: COLORS.dark.limit4
  },
  'inverse-limit5': {
    light: COLORS.light.limit5,
    dark: COLORS.dark.limit5
  }
}

const COMMON_LAYERS_COLOR_LAKES = {
  style: {
    dark: {
      stroke: {
        color: '#3e3e3e',
        width: 1
      },
      fill: { color: '#222222' }
    },
    light: {
      stroke: {
        color: '#b5b5b5',
        width: 1
      },
      fill: { color: '#f9fafb' }
    }
  }
}

const COMMON_LAYERS_COLOR_OCEANS = {
  style: {
    dark: {
      stroke: {
        color: 'transparent',
        width: 0
      },
      fill: { color: '#222222' }
    },
    light: {
      stroke: {
        color: 'transparent',
        width: 0
      },
      fill: { color: '#f9fafb' }
    }
  }
}

const COMMON_LAYERS_COLOR_LANDS = {
  style: {
    dark: {
      stroke: {
        color: '#3e3e3e',
        width: 1
      },
      fill: { color: '#2c2c2c' }
    },
    light: {
      stroke: {
        color: '#b5b5b5',
        width: 1
      },
      fill: { color: '#e8e8e8' }
    }
  }
}

const COMMON_LAYERS_COLOR_REGIONS = {
  style: {
    dark: {
      stroke: {
        color: 'transparent',
        width: 0
      },
      fill: { color: 'transparent' }
    },
    light: {
      stroke: {
        color: 'transparent',
        width: 0
      },
      fill: { color: 'transparent' }
    }
  }
}

export const COMMON_LAYERS_COLORS = {
  countries: COMMON_LAYERS_COLOR_LANDS,
  oceans: COMMON_LAYERS_COLOR_OCEANS,
  lakes: COMMON_LAYERS_COLOR_LAKES,
  regions: COMMON_LAYERS_COLOR_REGIONS
}
