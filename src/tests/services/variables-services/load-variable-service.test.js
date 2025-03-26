import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadVariableService } from '@/services/variables-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fixtures = {
  variableMock: {
    uuid: '7283j-j2j3l2-82736823-j2k4m2',
    key: 'Mongo-DB-Key',
    value: 'M0nG0-t3$$t1n-k3Y',
    secret: true
  }
}

const makeSut = () => {
  const sut = loadVariableService

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
      body: fixtures.variableMock
    })
    const variableMockId = 812783
    const { sut } = makeSut()
    const version = 'v3'
    await sut({ id: variableMockId })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/variables/${variableMockId}`,
      method: 'GET'
    })
  })

  it('should parsed correctly the returned variable', async () => {
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.variableMock
    })
    const { sut } = makeSut()

    const result = await sut({ id: fixtures.variableMock.uuid })

    expect(result).toEqual({
      id: fixtures.variableMock.uuid,
      key: fixtures.variableMock.key,
      value: fixtures.variableMock.value,
      secret: fixtures.variableMock.secret
    })
  })

  it('should return an error when the request fails with status 400', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: { detail: 'Bad Request' }
    })

    const { sut } = makeSut()

    await expect(sut({ id: fixtures.variableMock.uuid })).rejects.toThrow('Bad Request')
  })
})
