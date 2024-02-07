const FIXTURE = {
  SCENARIO_FIELD_TYPE_CONFIGURATION: {
    field: {
      name: 'configurationIdIn',
      description: 'Filter for configuration IDs',
      type: { name: 'configurationIdIn' }
    },
    expected: {
      value: 'configurationId',
      group: 'Domain',
      label: 'Domain',
      operator: 'In',
      type: 'ArrayObject',
      typeName: 'configurationIdIn'
    }
  },
  SCENARIO_FIELD_TYPE_RANGE: {
    field: {
      name: 'priceRange',
      description: 'Filter for price range',
      type: { name: 'FloatRange' }
    },
    expected: {
      group: 'price',
      label: 'Price',
      value: 'price',
      operator: 'Range',
      type: 'FloatRange',
      typeName: 'FloatRange'
    }
  }
}

export default FIXTURE
