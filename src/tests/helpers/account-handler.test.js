import { AccountHandler } from '@/helpers/account-handler'
import { AccountNotFoundError } from '@/services/axios/errors/account-not-found-error'
import { describe, expect, it, vi, afterAll } from 'vitest'

vi.stubGlobal('window', {
  location: {
    replace: vi.fn()
  }
})

const makeSut = ({ accountId, firstLogin }) => {
  const mockSwitch = vi.fn().mockResolvedValueOnce({ firstLogin })
  const listService = vi.fn().mockResolvedValue({ results: [{ accountId }] })

  const sut = new AccountHandler(mockSwitch, listService)

  return { sut }
}

describe('AccountHandler', () => {
  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('should return additional data if firstLogin is true', async () => {
    const { sut } = makeSut({ accountId: '1', firstLogin: true })

    const result = await sut.switchAndReturnAccountPage('1')

    expect(result).toEqual({ name: 'additional-data' })
  })

  it('should return home if firstLogin is false', async () => {
    const { sut } = makeSut({ accountId: '1', firstLogin: false })

    const result = await sut.switchAndReturnAccountPage('1')

    expect(result).toEqual({ name: 'home' })
  })

  it('should return home if firstLogin is false and no account identification is present', async () => {
    const { sut } = makeSut({ accountId: '1', firstLogin: false })

    const response = await sut.switchAndReturnAccountPage()

    expect(response).toEqual({ name: 'home' })
  })

  it('should return additional data if firstLogin is true and no account identification is present', async () => {
    const { sut } = makeSut({ accountId: '1', firstLogin: true })

    const response = await sut.switchAndReturnAccountPage()

    expect(response).toEqual({ name: 'additional-data' })
  })

  it('should throw an AccountNotFoundError if called without a valid account', async () => {
    const { sut } = makeSut({ accountId: undefined, firstLogin: false })

    await expect(sut.switchAndReturnAccountPage()).rejects.toThrow(
      new AccountNotFoundError().message
    )
  })

  it('should redirect to home if firstLogin is false', async () => {
    const spyReplace = vi.spyOn(window.location, 'replace')
    const { sut } = makeSut({ accountId: '1', firstLogin: false })
    await sut.switchAccountAndRedirect('1')

    expect(spyReplace).toHaveBeenCalledWith('/')
  })

  it('should redirect to additional-data if firstLogin is true', async () => {
    const { sut } = makeSut({ accountId: '1', firstLogin: true })
    await sut.switchAccountAndRedirect('1')

    expect(window.location).toEqual('/signup/additional-data')
  })
})
