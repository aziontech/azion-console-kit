import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { getDocumentationBaseUrl } from './get-documentation-base-url'
import { makeGoogleStorageApi } from '../axios/makeGoogleStorageApi'
import { markdownToHtml } from './markdown-to-html'
import { useHelpCenterStore } from '@/stores/help-center'

const DEFAULT_DOCUMENT = 'index.md'
const WELCOME_PATH = '/welcome'

// PENSAR EM SALVAR O WELCOME NA STORE PARA NAO FAZER REQUESTS TODA VEZ
const getHelpCenterDocumentationService = async ({ url, filename }) => {
  const baseUrl = getDocumentationBaseUrl('stage')
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
  const store = useHelpCenterStore()

  store.setWelcomeDefaultDocument('teste')
  responseDocument = store.getWelcomeDefaultDocument
  console.log('responseDocument :', responseDocument);

  try {
    httpResponse = await fetchDocument(fullRequestPath, baseUrl)
    responseDocument = parseHttpResponse(httpResponse)
  } catch (error) {

    if (!responseDocument) {
      fullRequestPath = `${WELCOME_PATH}/${documentFilename}`
      httpResponse = await fetchDocument(fullRequestPath, baseUrl)
      responseDocument = parseHttpResponse(httpResponse)

    }
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
