export default {
  createButton: '[data-testid="create_Edge Connectors_button"] > .p-button-label',
  name: '[data-testid="edge-connectors-form__general__name-field__input"]',
  typeDropdown: '[data-testid="edge-connectors-form__connector-type__type-field"]',
  http: {
    host: '[data-testid="edge-connectors-form__connection-options__host-field__input"]',
    path: '[data-testid="edge-connectors-form__connection-options__path-field__input"]',
    realIpHeader: '[data-testid="edge-connectors-form__connection-options__real-ip-header-field__input"]',
    realPortHeader: '[data-testid="edge-connectors-form__connection-options__real-port-header-field__input"]',
    followingRedirect: '[data-testid="edge-connectors-form__connection-options__following-redirect-field__switch"] > .p-inputswitch-slider'
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
    bucket: '[data-testid="edge-connectors-form__connection-options__bucket-name-field"]',
    prefix: '[data-testid="edge-connectors-form__connection-options__prefix-field__input"]',
  },
  liveIngest: {
    region: '[data-testid="edge-connectors-form__connection-options__region-field__dropdown"]',
    optionDropdown: '#region_0'
  },
  address: '[data-testid="edge-connectors-form__address-management__address-field__input"]',
  saveButton: '[data-testid="form-actions-submit-button"] > .p-button-label',
  tableRow: '[data-testid="list-table-block__column__name__row"]',
  tlsPolicyOption2: '[data-testid="edge-connectors-form__host-settings__tls-field__radio__tlsPolicy-radio-1"] > .p-card-body > .p-card-content > .p-2 > :nth-child(1) > .p-radiobutton > .p-radiobutton-box',
  productVersion: '[data-testid="edge-connectors-form__host-settings__product-version-field__input"]',
  connectionTimeout: '[data-testid="edge-connectors-form__timeouts__connection-timeout-field__input"]',
  readWriteTimeout: '[data-testid="edge-connectors-form__timeouts__read-write-timeout-field__input"]',
  maxRetries: '[data-testid="edge-connectors-form__timeouts__max-retries-field__input"]',
}
