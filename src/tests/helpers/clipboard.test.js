import { clipboardWrite } from '@/helpers'
import { afterAll, describe, expect, it, vi } from 'vitest'

const makeSut = ({ clipboardMock }) => {
  vi.stubGlobal('navigator', {
    clipboard: clipboardMock
  })
  const sut = clipboardWrite

  return {
    sut
  }
}

describe('Clipboard', () => {
  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('should call clipboard web API with correct content', async () => {
    const { sut } = makeSut({
      clipboardMock: {
        writeText: vi.fn()
      }
    })
    const textToCopyMock = 'Edge-app-name-foo'
    const writeTextSpy = vi.spyOn(window.navigator.clipboard, 'writeText')

    await sut(textToCopyMock)

    expect(writeTextSpy).toHaveBeenCalledWith(textToCopyMock)
  })

  it('should not call clipboard when navigator is not available', async () => {
    const textToCopyStub = 'stub-text'
    const { sut } = makeSut({
      clipboardMock: null
    })

    const result = sut(textToCopyStub)

    expect(result).rejects.toBe('Navigator is not available')
  })
})
