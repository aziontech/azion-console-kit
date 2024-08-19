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
  id: crypto.randomUUID().toString(),
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
  id: crypto.randomUUID().toString(),
  data: {
    x: 'x',
    columns: [
      ['x', 'Netherlands', 'Nigeria', 'France', 'Brazil', 'China', 'Chile'],
      ['Values', 130, 200, 100, 160, 150, 125]
    ],
    types: {
      Values: 'bar'
    },
    color: function (color, data) {
      return COLOR_PATTERNS.color.pattern[data.index]
    },
    labels: true
  },
  bar: {
    width: {
      ratio: 0.65
    }
  },
  axis: {
    x: {
      type: 'category'
    },
    y: {
      show: false
    },
    rotated: true
  },
  legend: {
    hide: true
  }
}

export const STACKED_BAR_CHART_DATA = {
  id: crypto.randomUUID().toString(),
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
  id: crypto.randomUUID().toString(),
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
  id: crypto.randomUUID().toString(),
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
  id: crypto.randomUUID().toString(),
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

export const GAUGE_HIGH_CHART_DATA = {
  id: crypto.randomUUID().toString(),
  data: {
    columns: [['Netherlands', 91.4]],
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

export const GAUGE_MEDIUM_CHART_DATA = {
  id: crypto.randomUUID().toString(),
  data: {
    columns: [['Netherlands', 35.5]],
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

export const GAUGE_LOW_CHART_DATA = {
  id: crypto.randomUUID().toString(),
  data: {
    columns: [['Netherlands', 8.4]],
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
  id: crypto.randomUUID().toString(),
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

export const COUNTRY_IP_BLOCK_BANDWIDTH_LIST_DATA = [
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

export const BIG_NUMBERS_CHART_DATA = {
  value: '0.0',
  variationType: 'regular',
  variationValue: 0,
  unit: 'bits/s'
}

export const BIG_NUMBERS_INVERSE_CHART_DATA = {
  value: '1267.9',
  variationType: 'inverse',
  variationValue: 16.8,
  unit: 'kb/s'
}

export const BIG_NUMBERS_REGULAR_CHART_DATA = {
  value: '36.8',
  variationType: 'regular',
  variationValue: 3.2,
  unit: 'kb/s'
}

export const HEATMAP_DATA = [
  {
    countryName: 'China',
    value: 4559,
    rangeVariation: 'regular'
  },
  {
    countryName: 'Russia',
    value: 19,
    rangeVariation: 'regular'
  },
  {
    countryName: 'Brazil',
    value: 295228,
    rangeVariation: 'regular'
  },
  {
    countryName: 'Argentina',
    value: 25003,
    rangeVariation: 'regular'
  },
  {
    countryName: 'United States',
    value: 122890,
    rangeVariation: 'regular'
  }
]

export const BUBBLES_DATA = [
  {
    countryName: 'Chile',
    value: 32559,
    rangeVariation: 'regular'
  },
  {
    countryName: 'Djibouti',
    value: 195,
    rangeVariation: 'regular'
  },
  {
    countryName: 'Netherlands',
    value: 29528,
    rangeVariation: 'regular'
  },
  {
    countryName: 'United Arab Emirates',
    value: 25003,
    rangeVariation: 'regular'
  },
  {
    countryName: 'South Africa',
    value: 1190,
    rangeVariation: 'regular'
  },
  {
    countryName: 'Nigeria',
    value: 80,
    rangeVariation: 'regular'
  },
  {
    countryName: 'Venezuela',
    value: 350,
    rangeVariation: 'regular'
  },
  {
    countryName: 'Mexico',
    value: 11890,
    rangeVariation: 'regular'
  },
  {
    countryName: 'India',
    value: 4559,
    rangeVariation: 'regular'
  },
  {
    countryName: 'Uruguay',
    value: 43921,
    rangeVariation: 'regular'
  },
  {
    countryName: 'Madagascar',
    value: 8987,
    rangeVariation: 'regular'
  },
  {
    countryName: 'France',
    value: 19876,
    rangeVariation: 'regular'
  }
]
