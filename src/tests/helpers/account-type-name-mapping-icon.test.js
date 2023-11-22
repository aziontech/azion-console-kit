import { getAccountTypeIcon } from '@/helpers/account-type-name-mapping'
import { describe, expect, it } from 'vitest'

const makeSut = () => {
  const sut = { getAccountTypeIcon }
  return { sut }
}

describe('AccountTypeNameMapping', () => {
  it('should return correct account type icon for client', () => {
    const { sut } = makeSut()
    const accountTypeIcon = sut.getAccountTypeIcon('client')
    expect(accountTypeIcon).toBe('pi pi-box')
  })
  it('should return correct account type icon for group', () => {
    const { sut } = makeSut()
    const accountTypeIcon = sut.getAccountTypeIcon('groups')
    expect(accountTypeIcon).toBe('pi pi-folder')
  })
  it('should return correct account type icon for reseller', () => {
    const { sut } = makeSut()
    const accountTypeIcon = sut.getAccountTypeIcon('resellers')
    expect(accountTypeIcon).toBe('pi pi-building')
  })

  it('should return null for invalid account type icon', () => {
    const { sut } = makeSut()
    const accountTypeIcon = sut.getAccountTypeIcon('invalid')
    expect(accountTypeIcon).toBeNull()
  })
})
