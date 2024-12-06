import { describe, it, expect, vi } from 'vitest'
import { openGraphQlPlayground } from '@/helpers/open-graphql-playground'

describe('openGraphQlPlayground', () => {
  it('should open the GraphQL playground with the correct URL', () => {
    const mockOpen = vi.spyOn(window, 'open').mockImplementation(() => {})

    const baseUrl = 'https://graphql-playground.com/'
    const query = `
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          name
        }
      }
    `
    const variables = { id: '123' }

    const encodedQuery = encodeURIComponent(query)
    const encodedVariables = encodeURIComponent(JSON.stringify(variables))
    const expectedUrl = `${baseUrl}#query=${encodedQuery}&variables=${encodedVariables}`

    openGraphQlPlayground(baseUrl, query, variables)

    expect(mockOpen).toHaveBeenCalledWith(expectedUrl, '_blank')

    mockOpen.mockRestore()
  })
})
