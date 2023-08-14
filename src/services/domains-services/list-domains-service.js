import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";

export const listDomainsService = async ({ page }) => {
  let httpResponse = await AxiosHttpClientAdapter
    .request({
    url:`domains?page=${page}`,
    method:'GET',
  })

  httpResponse = {
    body: [
      {
        id:123,

        name: 'Teste',
        edgeCertificate: 'Azion (SAN)',
        domainName: 'tk07mooer6.map.azionedge.net',
        cname: 'teste.1.talisson.waf.com, *.teste.0.talisson.waf.com, teste.0.talisson.waf.com',
        edgeApplication: 'Teste',
      },
      {
        id:123123123,
        name: 'teste2',
        edgeCertificate: 'Azion (SAN)',
        domainName: 'z94ijlfdr5.map.azionedge.net',
        cname: 'teste2.talisson.waf.com',
        edgeApplication: 'Teste2',
      },
      {
        id:1234,
        name: 'some test edge app',
        edgeCertificate: 'Azion (SAN)',
        domainName: 'n6f40j2cc3.map.azionedge.net',
        cname: '',
        edgeApplication: 'Teste Talisson',
      },
      {
        id:12366,
        name: 'Azion (SAN)',
        edgeCertificate: 'kimd48f60t.map.azionedge.net',
        domainName: 'teste.talisson.waf.com, teste.66.talisson.waf.com, teste.99.talisson.waf.com',
        cname: '',
        edgeApplication: 'Teste Talisson',
      },
    ],    
    statusCode:200,
  }

  return parseHttpResponse(httpResponse)
}