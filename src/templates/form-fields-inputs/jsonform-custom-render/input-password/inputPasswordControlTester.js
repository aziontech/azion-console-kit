import { rankWith, isStringControl, and, schemaMatches } from '@jsonforms/core'
export const InputPasswordControlTester = rankWith(
  15,
  and(
    isStringControl,
    schemaMatches((schema) => schema.format === 'password')
  )
)
