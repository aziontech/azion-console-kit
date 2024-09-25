import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import makeWebpagetestApi from '../axios/makeWebpagetestApi'
// import { makeWebpagetestBaseUrlExternal } from './make-base-webpagetest-url'

export const getResultFromWebpagetest = async (id) => {
  let httpResponse = await AxiosHttpClientAdapter.request(
    {
      url: `/jsonResult.php?test=${id}`,
      method: 'GET'
    },
    makeWebpagetestApi()
  )

  return httpResponse
}
