const COLORS = {
  light: {
    green: {
      fillColor: '#6bd69080',
      strokeColor: '#6bd690'
    },
    yellow: {
      fillColor: '#f0ca5b80',
      strokeColor: '#f0ca5b'
    },
    orange: {
      fillColor: '#fa9e6480',
      strokeColor: '#fa9e64'
    },
    red: {
      fillColor: '#f05a5a80',
      strokeColor: '#f05a5a'
    }
  },

  dark: {
    green: {
      fillColor: '#6bd69080',
      strokeColor: '#6bd690'
    },
    yellow: {
      fillColor: '#f0ca5b80',
      strokeColor: '#f0ca5b'
    },
    orange: {
      fillColor: '#fa9e6480',
      strokeColor: '#fa9e64'
    },
    red: {
      fillColor: '#f05a5a80',
      strokeColor: '#f05a5a'
    }
  }
}

export const VARIATIONS = {
  'regular-high': {
    light: COLORS.light.red,
    dark: COLORS.dark.red
  },
  'regular-medium-high': {
    light: COLORS.light.orange,
    dark: COLORS.dark.orange
  },
  'regular-medium-low': {
    light: COLORS.light.yellow,
    dark: COLORS.dark.yellow
  },
  'regular-low': {
    light: COLORS.light.green,
    dark: COLORS.dark.green
  },
  'inverse-high': {
    light: COLORS.light.green,
    dark: COLORS.dark.green
  },
  'inverse-medium-high': {
    light: COLORS.light.yellow,
    dark: COLORS.dark.yellow
  },
  'inverse-medium-low': {
    light: COLORS.light.orange,
    dark: COLORS.dark.orange
  },
  'inverse-low': {
    light: COLORS.light.red,
    dark: COLORS.dark.red
  }
}

const COMMON_LAYERS_COLOR_LAKES = {
  style: {
    dark: {
      stroke: {
        color: '#3e3e3e',
        width: 1
      },
      fill: { color: '#171717' }
    },
    light: {
      stroke: {
        color: '#b5b5b5',
        width: 1
      },
      fill: { color: '#ffffff' }
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
      fill: { color: '#171717' }
    },
    light: {
      stroke: {
        color: 'transparent',
        width: 0
      },
      fill: { color: '#ffffff' }
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

export const COMMON_LAYERS_COLORS = {
  countries: COMMON_LAYERS_COLOR_LANDS,
  oceans: COMMON_LAYERS_COLOR_OCEANS,
  lakes: COMMON_LAYERS_COLOR_LAKES
}
