import { getStaticUrlsByEnvironment } from '@/helpers'
import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeGoogleStorageApi } from '../axios/makeGoogleStorageApi'
import { markdownToHtml } from './markdown-to-html'

const DEFAULT_DOCUMENT = 'index.md'
const WELCOME_PATH = '/welcome'

const getHelpCenterDocumentationService = async ({ url = '/', filename = DEFAULT_DOCUMENT }) => {
  const helpCenterBaseUrl = getStaticUrlsByEnvironment('helpCenter')
  const documentUrl = url === '/' ? WELCOME_PATH : url

  let responseDocument = await fetchAndParseDocument(documentUrl, filename, helpCenterBaseUrl)
  if (isMarkdown(filename)) {
    responseDocument.data = markdownToHtml(responseDocument.data)
  }

  return responseDocument
}

const fetchAndParseDocument = async (documentUrl, documentFilename, baseUrl) => {
  let fullRequestPath = `${documentUrl}/${documentFilename}`
  let httpResponse, responseDocument

  try {
    httpResponse = await fetchDocument(fullRequestPath, baseUrl)
    responseDocument = { data: parseHttpResponse(httpResponse), success: true }
  } catch {
    fullRequestPath = `${WELCOME_PATH}/${documentFilename}`
    httpResponse = await fetchDocument(fullRequestPath, baseUrl)
    responseDocument = { data: parseHttpResponse(httpResponse), success: false }
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
