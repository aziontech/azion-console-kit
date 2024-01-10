import { makeWafRulesBaseUrl } from '@/services/waf-rules-services/make-waf-rules-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeWafRulesBaseUrl

  return {
    sut
  }
}

describe('WafRulesServices', () => {
  it('should return the API base url to waf rules service', () => {
    const { sut } = makeSut()
    const correctApiUrl = `v3/waf`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
