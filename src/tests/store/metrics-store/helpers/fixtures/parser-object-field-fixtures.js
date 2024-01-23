const FIXTURE = {
  SCENARIO_FIELD_TYPE_CONFIGURATION: {
    field: {
      name: 'configurationIdIn',
      description: 'Filter for configuration IDs',
      type: { name: 'configurationIdIn' }
    },
    expected: {
      label: 'configurationIdIn',
      description: 'Filter for configuration IDs',
      value: 'domainIn',
      formattedLabel: 'Domain',
      operator: 'In',
      type: 'domains-filter',
      inputType: 'String',
      nameField: 'domain',
      valueElement: undefined
    }
  },
  SCENARIO_FIELD_TYPE_RANGE: {
    field: {
      name: 'priceRange',
      description: 'Filter for price range',
      type: { name: 'FloatRange' }
    },
    expected: {
      label: 'priceRange',
      description: 'Filter for price range',
      value: 'priceRange',
      formattedLabel: 'Price',
      operator: 'Range',
      type: 'range-filter',
      inputType: 'FloatRange',
      nameField: 'price',
      valueElement: undefined
    }
  }
}

export default FIXTURE
