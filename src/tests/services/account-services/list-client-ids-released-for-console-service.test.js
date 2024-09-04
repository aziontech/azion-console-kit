import { listClientIdsReleasedForConsoleService } from '@/services/account-services'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { getEnvironment } from '@/helpers/get-environment'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/helpers/get-environment')

const makeSut = () => {
  const sut = listClientIdsReleasedForConsoleService
  return { sut }
}

describe('AccountServices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve chamar o serviço da API com os parâmetros corretos', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { production: { client_ids: ['id1', 'id2'] }, stage: { client_ids: ['id3', 'id4'] } }
    })
    getEnvironment.mockReturnValue('production')

    const { sut } = makeSut()
    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      url: '/allowed-accounts'
    })
  })

  it('deve retornar um array de client IDs de produção quando o ambiente for produção', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { production: { client_ids: ['id1', 'id2'] }, stage: { client_ids: ['id3', 'id4'] } }
    })
    getEnvironment.mockReturnValue('production')

    const { sut } = makeSut()
    const result = await sut()

    expect(result).toEqual(['id1', 'id2'])
  })

  it('deve retornar um array de client IDs de stage quando o ambiente não for produção', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { production: { client_ids: ['id1', 'id2'] }, stage: { client_ids: ['id3', 'id4'] } }
    })
    getEnvironment.mockReturnValue('development')

    const { sut } = makeSut()
    const result = await sut()

    expect(result).toEqual(['id3', 'id4'])
  })

  it('deve retornar um array vazio quando o corpo da resposta não contiver client_ids', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { production: {}, stage: {} }
    })
    getEnvironment.mockReturnValue('production')

    const { sut } = makeSut()
    const result = await sut()

    expect(result).toEqual([])
  })
})