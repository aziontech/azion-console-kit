import { AccountHandler } from '@/helpers/account-handler'
import { ProccessRequestError } from '@/services/axios/errors'
import { AccountNotFoundError } from '@/services/axios/errors/account-not-found-error'
import { afterAll, describe, expect, it, vi } from 'vitest'

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

  it('should return login url when user info is not found', async () => {
    const verifyService = vi.fn().mockResolvedValue({ user_tracking_info: null })
    const refreshService = vi.fn()
    const { sut } = makeSut({ accountId: '1', firstLogin: false })

    const result = await sut.switchAccountFromSocialIdp(verifyService, refreshService)
    expect(result).toEqual('/login')
  })

  it('should return mfa/setup url if twoFactor is true and trustedDevice is false', async () => {
    const verifyService = vi.fn().mockResolvedValue({
      user_tracking_info: { props: { account_id: '1' } },
      twoFactor: true,
      trustedDevice: false
    })
    const refreshService = vi.fn()
    const { sut } = makeSut({ accountId: '1', firstLogin: false })

    const result = await sut.switchAccountFromSocialIdp(verifyService, refreshService)
    expect(result).toEqual('/mfa/setup')
  })

  it('should return mfa/authentication if twoFactor is true and trustedDevice is true', async () => {
    const verifyService = vi.fn().mockResolvedValue({
      user_tracking_info: { props: { account_id: '1' } },
      twoFactor: true,
      trustedDevice: true
    })
    const refreshService = vi.fn()
    const { sut } = makeSut({ accountId: '1', firstLogin: false })

    const result = await sut.switchAccountFromSocialIdp(verifyService, refreshService)
    expect(result).toEqual('/mfa/authentication')
  })

  it('should return the object to redirect to home if twoFactor and firstLogin is false', async () => {
    const verifyService = vi.fn().mockResolvedValue({
      user_tracking_info: { props: { account_id: '1' } },
      twoFactor: false,
      trustedDevice: false
    })
    const refreshService = vi.fn()
    const { sut } = makeSut({ accountId: '1', firstLogin: false })

    const result = await sut.switchAccountFromSocialIdp(verifyService, refreshService)
    expect(result).toEqual({ name: 'home' })
  })

  it('should return the object to redirect to additional-data if twoFactor and firstLogin is true', async () => {
    const verifyService = vi.fn().mockResolvedValue({
      user_tracking_info: { props: { account_id: '1' } },
      twoFactor: false,
      trustedDevice: false
    })
    const refreshService = vi.fn()
    const { sut } = makeSut({ accountId: '1', firstLogin: true })

    const result = await sut.switchAccountFromSocialIdp(verifyService, refreshService)
    expect(result).toEqual({ name: 'additional-data' })
  })

  it('should call the refresh service when verifyService throws', async () => {
    const verifyService = vi.fn().mockRejectedValueOnce(new Error())
    const refreshService = vi.fn().mockRejectedValueOnce(new Error())

    const { sut } = makeSut({ accountId: '1', firstLogin: true })

    await expect(sut.switchAccountFromSocialIdp(verifyService, refreshService)).rejects.toThrow(
      new ProccessRequestError().message
    )
    expect(refreshService).toHaveBeenCalled()
  })
})
