const baseUrls = {
  stage: 'https://storage.googleapis.com/gcs-docs-help-center-stage/console/',
  production: 'https://storage.googleapis.com/gcs-docs-help-center/console/'
}

const makeDocumentationBaseUrl = (environment) => baseUrls[environment] || baseUrls.stage

export { makeDocumentationBaseUrl }
