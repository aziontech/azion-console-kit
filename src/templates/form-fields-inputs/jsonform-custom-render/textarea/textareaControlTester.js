import { rankWith, isStringControl, and, schemaMatches } from '@jsonforms/core'
export const TextareaControlTester = rankWith(
  3,
  and(
    isStringControl,
    schemaMatches((schema) => schema.options?.multi)
  )
)
