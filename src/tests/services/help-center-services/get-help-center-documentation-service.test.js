import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { getHelpCenterDocumentationService } from '@/services/help-center-services'
import { describe, expect, it, vi } from 'vitest'
import * as markdownModule from '@/services/help-center-services/markdown-to-html'

const fixtures = {
  markdownDocument: {
    url: '/variables',
    filename: 'index.md'
  },
  htmlDocument: {
    url: '/variables',
    filename: 'index.html'
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

    await sut(fixtures.markdownDocument)

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

  it('should transform markdown to html correctly', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 404
    })
    const markdownToHtmlSpy = vi.spyOn(markdownModule, 'markdownToHtml')

    const { sut } = makeSut()

    await sut(fixtures.markdownDocument)
    const document = `---
      docs: [
      'Get to know Azion Console',
      'Get started'
      ]
    ---
    `
    markdownModule.markdownToHtml(document)

    expect(markdownToHtmlSpy).toHaveReturnedWith(['Get to know Real-Time Manager', 'Get started'])
  })

  it('should get first path segment of url', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })

    const { sut } = makeSut()

    await sut({ url: '/firstPath/secondPath' })

    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: `/firstPath/index.md`
      }),
      expect.any(Function)
    )
  })

  it('should not convert when already is html', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const markdownToHtmlSpy = vi.spyOn(markdownModule, 'markdownToHtml')

    const { sut } = makeSut()

    await sut(fixtures.htmlDocument)

    expect(markdownToHtmlSpy).not.toHaveBeenCalled()
  })

  it.each([
    { statusCode: 401 },
    { statusCode: 403 },
    { statusCode: 404 },
    { statusCode: 500 },
    { statusCode: 'unmappedStatusCode' }
  ])('should call API for default document on error $statusCode', async ({ statusCode }) => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode
    })
    const { sut } = makeSut()

    await sut(fixtures.markdownDocument)

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
