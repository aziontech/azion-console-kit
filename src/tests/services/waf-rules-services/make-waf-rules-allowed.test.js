import { makeWafRulesAllowedBaseUrl } from '@/services/waf-rules-services/make-waf-rules-allowed-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeWafRulesAllowedBaseUrl

  return {
    sut
  }
}

describe('WafRulesServices', () => {
  it('should return the API base url to waf rules allowed service', () => {
    const { sut } = makeSut()
    const correctApiUrl = `v4/edge_firewall/wafs`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
