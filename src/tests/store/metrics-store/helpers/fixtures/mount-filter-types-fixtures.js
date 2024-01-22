const FIXTURE = {
  SCENARIO_VALIDATION_FILTER: {
    filters: {
      tsRange: {
        begin: '2023-09-22T00:00:00',
        end: '2023-09-23T00:00:00',
        meta: {}
      },
      and: {
        filter1: {
          value: 'value1',
          meta: { fieldPrefix: 'and_' }
        },
        filter2: {
          value: 'value2',
          meta: { fieldPrefix: 'and_' }
        }
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
    availableFilters: [
      { label: 'filter1', inputType: 'String' },
      { label: 'field1', inputType: 'Int' },
      { label: 'field2', inputType: 'String' }
    ],
    expected: {
      tsRange: {
        begin: '2023-09-22T00:00:00',
        end: '2023-09-23T00:00:00',
        meta: {}
      },
      and: {
        filter1: {
          value: 'value1',
          meta: { inputType: 'String' }
        }
      },
      datasets: [
        {
          fieldAlias: 'field1',
          fieldName: 'field1',
          in: [{ sourceId: '1' }, { sourceId: '2' }],
          meta: {
            fieldPrefix: 'new_field1_',
            inputType: '[Int]'
          }
        },
        {
          fieldAlias: 'field2',
          fieldName: 'field2',
          in: [{ sourceId: '3' }, { sourceId: '4' }],
          meta: {
            fieldPrefix: 'new_field2_',
            inputType: '[String]'
          }
        }
      ]
    }
  },
  SCENARIO_MISSING_AVAILABLE: {
    filters: {
      and: {
        filter1: {
          value: 'value1',
          meta: { fieldPrefix: 'and_' }
        }
      },
      datasets: [
        {
          fieldAlias: 'field1',
          fieldName: 'field1',
          in: [{ sourceId: '1' }, { sourceId: '2' }],
          meta: { fieldPrefix: 'and_' }
        }
      ]
    },
    availableFilters: [],
    expected: {
      tsRange: undefined,
      and: {},
      datasets: []
    }
  },
  SCENARIO_MISSING_FILTERS: {
    filters: {},
    availableFilters: [{ label: 'filter1', inputType: 'String' }],
    expected: {
      tsRange: undefined,
      and: {},
      datasets: []
    }
  }
}

export default FIXTURE
