import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { deleteRecordsService } from '@/services/intelligent-dns-records-services'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = deleteRecordsService

  return {
    sut
  }
}

describe('EdgeServicesServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const recordIDMock = 12387555
    const intelligentDNSIDMock = 765789
    const { sut } = makeSut()

    await sut({ recordID: recordIDMock, intelligentDNSID: intelligentDNSIDMock })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'DELETE',
      url: `intelligent_dns/${intelligentDNSIDMock}/records/${recordIDMock}`
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const recordIDMock = 12387555
    const intelligentDNSIDMock = 765789

    const { sut } = makeSut()

    const feedbackMessage = await sut({
      recordID: recordIDMock,
      intelligentDNSID: intelligentDNSIDMock
    })

    expect(feedbackMessage).toBe('Resource successfully deleted')
  })
})
