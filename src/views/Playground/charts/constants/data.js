/* eslint-disable id-length */

const AXIS_FORMATTING = {
  axis: {
    x: {
      type: 'timeseries',
      tick: {
        format: '%Y'
      }
    }
  }
}
const COLOR_PATTERNS = {
  color: {
    pattern: [
      'var(--series-one-color)',
      'var(--series-two-color)',
      'var(--series-three-color)',
      'var(--series-four-color)',
      'var(--series-five-color)',
      'var(--series-six-color)',
      'var(--series-seven-color)',
      'var(--series-eight-color)',
      'var(--series-one-color)',
      'var(--series-two-color)',
      'var(--series-three-color)',
      'var(--series-four-color)',
      'var(--series-five-color)',
      'var(--series-six-color)',
      'var(--series-seven-color)',
      'var(--series-eight-color)'
    ]
  }
}

export const BAR_CHART_DATA = {
  data: {
    x: 'x',
    xFormat: '%Y',
    columns: [
      ['x', '2010', '2011', '2012', '2013', '2014', '2015'],
      ['Netherlands', 130, 200, 100, 160, 150, 125],
      ['Nigeria', 180, -20, 140, 120, 150, 90],
      ['France', 230, 250, 200, -50, 250, 75],
      ['Brazil', -10, 180, 40, 30, 50, 50]
    ],
    type: 'bar'
  },
  bar: {
    width: {
      ratio: 0.65
    }
  },
  ...AXIS_FORMATTING,
  ...COLOR_PATTERNS
}

export const ROTATED_BAR_CHART_DATA = {
  data: {
    x: 'x',
    xFormat: '%Y',
    columns: [
      ['x', '2010', '2011', '2012', '2013', '2014', '2015'],
      ['Values', 130, 200, 100, 160, 150, 125]
    ],
    types: {
      Values: 'bar'
    },
    color: function (color, data) {
      return COLOR_PATTERNS.color.pattern[data.index]
    }
  },
  bar: {
    width: {
      ratio: 0.65
    }
  },
  axis: {
    ...AXIS_FORMATTING.axis,
    rotated: true
  },
  legend: {
    hide: true
  }
}

export const STACKED_BAR_CHART_DATA = {
  data: {
    x: 'x',
    xFormat: '%Y',
    columns: [
      ['x', '2010', '2011', '2012', '2013', '2014', '2015'],
      ['Netherlands', -30, 200, 200, 400, -150, 250],
      ['Nigeria', 130, 100, -100, 200, -150, 50],
      ['France', -230, 200, 200, -300, 250, 250],
      ['Brazil', -10, 250, 230, 300, -150, 150]
    ],
    type: 'bar',
    groups: [['Netherlands', 'Nigeria', 'France', 'Brazil']]
  },
  grid: {
    y: {
      lines: [{ value: 0 }]
    }
  },
  bar: {
    width: {
      ratio: 0.25
    }
  },
  ...AXIS_FORMATTING,
  ...COLOR_PATTERNS
}

export const STACKED_LINE_CHART_DATA = {
  data: {
    x: 'x',
    xFormat: '%Y',
    columns: [
      ['x', '2010', '2011', '2012', '2013', '2014', '2015'],
      ['Netherlands', -30, 200, 200, 400, -150, 250],
      ['Nigeria', 130, 100, -100, 200, -150, 50],
      ['France', -230, 200, 200, -300, 250, 250],
      ['Brazil', -10, 250, 230, 300, -150, 150]
    ],
    type: 'line',
    groups: [['Netherlands', 'Nigeria', 'France', 'Brazil']]
  },
  grid: {
    y: {
      lines: [{ value: 0 }]
    }
  },
  ...AXIS_FORMATTING,
  ...COLOR_PATTERNS
}

export const PIE_CHART_DATA = {
  data: {
    columns: [
      ['Netherlands', 30],
      ['Nigeria', 120],
      ['France', 40],
      ['Brazil', 80]
    ],
    type: 'pie'
  },
  ...COLOR_PATTERNS
}

