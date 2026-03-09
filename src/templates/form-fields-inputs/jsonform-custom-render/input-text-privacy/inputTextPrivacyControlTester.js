import { rankWith, isStringControl, and, schemaMatches } from '@jsonforms/core'
export const InputTextPrivacyControlTester = rankWith(
  15,
  and(
    isStringControl,
    schemaMatches((schema) => schema.format === 'privacy')
  )
)
