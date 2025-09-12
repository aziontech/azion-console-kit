const defaultSchemaFormBuilder = {
  type: 'object',
  properties: {
    cookie_name: {
      type: 'string',
      title: 'Cookie Name',
      description: 'Name of the cookie used to store the A/B test variation',
      default: 'azion_cookie',
      minLength: 1
    },
    domain: {
      type: 'string',
      title: 'Domain',
      description:
        "Domain where the cookie will be valid (use '.' at the beginning for subdomains)",
      default: '.azion.com',
      pattern: '^[.]?[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\\.[a-zA-Z]{2,}$'
    },
    max_age: {
      type: 'integer',
      title: 'Max Age (seconds)',
      description: 'Lifetime of the cookie in seconds',
      default: 180,
      minimum: 1,
      maximum: 31536000
    },
    path: {
      type: 'string',
      title: 'Path',
      description: 'Path where the cookie will be valid',
      default: '/',
      pattern: '^/'
    },
    values: {
      type: 'array',
      title: 'Test Variations',
      description: 'List of A/B test variations with their respective weights',
      minItems: 2,
      maxItems: 10,
      items: {
        type: 'object',
        properties: {
          value: {
            type: 'string',
            title: 'Variation Value',
            description: 'Unique identifier of the variation',
            minLength: 1,
            maxLength: 50,
            pattern: '^[a-zA-Z0-9_-]+$'
          },
          weight: {
            type: 'integer',
            title: 'Weight',
            description: 'Variation weight (higher weight = higher probability)',
            minimum: 1,
            maximum: 100
          }
        },
        required: ['value', 'weight'],
        additionalProperties: false
      }
    }
  },
  required: ['cookie_name', 'domain', 'max_age', 'values']
}

export { defaultSchemaFormBuilder }
