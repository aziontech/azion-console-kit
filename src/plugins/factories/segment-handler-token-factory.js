function segmentHandlerToken(environment) {
  const secretVariable = {
    production: 'VITE_PROD_SEGMENT_TOKEN'
  }

  const token = secretVariable[environment] || 'VITE_STAGE_SEGMENT_TOKEN'

  const segmentToken = import.meta.env[token]

  if (!segmentToken) {
    // eslint-disable-next-line no-console
    console.warn('Segment token is missing')
    return ''
  }

  return segmentToken
}

export { segmentHandlerToken }
