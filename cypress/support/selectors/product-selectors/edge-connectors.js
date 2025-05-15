export default {
  createButton: '[data-testid="create_Edge Connectors_button"] > .p-button-label',
  name: '[data-testid="edge-connectors-form__general__name-field__input"]',
  typeDropdown: '[data-testid="edge-connectors-form__host-settings__type-field__dropdown"] > .p-dropdown-label',
  http: {
    host: '[data-testid="edge-connectors-form__host-settings__http-host-field__input"]',
    path: '[data-testid="edge-connectors-form__host-settings__http-path-field__input"]',
    realIpHeader: '[data-testid="edge-connectors-form__host-settings__http-real-ip-header-field__input"]',
    realPortHeader: '[data-testid="edge-connectors-form__host-settings__http-real-port-header-field__input"]',
    followingRedirect: '[data-testid="edge-connectors-form__host-settings__http-following-redirect-field__switch"] > .p-inputswitch-slider'
  },
  s3: {
    host: '[data-testid="edge-connectors-form__host-settings__s3-host-field__input"]',
    bucket: '[data-testid="edge-connectors-form__host-settings__s3-bucket-field__input"]',
    path: '[data-testid="edge-connectors-form__host-settings__s3-path-field__input"]',
    region: '[data-testid="edge-connectors-form__host-settings__s3-region-field__input"]',
    accessKey: '[data-testid="edge-connectors-form__host-settings__s3-access-key-field__input"]',
    secretKey: '[data-testid="edge-connectors-form__host-settings__s3-secret-key-field__input"]',
  },
  edgeStorage: {
    bucket: '[data-testid="edge-connectors-form__host-settings__edge-storage-bucket-field__input"]',
    prefix: '[data-testid="edge-connectors-form__host-settings__edge-storage-prefix-field__input"]',
  },
  liveIngest: {
    endpoint: '[data-testid="edge-connectors-form__host-settings__liveIngestEndpoint-field__dropdown"]',
    optionDropdown: '#liveIngestEndpoint_1'
  },
  address: '[data-testid="edge-connectors-form__addresses__address-field__input"]',
  saveButton: '[data-testid="form-actions-submit-button"] > .p-button-label',
  tableRow: '[data-testid="list-table-block__column__name__row"]',
  tlsPolicyOption2: '[data-testid="edge-connectors-form__host-settings__tls-field__radio__tlsPolicy-radio-1"] > .p-card-body > .p-card-content > .p-2 > :nth-child(1) > .p-radiobutton > .p-radiobutton-box',
  productVersion: '[data-testid="edge-connectors-form__host-settings__product-version-field__input"]',
  connectionTimeout: '[data-testid="edge-connectors-form__timeouts__connection-timeout-field__input"]',
  readWriteTimeout: '[data-testid="edge-connectors-form__timeouts__read-write-timeout-field__input"]',
  maxRetries: '[data-testid="edge-connectors-form__timeouts__max-retries-field__input"]',
}
