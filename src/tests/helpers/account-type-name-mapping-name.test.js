import { getAccountTypeName } from '@/helpers/account-type-name-mapping'
import { describe, expect, it } from 'vitest'

const makeSut = () => {
  const sut = {
    getAccountTypeName
  }
  return {
    sut
  }
}

describe('AccountTypeNameMapping', () => {
  it('should return correct account type name for client', () => {
    const { sut } = makeSut()
    const accountTypeName = sut.getAccountTypeName('client')
    expect(accountTypeName).toBe('Client')
  })
  it('should return correct account type name for group', () => {
    const { sut } = makeSut()
    const accountTypeName = sut.getAccountTypeName('groups')
    expect(accountTypeName).toBe('Group')
  })
  it('should return correct account type name for reseller', () => {
    const { sut } = makeSut()
    const accountTypeName = sut.getAccountTypeName('resellers')
    expect(accountTypeName).toBe('Reseller')
  })
  it('should return null for invalid account type name', () => {
    const { sut } = makeSut()
    const accountTypeName = sut.getAccountTypeName('invalid')
    expect(accountTypeName).toBeUndefined()
  })
})
