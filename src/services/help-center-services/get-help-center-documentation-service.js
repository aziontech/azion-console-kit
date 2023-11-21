import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeDocumentationBaseUrl } from './make-documentation-base-url'
import { makeGoogleStorageApi } from '../axios/makeGoogleStorageApi'
import { markdownToHtml } from './markdown-to-html'

const DEFAULT_DOCUMENT = 'index.md'
const WELCOME_PATH = '/welcome'

const getHelpCenterDocumentationService = async ({ url, filename }) => {
  const baseUrl = makeDocumentationBaseUrl('stage')
  const documentUrl = url === '/' ? WELCOME_PATH : getFirstPathSegment(url)
  const documentFilename = filename || DEFAULT_DOCUMENT

  let responseDocument = await fetchAndParseDocument(documentUrl, documentFilename, baseUrl)
  if (isMarkdown(documentFilename)) {
    responseDocument = markdownToHtml(responseDocument)
  }

  return responseDocument
}

const fetchAndParseDocument = async (documentUrl, documentFilename, baseUrl) => {
  let fullRequestPath = `${documentUrl}/${documentFilename}`
  let httpResponse, responseDocument

  try {
    httpResponse = await fetchDocument(fullRequestPath, baseUrl)
    responseDocument = parseHttpResponse(httpResponse)
  } catch (error) {
    fullRequestPath = `${WELCOME_PATH}/${documentFilename}`
    httpResponse = await fetchDocument(fullRequestPath, baseUrl)
    responseDocument = parseHttpResponse(httpResponse)
  }

  return responseDocument
}

const isMarkdown = (filename) => {
  return filename.endsWith('.md')
}

const getFirstPathSegment = (url) => {
  const pathParts = url.split('/')
  const firstPartOfPath = '/' + pathParts[1]

  return firstPartOfPath
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
