/* eslint-disable id-length */

const AXIS_FORMATTING = {
  axis: {
    x: {
      type: 'timeseries',
      tick: {
        format: '%Y'
      },
      label: {
        text: 'Years',
        position: 'outer-center'
      }
    },
    y: {
      label: {
        text: 'Amount',
        position: 'outer-middle'
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
    columns: [['Netherlands', 91.4]],
    type: 'gauge'
  },
  ...COLOR_PATTERNS
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