export const DONUT_CHART_DATA = {
  data: {
    columns: [
      ['Netherlands', 30],
      ['Nigeria', 120],
      ['France', 40],
      ['Brazil', 80]
    ],
    type: 'donut'
  },
  donut: {
    title: 'Actions'
  },
  ...COLOR_PATTERNS
}

export const GAUGE_CHART_DATA = {
  data: {
    columns: [['Netherlands', 11.4]],
    type: 'gauge'
  },
  color: {
    pattern: [
      'var(--scale-red)',
      'var(--scale-orange)',
      'var(--scale-yellow)',
      'var(--scale-green)'
    ],
    threshold: {
      values: [30, 60, 90]
    }
  }
}

export const AREA_CHART_DATA = {
  data: {
    columns: [
      ['Netherlands', 300, 350, 300, 50, 80, 100],
      ['Nigeria', 130, 100, 40, 100, 150, 150],
      ['France', 13, 40, 140, 20, 50, 50],
      ['Brazil', 30, 400, 200, 250, 150, 90]
    ],
    types: {
      Netherlands: 'area',
      Nigeria: 'area',
      France: 'area',
      Brazil: 'area'
    }
  },
  ...COLOR_PATTERNS
}

export const COUNTRY_IP_BLOCK_BANDWIDTH_LIST_DATA = {
  data: [
    {
      id: 1,
      order: '#1',
      country: { country: 'Italy', code: 'it' },
      ipsRange: '192.168.0.0/24',
      blockedRequests: '120000 KB',
      blockedBandwidth: '512000 KB'
    },
    {
      id: 2,
      order: '#2',
      country: { country: 'Brazil', code: 'br' },
      ipsRange: '172.16.0.0/16',
      blockedRequests: '120000 KB',
      blockedBandwidth: '512000 KB'
    },
    {
      id: 3,
      order: '#3',
      country: { country: 'United States', code: 'us' },
      ipsRange: '10.0.0.0/8',
      blockedRequests: '120000 KB',
      blockedBandwidth: '512000 KB'
    },
    {
      id: 4,
      order: '#4',
      country: { country: 'Canada', code: 'ca' },
      ipsRange: '192.168.1.0/24',
      blockedRequests: '100000 KB',
      blockedBandwidth: '480000 KB'
    },
    {
      id: 5,
      order: '#5',
      country: { country: 'France', code: 'fr' },
      ipsRange: '10.1.0.0/16',
      blockedRequests: '150000 KB',
      blockedBandwidth: '750000 KB'
    },
    {
      id: 6,
      order: '#6',
      country: { country: 'Germany', code: 'de' },
      ipsRange: '172.16.1.0/24',
      blockedRequests: '120000 KB',
      blockedBandwidth: '512000 KB'
    },
    {
      id: 7,
      order: '#7',
      country: { country: 'Poland', code: 'pl' },
      ipsRange: '192.168.2.0/24',
      blockedRequests: '100000 KB',
      blockedBandwidth: '480000 KB'
    },
    {
      id: 8,
      order: '#8',
      country: { country: 'Spain', code: 'es' },
      ipsRange: '10.2.0.0/16',
      blockedRequests: '150000 KB',
      blockedBandwidth: '750000 KB'
    },
    {
      id: 9,
      order: '#9',
      country: { country: 'United Kingdom', code: 'gb' },
      ipsRange: '172.16.2.0/24',
      blockedRequests: '120000 KB',
      blockedBandwidth: '512000 KB'
    },
    {
      id: 10,
      order: '#10',
      country: { country: 'Japan', code: 'jp' },
      ipsRange: '192.168.3.0/24',
      blockedRequests: '100000 KB',
      blockedBandwidth: '480000 KB'
    }
  ]
}

export const BIG_NUMBERS_CHART_DATA = {
  value: '2.3',
  variationType: 'regular',
  variationValue: 1.1,
  unit: 'bits/s'
}
