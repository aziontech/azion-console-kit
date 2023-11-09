import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadTeamPermissionService } from '@/services/team-permission'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fixtures = {
  teamPermissionMock: {
    id: 2,
    name: 'Default',
    is_active: true,
    permissions: [{ id: 324, name: 'permission' }]
  }
}

const makeSut = () => {
  const sut = loadTeamPermissionService

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
      body: fixtures.teamPermissionMock
    })
    const teamPermissionMockId = 2
    const { sut } = makeSut()

    await sut({ id: teamPermissionMockId })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `teams/${teamPermissionMockId}`,
      method: 'GET'
    })
  })

  it('should parsed correctly the returned', async () => {
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.teamPermissionMock
    })
    const { sut } = makeSut()

    const result = await sut({ id: fixtures.teamPermissionMock.id })

    expect(result).toEqual({
        id: fixtures.teamPermissionMock.id,
        name: fixtures.teamPermissionMock.name,
        isActive: fixtures.teamPermissionMock.is_active,
        permissions: fixtures.teamPermissionMock.permissions
    })
  })
})
