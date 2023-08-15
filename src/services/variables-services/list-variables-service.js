import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";

export const listVariablesService = async () => {
  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `variables`,
      method: 'GET',
    })

  // httpResponse = {
  //   body: {
  //     results: [
  //       {
  //         uuid: '123321',
  //         key: 'Edge App 1',
  //         value: 'Edge App 1',
  //         last_editor: 'john@doe.com',
  //         last_modified: 'April 7,2023,4:36p.m',
  //         origins: 'Default, X Origin',
  //         active: true
  //       },

  //     ],
  //   },
  //   statusCode: 200,
  // }
  console.log(httpResponse)
  return parseHttpResponse(httpResponse)
}