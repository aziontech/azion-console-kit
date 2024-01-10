import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadEdgeFunctionsService } from '@/services/edge-functions-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeFunctionsMock: {
    active: true,
    code: 'local cjson = require("cjson")\r\nlocal function main(api, args)\r\n    local request = cjson.decode(user_req)\r\n    local response = cjson.decode(user_res)\r\n    local json_args = cjson.decode(user_param)\r\n    if  ngx.var.geo_city == "São Paulo" then \r\n     ngx.header["aassss"] = ngx.var.geo_city\r\n    end\r\n    return cjson.encode(request), cjson.encode(response)\r\nend\r\n',
    function_to_run: 'main',
    id: 28518,
    initiator_type: 'edge_application',
    is_proprietary_code: false,
    json_args: {},
    language: 'lua',
    last_editor: 'Azion',
    modified: '2023-10-17T18:26:23.047240Z',
    name: 'baggio',
    reference_count: 0
  },
  edgeFunctionsMockJsAndInactive: {
    active: false,
    code: 'local cjson = require("cjson")\r\nlocal function main(api, args)\r\n    local request = cjson.decode(user_req)\r\n    local response = cjson.decode(user_res)\r\n    local json_args = cjson.decode(user_param)\r\n    if  ngx.var.geo_city == "São Paulo" then \r\n     ngx.header["aassss"] = ngx.var.geo_city\r\n    end\r\n    return cjson.encode(request), cjson.encode(response)\r\nend\r\n',
    function_to_run: 'main',
    id: 28518,
    initiator_type: 'edge_application',
    is_proprietary_code: false,
    json_args: {},
    language: 'javascript',
    last_editor: 'Azion',
    modified: '2023-10-17T18:26:23.047240Z',
    name: 'baggio',
    reference_count: 0
  }
}

const makeSut = () => {
  const sut = loadEdgeFunctionsService

  return {
    sut
  }
}

describe('EdgeFunctionsServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: fixtures.edgeFunctionsMock }
    })
    const edgeFunctionsMockId = 2
    const { sut } = makeSut()
    await sut({ id: edgeFunctionsMockId })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v3/edge_functions/${edgeFunctionsMockId}`,
      method: 'GET'
    })
  })

  it('should parsed correctly the returned edge function', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: fixtures.edgeFunctionsMock }
    })
    const { sut } = makeSut()

    const result = await sut({ id: fixtures.edgeFunctionsMock.id })

    expect(result).toEqual({
      id: fixtures.edgeFunctionsMock.id,
      active: fixtures.edgeFunctionsMock.active,
      language: fixtures.edgeFunctionsMock.language,
      initiatorType: fixtures.edgeFunctionsMock.initiator_type,
      lastEditor: fixtures.edgeFunctionsMock.last_editor,
      referenceCount: fixtures.edgeFunctionsMock.reference_count,
      jsonArgs: '{}',
      name: fixtures.edgeFunctionsMock.name,
      code: fixtures.edgeFunctionsMock.code,
      version: '-',
      modified: 'Tuesday, October 17, 2023',
      statusTag: {
        content: 'Active',
        severity: 'success'
      },
      languageIcon: {
        content: 'Lua',
        icon: 'lua'
      },
      isProprietaryCode: fixtures.edgeFunctionsMock.is_proprietary_code
    })
  })

  it('should parsed correctly the returned with edge function language and status', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: fixtures.edgeFunctionsMockJsAndInactive }
    })
    const { sut } = makeSut()

    const result = await sut({ id: fixtures.edgeFunctionsMockJsAndInactive.id })

    expect(result).toEqual({
      id: fixtures.edgeFunctionsMockJsAndInactive.id,
      active: fixtures.edgeFunctionsMockJsAndInactive.active,
      language: fixtures.edgeFunctionsMockJsAndInactive.language,
      initiatorType: fixtures.edgeFunctionsMockJsAndInactive.initiator_type,
      lastEditor: fixtures.edgeFunctionsMockJsAndInactive.last_editor,
      referenceCount: fixtures.edgeFunctionsMockJsAndInactive.reference_count,
      jsonArgs: '{}',
      name: fixtures.edgeFunctionsMockJsAndInactive.name,
      code: fixtures.edgeFunctionsMockJsAndInactive.code,
      version: '-',
      modified: 'Tuesday, October 17, 2023',
      statusTag: {
        content: 'Inactive',
        severity: 'danger'
      },
      languageIcon: {
        content: 'JavaScript',
        icon: 'javascript'
      },
      isProprietaryCode: fixtures.edgeFunctionsMockJsAndInactive.is_proprietary_code
    })
  })
})
