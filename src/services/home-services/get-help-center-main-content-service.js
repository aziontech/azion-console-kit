import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import helpCenterUrls from './help-center-urls'
import gcpStorage from '../axios/makeGoogleStorageApi'

export const getHelpCenterMainContentService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: helpCenterUrls.mainContent,
    method: 'GET',
    headers: { Accept: 'text/html' }
  }, gcpStorage)
  return parseHttpResponse(httpResponse)
}