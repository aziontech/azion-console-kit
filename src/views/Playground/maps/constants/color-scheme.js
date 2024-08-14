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
