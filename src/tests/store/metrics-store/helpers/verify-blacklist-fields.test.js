import VerifyBlackListField from '@stores/metrics-store/helpers/verify-blacklist-fields'
import { describe, expect, it } from 'vitest'

const makeSut = () => {
  const sut = VerifyBlackListField
  return { sut }
}

const mockBlacklist = [
  'clientId',
  'clientIdNe',
  'clientIdLike',
  'clientIdEq',
  'clientIdIlike',
  'naxsiAttackFamilyEq',
  'naxsiAttackFamilyNe',
  'naxsiAttackFamilyLike',
  'naxsiAttackFamilyIlike'
]

const mockNotBlacklisted = ['String', 'Int', 'Float', 'IntRange', 'FloatRange']

describe('VerifyBlackListField', () => {
  it.each(mockBlacklist)('should validate blacklisted key: %s', (key) => {
    const { sut } = makeSut()

    const isBlacklisted = sut({ name: key })

    // the inversion is used to improve readability as blacklisted keys should return false
    expect(!isBlacklisted).toBeTruthy()
  })

  it.each(mockNotBlacklisted)('should validate key is not blacklisted: %s', (key) => {
    const { sut } = makeSut()

    const isNotBlacklisted = sut({ name: key })

    expect(isNotBlacklisted).toBeTruthy()
  })
})
