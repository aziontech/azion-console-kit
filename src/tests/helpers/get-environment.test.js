import { getEnvironment } from '@/helpers'
import { afterEach, describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = getEnvironment

  return {
    sut
  }
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getEnvironment', () => {
  it.each(['development', 'stage', 'production'])(
    'should return the environment mode as "%s"',
    (env) => {
      vi.stubEnv('VITE_ENVIRONMENT', env)

      const { sut } = makeSut()
      const mode = sut()

      expect(mode).toBe(env)
    }
  )
})
