import * as exportSwitchAccount from '@/services/auth-services/switch-account-service'
import * as exportListAccount from '@/services/switch-account-services/list-type-account-service'
import { switchAccountLogin } from '@/helpers/handle-switch-account'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = switchAccountLogin

  return {
    sut
  }
}

describe('HandleSwitchAccount', () => {
  it('should return additional-data if firstLogin is true', async () => {
    const { sut } = makeSut()
    const accountId = 'mockedAccountId'
    const mockSwitchAccountService = vi
      .spyOn(exportSwitchAccount, 'switchAccountService')
      .mockResolvedValueOnce({
        first_login: true
      })

    const result = await sut(accountId)

    expect(result).toEqual({ name: 'additional-data' })
    expect(mockSwitchAccountService).toHaveBeenCalledWith(accountId)
  })

  it('should return home if firstLogin is false', async () => {
    const { sut } = makeSut()
    const accountId = 'mockedAccountId'
    const mockSwitchAccountService = vi
      .spyOn(exportSwitchAccount, 'switchAccountService')
      .mockResolvedValueOnce({
        first_login: false
      })

    const result = await sut(accountId)

    expect(result).toEqual({ name: 'home' })
    expect(mockSwitchAccountService).toHaveBeenCalledWith(accountId)
  })

  it.each([
    {
      scenario: 'type brands',
      accountId: 'accountIdBrands',
      call: 1
    },
    {
      scenario: 'type resellers',
      accountId: 'accountIdResellers',
      call: 2
    },
    {
      scenario: 'type groups',
      accountId: 'accountIdGroups',
      call: 3
    },
    {
      scenario: 'type clients',
      accountId: 'accountIdClients',
      call: 4
    }
  ])(
    'Should return an API response for $scenario and verify the number of calls to listTypeAccountService',
    async ({ accountId, call }) => {
      const mockSwitchAccountService = vi
        .spyOn(exportSwitchAccount, 'switchAccountService')
        .mockResolvedValueOnce({
          first_login: false
        })

      const mockListAccount = vi
        .spyOn(exportListAccount, 'listTypeAccountService')
        .mockImplementation(() => {
          if (mockListAccount.mock.calls.length === call) {
            return Promise.resolve({
              results: [{ accountId }]
            })
          }

          return Promise.resolve({
            results: []
          })
        })

      const { sut } = makeSut()

      await sut()

      expect(mockSwitchAccountService).toHaveBeenCalledTimes(1)
      expect(mockListAccount).toHaveBeenCalledTimes(call)
      expect(mockSwitchAccountService).toHaveBeenCalledWith(accountId)
    }
  )

  it('should throw an error when no account is found', async () => {
    const mockSwitchAccountService = vi
      .spyOn(exportSwitchAccount, 'switchAccountService')
      .mockResolvedValueOnce({
        first_login: false
      })

    vi.spyOn(exportListAccount, 'listTypeAccountService').mockResolvedValueOnce({ results: [] })

    const { sut } = makeSut()

    const response = sut()

    expect(response).rejects.toThrow('No account found')
    expect(mockSwitchAccountService).not.toHaveBeenCalled()
  })
})
