import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { getHelpCenterDocumentationService } from '@/services/help-center-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  helpCenterMock: {
    url: '/variables',
    filename: 'index.md'
  },
  documentDefaultPath: { url: '/' }
}
const makeSut = () => {
  const sut = getHelpCenterDocumentationService

  return {
    sut
  }
}

describe('HelpCenterServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    await sut(fixtures.helpCenterMock)

    expect(requestSpy).toHaveBeenCalledWith(
      {
        method: 'GET',
        headers: { Accept: 'text/html' },
        url: `/variables/index.md`
      },
      expect.any(Function)
    )
  })

  it('should call API and return default document with no parameters', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    await sut(fixtures.documentDefaultPath)

    expect(requestSpy).toHaveBeenCalledWith(
      {
        method: 'GET',
        headers: { Accept: 'text/html' },
        url: `/welcome/index.md`
      },
      expect.any(Function)
    )
  })
})
