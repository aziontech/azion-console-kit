import { rankWith, schemaMatches, isControl } from '@jsonforms/core'

const hasOneOfWithConst = schemaMatches((schema) => {
  return Array.isArray(schema.oneOf) && schema.oneOf.every((item) => item.const !== undefined)
})

export const DropdownControlTester = rankWith(
  10,
  (uischema, schema, context) => {
    if (!isControl(uischema)) return false
		return hasOneOfWithConst(uischema, schema, context) ? true : false
  }
)
