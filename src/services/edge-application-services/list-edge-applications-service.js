import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";

export const listEdgeApplicationsService = async ({ page }) => {
  let httpResponse = await AxiosHttpClientAdapter
    .request({
    url:`edge_applications?page=${page}`,
    method:'GET',
  })
    
  httpResponse = {
    body:[
      {
        id:'123321',
        name:'Edge App 1',
        editor:'john@doe.com',
        lastEdit:'April 7,2023,4:36p.m',
        origins:'Default, X Origin',
        active:true
      },
      {
        id:'2232323098',
        name:'Edge App 33',
        editor:'Jane@doe.com',
        lastEdit:'April 2,2023,4:36p.m',
        origins:'X Origin',
        active:false
      }
    ],
    statusCode:200,
  }

  return parseHttpResponse(httpResponse)
}