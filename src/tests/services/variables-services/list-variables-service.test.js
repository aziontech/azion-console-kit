import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listVariablesService } from '@/services/variables-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { localeMock } from '@/tests/utils/localeMock'

const fixtures = {
  variableMock: {
    uuid: '7283j-j2j3l2-82736823-j2k4m2',
    key: 'Mongo-DB-Key',
    value: 'M0nG0-t3$$t1n-k3Y',
    last_editor: 'John Doe',
    updated_at: new Date(2023, 5, 10, 12),
    secret: true
  }
}

const makeSut = () => {
  const sut = listVariablesService

  return {
    sut
  }
}

describe('VariablesService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: null
    })

    const { sut } = makeSut()
    const version = 'v3'
    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/variables`,
      method: 'GET'
    })
  })

  it('should parsed correctly each variable', async () => {
    localeMock()
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: [fixtures.variableMock]
    })
    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual([
      {
        id: fixtures.variableMock.uuid,
        key: fixtures.variableMock.key,
        value: {
          isSecret: fixtures.variableMock.secret,
          content: fixtures.variableMock.value
        },
        lastEditor: fixtures.variableMock.last_editor,
        lastModified: 'June 10, 2023 at 12:00:00 PM',
        lastModify: 'On June'
      }
    ])
  })
})
