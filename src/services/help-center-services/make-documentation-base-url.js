const baseUrls = {
  stage: 'https://storage.googleapis.com/gcs-docs-help-center-stage',
  prod: 'https://storage.googleapis.com/gcs-docs-help-center'
}

const makeDocumentationBaseUrl = (environment) => baseUrls[environment]

export { makeDocumentationBaseUrl }
