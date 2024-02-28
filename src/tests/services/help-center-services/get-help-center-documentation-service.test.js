import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { getHelpCenterDocumentationService } from '@/services/help-center-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  htmlResponse: '<p>HTML Response</p>',
  markdownResponse: "---\n\ndocs: [\n'Get to know Real-Time Manager',\n'Get started'\n]\n\n---",
  convertedMarkdownResponse: ['Get to know Real-Time Manager', 'Get started'],
  convertedHTMLResponse:
    "<hr />\n<p>docs: [\n'Get to know Real-Time Manager',\n'Get started'\n]</p>\n<hr />"
}

const scenarios = [
  {
    label: 'should return success on "/" url and "index.md" filename',
    response: { statusCode: 200, body: fixtures.markdownResponse },
    params: { url: '/', filename: 'index.md', fullPath: '/welcome/index.md' },
    expected: { data: fixtures.convertedMarkdownResponse, success: true }
  },
  {
    label: 'should return success on "/" url and "index.html" filename',
    response: { statusCode: 200, body: fixtures.htmlResponse },
    params: { url: '/', filename: 'index.html', fullPath: '/welcome/index.html' },
    expected: { data: fixtures.htmlResponse, success: true }
  },
  {
    label: 'should return success on "/some-url" url and "doc.md" filename',
    response: { statusCode: 200, body: fixtures.markdownResponse },
    params: { url: '/some-url', filename: 'doc.md', fullPath: '/some-url/doc.md' },
    expected: { data: fixtures.convertedMarkdownResponse, success: true }
  },
  {
    label: 'should return success on "/some-url" url and "doc.html" filename',
    response: { statusCode: 200, body: fixtures.htmlResponse },
    params: { url: '/some-url', filename: 'doc.html', fullPath: '/some-url/doc.html' },
    expected: { data: fixtures.htmlResponse, success: true }
  },
  {
    label: 'should return default markdown document on error',
    response: { statusCode: 400, body: fixtures.markdownResponse },
    params: { url: '/', filename: 'index.md', fullPath: '/welcome/index.md' },
    expected: { data: fixtures.convertedMarkdownResponse, success: false }
  },
  {
    label: 'should return default html document on error',
    response: { statusCode: 400, body: fixtures.htmlResponse },
    params: { url: '/', filename: 'index.html', fullPath: '/welcome/index.html' },
    expected: { data: fixtures.convertedHTMLResponse, success: false }
  }
]

const makeSut = () => {
  const sut = getHelpCenterDocumentationService

  return {
    sut
  }
}

describe('HelpCenterServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    await sut({})

    expect(requestSpy).toHaveBeenCalledWith(
      {
        method: 'GET',
        headers: { Accept: 'text/html' },
        url: `/welcome/index.md`
      },
      expect.any(Function)
    )
  })

  it.each(scenarios)('$label', async ({ params, response, expected }) => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      ...response
    })

    const { sut } = makeSut()

    const result = await sut(params)

    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: expect.any(String),
        headers: expect.any(Object),
        url: params.fullPath
      }),
      expect.any(Function)
    )

    expect(result).toEqual(expected)
  })
})
