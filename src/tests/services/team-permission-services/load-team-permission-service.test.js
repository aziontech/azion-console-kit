import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadTeamPermissionService } from '@/services/team-permission'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  teamPermissionMock: {
    data: {
      id: 2,
      name: 'Default',
      is_active: true,
      permissions: [{ id: 324, name: 'permission' }]
    }
  }
}

const makeSut = () => {
  const sut = loadTeamPermissionService

  return {
    sut
  }
}

describe('TeamPermissionService', () => {
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
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.teamPermissionMock
    })
    const { sut } = makeSut()

    const result = await sut({ id: fixtures.teamPermissionMock.id })

    expect(result).toEqual({
      id: fixtures.teamPermissionMock.data.id,
      name: fixtures.teamPermissionMock.data.name,
      isActive: fixtures.teamPermissionMock.data.is_active,
      permissions: fixtures.teamPermissionMock.data.permissions
    })
  })
})
