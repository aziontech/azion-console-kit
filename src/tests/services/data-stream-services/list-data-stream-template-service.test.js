import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listDataStreamTemplateService } from '@/services/data-stream-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  templateMock: {
    id: 1239875,
    template_model: 'JS Edge Node',
    name: 'test'
  }
}

const makeSut = () => {
  const sut = listDataStreamTemplateService

  return {
    sut
  }
}

describe('DataStreamServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })
    const { sut } = makeSut()
    const version = 'v3'
    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/data_streaming/templates`,
      method: 'GET'
    })
  })

  it('should parsed correctly all returned template', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.templateMock] }
    })
    const { sut } = makeSut()
    const customTemplate = { label: 'Custom Template', value: 'CUSTOM_TEMPLATE', template: '' }

    const result = await sut({})

    expect(result).toEqual([
      {
        value: fixtures.templateMock.id,
        label: fixtures.templateMock.name,
        template: fixtures.templateMock.template_model
      },
      customTemplate
    ])
  })
})
