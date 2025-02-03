import { makeEdgeNodeBaseUrl } from '@/services/edge-node-services/v4/make-edge-node-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeEdgeNodeBaseUrl

  return {
    sut
  }
}

describe('EdgeNodeServices', () => {
  it('should return the API base url to edge node service', () => {
    const { sut } = makeSut()
    const version = 'v4'
    const correctApiUrl = `${version}/edge_orchestrator/edge_nodes`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})