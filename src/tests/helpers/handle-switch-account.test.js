import { AccountHandler } from '@/helpers/handle-switch-account'
import { AccountNotFoundError } from '@/services/axios/errors/account-not-found-error'
import { describe, expect, it, vi } from 'vitest'

const makeSut = ({ accountId, firstLogin }) => {
  const mockSwitch = vi.fn().mockResolvedValueOnce({ firstLogin })
  const listService = vi.fn().mockResolvedValue({ results: [{ accountId }] })

  const sut = new AccountHandler(mockSwitch, listService)

  return {
    sut
  }
}

describe('HandleSwitchAccount', () => {
  it('should return additional-data if firstLogin is true', async () => {
    const { sut } = makeSut({ accountId: '1', firstLogin: true })

    const result = await sut.switchAndReturnAccountPage('1')

    expect(result).toEqual({ name: 'additional-data' })
  })

  it('should return home if firstLogin is false', async () => {
    const { sut } = makeSut({ accountId: '1', firstLogin: false })

    const result = await sut.switchAndReturnAccountPage('1')

    expect(result).toEqual({ name: 'home' })
  })

  it('should return home if the first login is false and no account identification is present', async () => {
    const { sut } = makeSut({ accountId: '1', firstLogin: false })

    const response = await sut.switchAndReturnAccountPage()

    expect(response).toEqual({ name: 'home' })
  })

  it('should return additional data if the first login is true and no account identification is present', async () => {
    const { sut } = makeSut({ accountId: '1', firstLogin: true })

    const response = await sut.switchAndReturnAccountPage()

    expect(response).toEqual({ name: 'additional-data' })
  })

  it('should throw an AccountNotFoundError if called without a valid account', async () => {
    const { sut } = makeSut({ accountId: undefined, firstLogin: false })

    const response = sut.switchAndReturnAccountPage()

    expect(response).rejects.toThrow(new AccountNotFoundError().message)
  })
})
