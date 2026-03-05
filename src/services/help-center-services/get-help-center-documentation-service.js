import { parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import makeDocsExternalApi from '../axios/makeDocsExternalApi'
import { markdownToHtml } from './markdown-to-html'

const DEFAULT_DOCUMENT = '.md'

const getHelpCenterDocumentationService = async ({ url = '/', filename = DEFAULT_DOCUMENT }) => {
  // Check if URL is already absolute (full URL)
  const isAbsoluteUrl = url.startsWith('http://') || url.startsWith('https://')
  
  let fullMarkdownUrl
  
  if (isAbsoluteUrl) {
    // For external Azion documentation URLs, extract the path and handle it properly
    const urlObj = new URL(url)
    let path = urlObj.pathname
    
    // Remove trailing slash if present
    if (path.endsWith('/')) {
      path = path.slice(0, -1)
    }
    
    // Remove .md from the end if present
    if (path.endsWith('.md')) {
      path = path.slice(0, -3)
    }
    
    // Append .md for markdown files
    fullMarkdownUrl = `${path}.md`
  } else if (url === 'VARIABLES' || url === 'OBJECT_STORAGE' || url === 'SQL_DATABASE') {
    // Handle known product identifiers
    const docsMapping = {
      'VARIABLES': 'https://www.azion.com/en/documentation/products/functions/environment-variables',
      'OBJECT_STORAGE': 'https://www.azion.com/en/documentation/products/store/object-storage',
      'SQL_DATABASE': 'https://www.azion.com/pt-br/documentacao/produtos/store/sql-database'
    }
    const docsUrl = docsMapping[url]
    if (docsUrl) {
      const urlObj = new URL(docsUrl)
      let path = urlObj.pathname
      if (path.endsWith('/')) {
        path = path.slice(0, -1)
      }
      fullMarkdownUrl = `${path}.md`
    } else {
      // Default to relative path construction
      let documentationUrl = url === '/' ? 'https://www.azion.com/pt-br/documentacao/' : url
      if (documentationUrl.endsWith('/')) {
        documentationUrl = documentationUrl.slice(0, -1)
      }
      fullMarkdownUrl = `${documentationUrl}/${filename}`
    }
  } else {
    // Convert to proper documentation URL format for relative paths
    let documentationUrl = url === '/' ? 'https://www.azion.com/pt-br/documentacao/' : url
    
    // Remove trailing slash if present and append filename
    if (documentationUrl.endsWith('/')) {
      documentationUrl = documentationUrl.slice(0, -1)
    }
    
    // Append the filename (including .md extension)
    fullMarkdownUrl = `${documentationUrl}/${filename}`
  }
  
  let httpResponse, responseDocument

  try {
    httpResponse = await fetchDocument(fullMarkdownUrl)
    const rawData = parseHttpResponse(httpResponse)
    responseDocument = {
      data: markdownToHtml(rawData),
      success: true
    }
  } catch (error) {
    responseDocument = { data: null, success: false }
  }

  return responseDocument
}

const fetchDocument = async (url) => {
  const api = makeDocsExternalApi()
  const response = await api.get(url)
  return {
    body: response.data,
    statusCode: response.status
  }
}

export { getHelpCenterDocumentationService }
