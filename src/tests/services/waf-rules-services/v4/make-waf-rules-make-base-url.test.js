import { makeWafRulesBaseUrl } from '@/services/waf-rules-services/v4/make-waf-rules-base-url'
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
    const correctApiUrl = `v4/edge_firewall/wafs`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
