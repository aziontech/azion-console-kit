const FIXTURE = {
  SCENARIO_TIME_SERIES: {
    filters: {
      tsRange: {
        begin: '2023-09-22T00:00:00',
        end: '2023-09-23T00:00:00',
        meta: {}
      }
    },
    availableFilters: []
  },
  SCENARIO_AND_DEFAULT: {
    filters: {
      and: {
        filter1: { value: 'value1', meta: { inputType: 'String' } },
        filter2: { value: 42, meta: { inputType: 'Int' } },
        filter3: { value: true, meta: { inputType: 'Boolean' } }
      }
    },
    availableFilters: [
      { label: 'filter1', inputType: 'String' },
      { label: 'filter2', inputType: 'Int' },
      { label: 'filter3', inputType: 'Boolean' }
    ]
  },
  SCENARIO_AND_INT_RANGE: {
    filters: {
      and: {
        intRangeFilter: { begin: 10, end: 20, meta: { inputType: 'IntRange' } }
      }
    },
    availableFilters: [{ label: 'intRangeFilter', inputType: 'IntRange' }]
  },
  SCENARIO_AND_INVALID_INT_RANGE: {
    filters: {
      and: {
        invalidIntRangeFilter: { begin: 'invalid', end: 20, meta: { inputType: 'IntRange' } }
      }
    },
    availableFilters: [{ label: 'invalidIntRangeFilter', inputType: 'IntRange' }]
  },
  SCENARIO_AND_FLOAT_RANGE: {
    filters: {
      and: {
        floatRangeFilter: { begin: 1.5, end: 3, meta: { inputType: 'FloatRange' } }
      }
    },
    availableFilters: [{ label: 'floatRangeFilter', inputType: 'FloatRange' }]
  },
  SCENARIO_AND_INVALID_FLOAT_RANGE: {
    filters: {
      and: {
        invalidFloatRangeFilter: { begin: 'invalid', end: 3, meta: { inputType: 'FloatRange' } }
      }
    },
    availableFilters: [{ label: 'invalidFloatRangeFilter', inputType: 'FloatRange' }]
  },
  SCENARIO_AND_DATA_TIME_RANGE: {
    filters: {
      and: {
        dataTimeRangeFilter: {
          begin: '2023-09-22T00:00:00',
          end: '2023-09-23T00:00:00',
          meta: { inputType: 'DateTimeRange' }
        }
      }
    },
    availableFilters: [{ label: 'dataTimeRangeFilter', inputType: 'DateTimeRange' }]
  },
  SCENARIO_AND_INVALID_DATA_TIME_RANGE: {
    filters: {
      and: {
        invalidDateTimeRangeFilter: {
          begin: 'invalid',
          end: '2023-09-23T00:00:00',
          meta: { inputType: 'DateTimeRange' }
        }
      }
    },
    availableFilters: [{ label: 'invalidDateTimeRangeFilter', inputType: 'DateTimeRange' }]
  },
  SCENARIO_DATASET_DEFAULT: {
    filters: {
      datasets: [
        {
          fieldName: 'field1',
          fieldAlias: 'alias1',
          in: [
            { sourceId: 1, sourceName: 'Source 1' },
            { sourceId: 2, sourceName: 'Source 2' }
          ],
          meta: { fieldPrefix: 'new_alias1_' }
        },
        {
          fieldName: 'field2',
          fieldAlias: 'alias2',
          in: [{ sourceId: 3, sourceName: 'Source 3' }],
          meta: { fieldPrefix: 'new_alias2_' }
        }
      ]
    },
    availableFilters: [
      { label: 'field1', inputType: 'Int' },
      { label: 'field2', inputType: 'String' }
    ]
  },
  SCENARIO_DATASET_NOT_VALID: {
    filters: {
      datasets: [
        {
          fieldName: 'field1',
          fieldAlias: 'alias1',
          in: [{ sourceId: 'invalid', sourceName: 'Source 1' }],
          meta: { fieldPrefix: 'new_alias1_' }
        },
        {
          fieldName: 'field2',
          fieldAlias: 'alias2',
          in: [{ sourceId: 3, sourceName: 'Source 3' }],
          meta: { fieldPrefix: 'new_alias2_' }
        }
      ]
    },
    availableFilters: [
      { label: 'field1', inputType: 'Int' },
      { label: 'field2', inputType: 'String' }
    ],
    expectedFilter: [
      {
        fieldName: 'field2',
        fieldAlias: 'alias2',
        in: [{ sourceId: 3, sourceName: 'Source 3' }],
        meta: { fieldPrefix: 'new_alias2_' }
      }
    ]
  },
  SCENARIO_DATASET_MISSING_FIELD_ALIAS: {
    filters: {
      datasets: [
        {
          fieldName: 'field1',
          in: [{ sourceId: 1, sourceName: 'Source 1' }],
          meta: { fieldPrefix: 'new_alias1_' }
        }
      ]
    },
    availableFilters: [
      { label: 'field1', inputType: 'Int' },
      { label: 'field2', inputType: 'String' }
    ]
  },
  SCENARIO_DATASET_MISSING_IN_ARRAY: {
    filters: {
      datasets: [
        {
          fieldName: 'field1',
          fieldAlias: 'alias1',
          meta: { fieldPrefix: 'new_alias1_' }
        }
      ]
    },
    availableFilters: [{ label: 'field1', inputType: 'Int' }]
  },
  SCENARIO_DATASET_MISSING_META: {
    filters: {
      datasets: [
        {
          fieldName: 'field1',
          fieldAlias: 'alias1',
          in: [{ sourceId: 1, sourceName: 'Source 1' }]
        }
      ]
    },
    availableFilters: [{ label: 'field1', inputType: 'Int' }]
  }
}

export default FIXTURE
