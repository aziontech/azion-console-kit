const baseUrls = {
  stage: 'https://storage.googleapis.com/gcs-docs-help-center-stage/console/',
  prod: 'https://storage.googleapis.com/gcs-docs-help-center/console/'
}

const makeDocumentationBaseUrl = (environment) => baseUrls[environment]

export { makeDocumentationBaseUrl }
