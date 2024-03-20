import * as ConvertFields from '@views/RealTimeMetrics/utils/convert-metrics-fields'
import { describe, expect, it } from 'vitest'
import FIXTURES from './fixtures/convert-filter-fields'

const makeSut = () => {
  const sut = ConvertFields

  return { sut }
}

describe('ConvertFields', () => {
  it.each(FIXTURES.operatorsName)(
    '#getOperatorFromOperatorName should get the operator %s from library',
    (operator) => {
      const { sut } = makeSut()

      const expectedOperator = sut.getOperatorFromOperatorName(operator)

      expect(expectedOperator).toEqual(sut.operators[operator])
    }
  )

  it('#getOperatorFromFieldName should get the operator from the field name informed', () => {
    const { sut } = makeSut()

    const result = sut.getOperatorFromFieldName(FIXTURES.getOperatorFromFieldName.fieldName)

    expect(result).toEqual(expect.objectContaining(FIXTURES.eqOperator))
  })
})
