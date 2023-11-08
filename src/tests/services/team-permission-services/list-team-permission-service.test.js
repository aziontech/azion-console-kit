import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { localeMock } from '@/tests/utils/localeMock'
import { listTeamPermissionService } from '@/services/team-permission'

const fixtures = {
  teamPermissionMock: {
    id: 2,
    name: 'Default',
    is_active: true,
    permissions: [{ id: 324, name: 'permission' }]
  }
}

const makeSut = () => {
  const sut = listTeamPermissionService

  return {
    sut
  }
}

describe('TeamPermissionService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: null }
    })

    const { sut } = makeSut()

    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      url: `teams`,
      method: 'GET'
    })
  })

  it('should parsed correctly each variable', async () => {
    localeMock()
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: [fixtures.teamPermissionMock]
      }
    })
    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual([
      {
        id: fixtures.teamPermissionMock.id,
        isActive: fixtures.teamPermissionMock.is_active,
        name: fixtures.teamPermissionMock.name,
        permissions: fixtures.teamPermissionMock.permissions.length
          ? fixtures.teamPermissionMock.permissions.map((item) => item.name)
          : []
      }
    ])
  })
})
