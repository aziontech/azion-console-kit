import { eventsPlaygroundOpener } from '@/helpers'
import { describe, expect, it, vi, afterAll } from 'vitest'

const makeSut = () => {
  const sut = eventsPlaygroundOpener
  return { sut }
}

const scenarios = [
  {
    label: 'should open a new window for the events playground in the prod environment',
    href: 'https://azion.com',
    expected: 'https://stage-manager.azion.com/events/graphql#query=undefined&variables=undefined'
  },
  {
    label: 'should open a new window for the events playground in the stage environment',
    href: 'http://localhost',
    expected: 'https://stage-manager.azion.com/events/graphql#query=undefined&variables=undefined'
  }
]

describe('eventsPlaygroundOpener', () => {
  afterAll(() => {
    vi.restoreAllMocks()
  })

  it.each(scenarios)('$label', async ({ href, expected }) => {
    Object.defineProperty(window, 'location', {
      value: {
        href: href
      },
      writable: true
    })

    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => {})

    const { sut } = makeSut()
    await sut()

    expect(openSpy).toHaveBeenCalledWith(expected, '_blank')
  })
})
