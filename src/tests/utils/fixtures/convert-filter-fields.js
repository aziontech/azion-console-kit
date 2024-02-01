const FIXTURES = {
  rightProperties: ['label', 'value', 'format'],
  formattedText: {
    field: 'field',
    value: 'value',
    begin: 'begin',
    end: 'end',
    opEq: ['Eq', 'field = value'],
    opNe: ['Ne', 'field ≠ value'],
    opIn: ['In', 'field IN (value)'],
    opLike: ['Like', 'field ⊃ value'],
    opIlike: ['Ilike', 'field ⊅ value'],
    opRange: ['Range', 'begin ≤ field ≤ end'],
    opLt: ['Lt', 'field < value'],
    opLte: ['Lte', 'field ≤ value'],
    opGt: ['Gt', 'field > value'],
    opGte: ['Gte', 'field ≥ value']
  },
  operatorsName: ['Eq', 'Ne', 'In', 'Like', 'Ilike', 'Range', 'Lt', 'Lte', 'Gt', 'Gte'],
  emptyOperators: {
    field: 'field',
    value: '""',
    opEq: ['Eq', 'field = ""'],
    opNe: ['Ne', 'field ≠ ""'],
    opIn: ['In', 'field IN ("")'],
    opLike: ['Like', 'field ⊃ ""'],
    opIlike: ['Ilike', 'field ⊅ ""'],
    opLt: ['Lt', 'field < ""'],
    opLte: ['Lte', 'field ≤ ""'],
    opGt: ['Gt', 'field > ""'],
    opGte: ['Gte', 'field ≥ ""']
  },
  sanitizeOperator: {
    fieldName: 'DomainsEq',
    expected: 'Eq'
  },
  formatField: {
    fieldName: 'DomainsServerEquals',
    expected: 'Domains Server'
  },
  formatFieldSingle: {
    fieldName: 'Domains',
    expected: 'Domains'
  },
  getOperatorFromFieldName: {
    fieldName: 'DomainsServerEq'
  },
  isRelevantField: {
    fieldName: 'Domain',
    dataset: 'httpMetrics',
    expected: 0
  },
  isRelevantFieldNotExists: {
    fieldName: 'Domain',
    dataset: 'httpMetricsNotExists',
    expected: -1
  },
  eqOperator: {
    value: 'Eq',
    label: 'Equals'
  }
}

export default FIXTURES
