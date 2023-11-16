import { useCreateBoardManager } from '@/helpers/use-create-board-manager'
import { describe, expect, it } from 'vitest'

const makeSut = () => {
  const sut = useCreateBoardManager
  return { sut }
}

describe('useCreateBoardManager', () => {
  it('Should return basic object', () => {
    const { sut } = makeSut()
    const createBoardManager = sut()

    expect(createBoardManager.enabled.value).toBe(false)
    expect(createBoardManager.open).toBeTypeOf('function')
    expect(createBoardManager.close).toBeTypeOf('function')
  })

  it('Should change value of enabled on open', () => {
    const { sut } = makeSut()
    const createBoardManager = sut()
    createBoardManager.open()

    expect(createBoardManager.enabled.value).toBe(true)
  })

  it('Should change value of enabled on close', () => {
    const { sut } = makeSut()
    const createBoardManager = sut()
    createBoardManager.open()
    createBoardManager.close()

    expect(createBoardManager.enabled.value).toBe(false)
  })
})
