import { describe, expect, it } from 'vitest'
import { convertArrayObjectsToCamelCase } from '@/helpers/convert-array-objects-to-camel-case'

describe('convertArrayObjectsToCamelCase', () => {
  it('should convert an array of objects from snake_case to camelCase', () => {
    const inputArray = [
      {
        first_name: 'John',
        last_name: 'Doe',
        email_address: 'john.doe@example.com'
      },
      {
        first_name: 'Jane',
        last_name: 'Smith',
        email_address: 'jane.smith@example.com'
      }
    ]

    const expectedOutput = [
      {
        firstName: 'John',
        lastName: 'Doe',
        emailAddress: 'john.doe@example.com'
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        emailAddress: 'jane.smith@example.com'
      }
    ]

    const result = convertArrayObjectsToCamelCase(inputArray)
    expect(result).toEqual(expectedOutput)
  })

  it('should handle empty array', () => {
    const inputArray = []
    const result = convertArrayObjectsToCamelCase(inputArray)
    expect(result).toEqual([])
  })

  it('should handle nested objects', () => {
    const inputArray = [
      {
        user_info: {
          first_name: 'John',
          last_name: 'Doe'
        },
        contact_details: {
          email_address: 'john.doe@example.com',
          phone_number: '1234567890'
        }
      }
    ]

    const expectedOutput = [
      {
        userInfo: {
          firstName: 'John',
          lastName: 'Doe'
        },
        contactDetails: {
          emailAddress: 'john.doe@example.com',
          phoneNumber: '1234567890'
        }
      }
    ]

    const result = convertArrayObjectsToCamelCase(inputArray)
    expect(result).toEqual(expectedOutput)
  })
})
