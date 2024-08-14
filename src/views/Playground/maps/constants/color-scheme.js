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
  'positive-regular-high': {
    light: COLORS.light.green,
    dark: COLORS.dark.green
  },
  'positive-regular-medium-high': {
    light: COLORS.light.yellow,
    dark: COLORS.dark.yellow
  },
  'positive-regular-medium-low': {
    light: COLORS.light.orange,
    dark: COLORS.dark.orange
  },
  'positive-regular-low': {
    light: COLORS.light.red,
    dark: COLORS.dark.red
  },
  'positive-inverse-high': {
    light: COLORS.light.red,
    dark: COLORS.dark.red
  },
  'positive-inverse-medium-high': {
    light: COLORS.light.orange,
    dark: COLORS.dark.orange
  },
  'positive-inverse-medium-low': {
    light: COLORS.light.yellow,
    dark: COLORS.dark.yellow
  },
  'positive-inverse-low': {
    light: COLORS.light.green,
    dark: COLORS.dark.green
  },
  'negative-regular-high': {
    light: COLORS.light.red,
    dark: COLORS.dark.red
  },
  'negative-regular-medium-high': {
    light: COLORS.light.orange,
    dark: COLORS.dark.orange
  },
  'negative-regular-medium-low': {
    light: COLORS.light.yellow,
    dark: COLORS.dark.yellow
  },
  'negative-regular-low': {
    light: COLORS.light.green,
    dark: COLORS.dark.green
  },
  'negative-inverse-high': {
    light: COLORS.light.green,
    dark: COLORS.dark.green
  },
  'negative-inverse-medium-high': {
    light: COLORS.light.yellow,
    dark: COLORS.dark.yellow
  },
  'negative-inverse-medium-low': {
    light: COLORS.light.orange,
    dark: COLORS.dark.orange
  },
  'negative-inverse-low': {
    light: COLORS.light.red,
    dark: COLORS.dark.red
  }
}
