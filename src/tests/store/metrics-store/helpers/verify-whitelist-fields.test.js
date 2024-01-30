import VerifyWhitelistField from '@/stores/metrics-store/helpers/verify-whitelist-fields.js'
import { describe, expect, it } from 'vitest'

const makeSut = () => {
  const sut = VerifyWhitelistField
  return { sut }
}

const mockWhitelistedFields = [
  'String',
  'Int',
  'Float',
  'IntRange',
  'FloatRange',
  'configurationIdIn',
  'zoneIdIn',
  'edgeFunctionIdIn'
]

const mockNotWhitelistedFields = ['clientId', 'clientIdNe', 'clientIdLike', 'clientIdEq']

describe('VerifyWhitelistField', () => {
  it.each(mockWhitelistedFields)('should validate whitelisted key: %s', (key) => {
    const { sut } = makeSut()

    const isWhitelisted = sut({ name: key, type: { name: key } })

    expect(isWhitelisted).toBeTruthy()
  })

  it.each(mockNotWhitelistedFields)('should validate when key is not whitelisted: %s', (key) => {
    const { sut } = makeSut()

    const isNotWhitelisted = sut({ name: key, type: { name: key } })

    // the inversion is used to improve readability as whitelisted keys should return true
    expect(!isNotWhitelisted).toBeTruthy()
  })
})
