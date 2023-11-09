import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { getDocumentationBaseUrl } from './get-documentation-base-url'
import { makeGoogleStorageApi } from '../axios/makeGoogleStorageApi'
import { markdownToHtml } from './markdown-to-html'

const getHelpCenterDocumentationService = async ({ url, filename }) => {
  const baseUrl = getDocumentationBaseUrl('stage')
  const documentUrl = url === '/' ? '/welcome' : url
  const documentFilename = filename || 'index.md'

  const httpResponse = await fetchDocument(`${documentUrl}/${documentFilename}`, baseUrl)
  let responseDocument = parseHttpResponse(httpResponse)

  if (isMarkdown(documentFilename)) {
    responseDocument = markdownToHtml(responseDocument)
  }

  return responseDocument
}

const isMarkdown = (filename) => {
  return filename.endsWith('.md')
}

const fetchDocument = async (url, baseUrl) => {
  return await AxiosHttpClientAdapter.request(
    {
      url,
      method: 'GET',
      headers: { Accept: 'text/html' }
    },
    makeGoogleStorageApi(baseUrl)
  )
}

export { getHelpCenterDocumentationService }
