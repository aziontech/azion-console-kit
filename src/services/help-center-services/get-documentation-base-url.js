const baseUrls = {
  stage: 'https://storage.googleapis.com/gcs-docs-help-center-stage',
  prod: 'https://storage.googleapis.com/gcs-docs-help-center',
};

const getDocumentationBaseUrl = (environment) => baseUrls[environment];

export { getDocumentationBaseUrl };

