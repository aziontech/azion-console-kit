import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import makeWebpagetestApi from '../axios/makeWebpagetestApi'


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
