import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listDigitalCertificatesService } from '@/services/digital-certificates-services'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = listDigitalCertificatesService

  return {
    sut
  }
}
describe('DigitalCertificatesServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: []
    })
    const { sut } = makeSut()

    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `digital_certificates?order_by=name&sort=asc&page=1&page_size=200`,
      method: 'GET'
    })
  })
})
