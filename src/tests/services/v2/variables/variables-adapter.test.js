import { describe, expect, it } from 'vitest'
import { VariablesAdapter } from '@/services/v2/variables/variables-adapter'

const secretVariable = {
  uuid: 'secret-id',
  key: 'SECRET_KEY',
  value: '********',
  secret: true,
  last_editor: 'user@azion.com',
  updated_at: '2026-06-01T12:00:00Z'
}

const regularVariable = {
  uuid: 'regular-id',
  key: 'REGULAR_KEY',
  value: 'regular-value',
  secret: false,
  last_editor: 'user@azion.com',
  updated_at: '2026-06-01T12:00:00Z'
}

describe('VariablesAdapter', () => {
  it('keeps secret mask in list rows', () => {
    const [result] = VariablesAdapter.transformList([secretVariable])

    expect(result.value).toEqual({
      isSecret: true,
      content: '********'
    })
  })

  it('uses a secret mask in list rows when API omits the secret value', () => {
    const [result] = VariablesAdapter.transformList([{ ...secretVariable, value: undefined }])

    expect(result.value).toEqual({
      isSecret: true,
      content: '********'
    })
  })

  it('does not expose current secret value for edit forms', () => {
    const result = VariablesAdapter.transformFormItem(secretVariable)

    expect(result).toEqual({
      id: 'secret-id',
      key: 'SECRET_KEY',
      value: '',
      secret: true
    })
  })

  it('returns regular variables with id and value for form flows', () => {
    const result = VariablesAdapter.transformFormItem(regularVariable)

    expect(result).toEqual({
      id: 'regular-id',
      key: 'REGULAR_KEY',
      value: 'regular-value',
      secret: false
    })
  })
})
