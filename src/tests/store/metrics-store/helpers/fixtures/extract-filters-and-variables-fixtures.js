const FIXTURE = {
  SCENARIO_EXTRACT_TIME_SERIES: {
    filters: {
      tsRange: {
        begin: '2023-09-22T00:00:00',
        end: '2023-09-23T00:00:00'
      }
    },
    expected: {
      tsRange_begin: '2023-09-22T00:00:00',
      tsRange_end: '2023-09-23T00:00:00'
    }
  },
  SCENARIO_EXTRACT_DATASET: {
    filters: {
      tsRange: {
        begin: '2023-09-22T00:00:00',
        end: '2023-09-23T00:00:00'
      },
      datasets: [
        {
          fieldAlias: 'field1',
          fieldName: 'field1',
          in: [{ sourceId: '1' }, { sourceId: '2' }],
          meta: { fieldPrefix: 'and_' }
        },
        {
          fieldAlias: 'field2',
          fieldName: 'field2',
          in: [{ sourceId: '3' }, { sourceId: '4' }],
          meta: { fieldPrefix: 'and_' }
        }
      ]
    },
    expected: {
      tsRange_begin: '2023-09-22T00:00:00',
      tsRange_end: '2023-09-23T00:00:00',
      and_field1: ['1', '2'],
      and_field2: ['3', '4']
    }
  },
  SCENARIO_EXTRACT_AND_SINGLE: {
    filters: {
      tsRange: {
        begin: '2023-09-22T00:00:00',
        end: '2023-09-23T00:00:00'
      },
      and: {
        filter1: {
          value: 'value1',
          meta: { fieldPrefix: 'and_' }
        },
        filter2: {
          value: 'value2',
          meta: { fieldPrefix: 'and_' }
        },
        meta: { fieldPrefix: 'and_' }
      }
    },
    expected: {
      tsRange_begin: '2023-09-22T00:00:00',
      tsRange_end: '2023-09-23T00:00:00',
      and_filter1: 'value1',
      and_filter2: 'value2'
    }
  },
  SCENARIO_EXTRACT_AND_RANGE: {
    filters: {
      tsRange: {
        begin: '2023-09-22T00:00:00',
        end: '2023-09-23T00:00:00'
      },
      and: {
        filter1: {
          begin: 1,
          end: 2,
          meta: { fieldPrefix: 'and_' }
        },
        meta: { fieldPrefix: 'and_' }
      }
    },
    expected: {
      tsRange_begin: '2023-09-22T00:00:00',
      tsRange_end: '2023-09-23T00:00:00',
      and_filter1_begin: 1,
      and_filter1_end: 2
    }
  },
  SCENARIO_EXTRACT_EMPTY_DATASET: {
    filters: {
      tsRange: {
        begin: '2023-09-22T00:00:00',
        end: '2023-09-23T00:00:00'
      },
      datasets: []
    },
    expected: {
      tsRange_begin: '2023-09-22T00:00:00',
      tsRange_end: '2023-09-23T00:00:00'
    }
  },
  SCENARIO_EXTRACT_EMPTY_AND: {
    filters: {
      tsRange: {
        begin: '2023-09-22T00:00:00',
        end: '2023-09-23T00:00:00'
      },
      and: {}
    },
    expected: {
      tsRange_begin: '2023-09-22T00:00:00',
      tsRange_end: '2023-09-23T00:00:00'
    }
  }
}

export default FIXTURE
