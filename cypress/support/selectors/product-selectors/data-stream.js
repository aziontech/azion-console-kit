export default {
  createButton: '[data-testid="create_Stream_button"]',
  nameInput: '[data-testid="data-stream-form__general__name-field__input"]',
  sourceDropdown: '[data-testid="data-stream-form__data-settings__data-source-field__dropdown"]',
  templateDropdown: '[data-testid="data-stream-form__data-settings__template-field__dropdown"]',
  editorBody: '[data-testid="data-stream-form__data-settings__data-set-field"] .view-lines',
  connectorDropdown:
    '[data-testid="data-stream-form__destination__connector-field__dropdown"] > .p-dropdown-trigger',
  connectorOption: (optionIdx) => `#endpoint_${optionIdx}`,
  httpConnector: {
    urlInput: '[data-testid="data-stream-form__destination__url-field__input"]',
    headersInput: '[data-testid="data-stream-form__destination__headers-field__input"]',
    payloadInput: '[data-testid="data-stream-form__destination__payload-format-field__input"]',
    separatorInput:
      '[data-testid="data-stream-form__destination__payload-line-separator-field__input"]',
    maxSizeInput:
      '[data-testid="data-stream-form__destination__payload-max-size-field__input"] > .p-inputtext'
  },
  kafkaConnector: {
    serverTextarea:
      '[data-testid="data-stream-form__destination__bootstrap-servers-field__textarea"]',
    topicInput: '[data-testid="data-stream-form__destination__kafka-topic-field__input"]',
    useTlsSlider:
      '[data-testid="data-stream-form__destination__use-tls-field"] > .p-inputswitch-slider'
  },
  s3Connector: {
    urlInput: '[data-testid="data-stream-form__destination__url-field__input"]',
    bucketInput: '[data-testid="data-stream-form__destination__bucket-field__input"]',
    regionInput: '[data-testid="data-stream-form__destination__region-field__input"]',
    accessKeyInput: '[data-testid="data-stream-form__destination__access-key-field__input"]',
    secretKeyInput: '[data-testid="data-stream-form__destination__secret-key-field__input"]',
    objectKeyPrefixInput:
      '[data-testid="data-stream-form__destination__object-key-prefix-field__input"]'
  },
  bigQueryConnector: {
    projectIdInput: '[data-testid="data-stream-form__destination__project-id-field__input"]',
    datasetIdInput: '[data-testid="data-stream-form__destination__dataset-id-field__input"]',
    tableIdInput: '[data-testid="data-stream-form__destination__table-id-field__input"]',
    serviceAccountKeyInput:
      '[data-testid="data-stream-form__destination__service-account-key-field__input"]'
  },
  elasticsearchConnector: {
    urlInput: '[data-testid="data-stream-form__destination__elasticsearch-url-field__input"]',
    apiKeyTextarea: '[data-testid="data-stream-form__destination__api-key-field__textarea"]'
  },
  splunkConnector: {
    urlInput: '[data-testid="data-stream-form__destination__splunk-url-field__input"]',
    apiKeyTextarea: '[data-testid="data-stream-form__destination__splunk-api-key-field__textarea"]'
  },
  awsKinesisConnector: {
    streamNameInput:
      '[data-testid="data-stream-form__destination__kinesis-stream-name-field__input"]',
    regionInput: '[data-testid="data-stream-form__destination__kinesis-region-field__input"]',
    accessKeyInput:
      '[data-testid="data-stream-form__destination__kinesis-access-key-field__input"]',
    secretKeyInput: '[data-testid="data-stream-form__destination__kinesis-secret-key-field__input"]'
  },
  datadogConnector: {
    urlInput: '[data-testid="data-stream-form__destination__datadog-url-field__input"]',
    apiKeyTextarea: '[data-testid="data-stream-form__destination__datadog-api-key-field__textarea"]'
  },
  ibmQRadarConnector: {
    urlInput: '[data-testid="data-stream-form__destination__qradar-url-field__input"]'
  },
  azureMonitorConnector: {
    logTypeInput:
      '[data-testid="data-stream-form__destination__azure-monitor-log-type-field__input"]',
    sharedKeyInput:
      '[data-testid="data-stream-form__destination__azure-monitor-shared-key-field__input"]',
    timeGeneratedFieldInput:
      '[data-testid="data-stream-form__destination__azure-monitor-generated-field__input"]',
    workspaceIdInput:
      '[data-testid="data-stream-form__destination__azure-monitor-workspace-id-field__input"]'
  },
  azureBlobStorageConnector: {
    storageAccountInput:
      '[data-testid="data-stream-form__destination__azure-blob-storage-storage-account-field__input"]',
    containerNameInput:
      '[data-testid="data-stream-form__destination__azure-blob-storage-container-name-field__input"]',
    blobSasTokenInput:
      '[data-testid="data-stream-form__destination__azure-blob-storage-blob-token-field__input"]'
  },
  statusSlider: '[data-testid="data-stream-form__section__status"] input',
  list: {
    columnName: (columnName) => `[data-testid="list-table-block__column__${columnName}__row"]`
  }
}
