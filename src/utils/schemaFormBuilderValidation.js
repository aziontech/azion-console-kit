import Ajv from 'ajv'

const ajv = new Ajv({ allErrors: true })
const schemaRef = {
  title: 'AzionFormSchema',
  type: 'object',
  properties: {
    type: {
      const: 'object'
    },
    properties: {
      type: 'object',
      additionalProperties: {
        $ref: '#/$defs/field'
      }
    },
    required: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    additionalProperties: {
      type: 'boolean'
    }
  },
  required: ['type', 'properties'],
  additionalProperties: false,
  $defs: {
    field: {
      type: 'object',
      required: ['type'],
      properties: {
        type: {
          type: 'string',
          enum: ['string', 'integer', 'number', 'boolean', 'object', 'array']
        },
        title: {
          type: 'string'
        },
        description: {
          type: 'string'
        },
        default: {},
        minLength: {
          type: 'integer',
          minimum: 0
        },
        maxLength: {
          type: 'integer',
          minimum: 0
        },
        pattern: {
          type: 'string'
        },
        minimum: {
          type: 'number'
        },
        maximum: {
          type: 'number'
        },
        exclusiveMinimum: {
          type: 'number'
        },
        exclusiveMaximum: {
          type: 'number'
        },
        minItems: {
          type: 'integer',
          minimum: 0
        },
        maxItems: {
          type: 'integer',
          minimum: 0
        },
        properties: {
          type: 'object',
          additionalProperties: {
            $ref: '#/$defs/field'
          }
        },
        items: {
          $ref: '#/$defs/field'
        },
        required: {
          type: 'array',
          items: {
            type: 'string'
          }
        },
        additionalProperties: {
          type: 'boolean'
        }
      },
      additionalProperties: false
    }
  }
}

const isValidFormBuilderSchema = (json, schema = schemaRef) => {
  let isValid = { valid: false, errors: null }
  const validate = ajv.compile(schema)

  try {
    const valid = validate(json)
    isValid = { valid, errors: validate.errors }
  } catch (error) {
    isValid.errors = [error.message]
  }

  return isValid
}

export { isValidFormBuilderSchema }
