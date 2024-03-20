import { operators } from '@views/RealTimeMetrics/utils/convert-metrics-fields'
import { describe, expect, it } from 'vitest'
import FIXTURES from './fixtures/convert-filter-fields'

const makeSut = () => {
  const sut = operators

  return { sut }
}

const formattedFields = {
  field: FIXTURES.formattedText.field,
  value: FIXTURES.formattedText.value,

  // userd in range operator
  begin: FIXTURES.formattedText.begin,
  end: FIXTURES.formattedText.end
}

const operatorsScenarios = [
  {
    operator: FIXTURES.formattedText.opEq[0],
    expected: FIXTURES.formattedText.opEq[1]
  },
  {
    operator: FIXTURES.formattedText.opNe[0],
    expected: FIXTURES.formattedText.opNe[1]
  },
  {
    operator: FIXTURES.formattedText.opIn[0],
    expected: FIXTURES.formattedText.opIn[1]
  },
  {
    operator: FIXTURES.formattedText.opLike[0],
    expected: FIXTURES.formattedText.opLike[1]
  },
  {
    operator: FIXTURES.formattedText.opIlike[0],
    expected: FIXTURES.formattedText.opIlike[1]
  },
  {
    operator: FIXTURES.formattedText.opLt[0],
    expected: FIXTURES.formattedText.opLt[1]
  },
  {
    operator: FIXTURES.formattedText.opLte[0],
    expected: FIXTURES.formattedText.opLte[1]
  },
  {
    operator: FIXTURES.formattedText.opGt[0],
    expected: FIXTURES.formattedText.opGt[1]
  },
  {
    operator: FIXTURES.formattedText.opGte[0],
    expected: FIXTURES.formattedText.opGte[1]
  },
  {
    operator: FIXTURES.formattedText.opRange[0],
    expected: FIXTURES.formattedText.opRange[1]
  }
]

const emptyFormattedFields = {
  field: FIXTURES.emptyOperators.field,
  value: FIXTURES.emptyOperators.value
}

const emptyOperatorScenarios = [
  {
    operator: FIXTURES.emptyOperators.opEq[0],
    expected: FIXTURES.emptyOperators.opEq[1]
  },
  {
    operator: FIXTURES.emptyOperators.opNe[0],
    expected: FIXTURES.emptyOperators.opNe[1]
  },
  {
    operator: FIXTURES.emptyOperators.opIn[0],
    expected: FIXTURES.emptyOperators.opIn[1]
  },
  {
    operator: FIXTURES.emptyOperators.opLike[0],
    expected: FIXTURES.emptyOperators.opLike[1]
  },
  {
    operator: FIXTURES.emptyOperators.opIlike[0],
    expected: FIXTURES.emptyOperators.opIlike[1]
  },
  {
    operator: FIXTURES.emptyOperators.opLt[0],
    expected: FIXTURES.emptyOperators.opLt[1]
  },
  {
    operator: FIXTURES.emptyOperators.opLte[0],
    expected: FIXTURES.emptyOperators.opLte[1]
  },
  {
    operator: FIXTURES.emptyOperators.opGt[0],
    expected: FIXTURES.emptyOperators.opGt[1]
  },
  {
    operator: FIXTURES.emptyOperators.opGte[0],
    expected: FIXTURES.emptyOperators.opGte[1]
  }
]

describe('ConvertFields', () => {
  describe('#operators', () => {
    it('should all operators have right properties', () => {
      const { sut } = makeSut()

      for (const operator in sut) {
        const expectedOperator = sut[operator]

        expect(expectedOperator).toHaveProperty(FIXTURES.rightProperties[0])
        expect(expectedOperator).toHaveProperty(FIXTURES.rightProperties[1])
        expect(expectedOperator).toHaveProperty(FIXTURES.rightProperties[2])
      }
    })

    it.each(operatorsScenarios)(
      'should format the text to the given operator: $operator',
      ({ operator, expected }) => {
        const { sut } = makeSut()

        const result = sut[operator].format(formattedFields)

        expect(result).toEqual(expected)
      }
    )

    it.each(emptyOperatorScenarios)(
      'should format to empty values to the given operator: $operator',
      ({ operator, expected }) => {
        const { sut } = makeSut()

        const result = sut[operator].format(emptyFormattedFields)

        expect(result).toEqual(expected)
      }
    )
  })
})
