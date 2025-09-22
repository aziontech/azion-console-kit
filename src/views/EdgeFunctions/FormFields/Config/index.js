const defaultSchemaFormBuilder = {
  type: 'object',
  properties: {
    cookie_name: {
      type: 'string',
      title: 'Cookie Name',
      description: 'Name of the cookie used to store the A/B test variation',
      minLength: 1
    },
    domain: {
      type: 'string',
      title: 'Domain',
      description:
        "Domain where the cookie will be valid (use '.' at the beginning for subdomains)",
      pattern: '^[.]?[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\\.[a-zA-Z]{2,}$'
    },
    max_age: {
      type: 'integer',
      title: 'Max Age (seconds)',
      description: 'Lifetime of the cookie in seconds',
      minimum: 1,
      maximum: 31536000
    },
    path: {
      type: 'string',
      title: 'Path',
      description: 'Path where the cookie will be valid',
      pattern: '^/'
    },
    values: {
      type: 'array',
      title: 'Test Variations',
      description: 'List of A/B test variations with their respective weights',
      minItems: 0,
      maxItems: 6,
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
        required: ['value', 'weight']
      }
    }
  },
  required: ['cookie_name', 'domain']
}

export { defaultSchemaFormBuilder }
