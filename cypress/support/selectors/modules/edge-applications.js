/**
 * Edge Applications Module Selectors
 *
 * Based on cypress/specs/_catalogs/edge-applications.md
 *
 * Routes:
 * - /applications (list)
 * - /applications/create
 * - /applications/edit/:id
 * - /applications/edit/:id/:tab
 *
 * API: v4/workspace/applications
 */

export default {
  // Page content blocks
  contentBlock: {
    list: '[data-testid="edge-applications-content-block"]',
    create: '[data-testid="create-edge-application-content-block"]'
  },

  // Page headings
  pageHeading: {
    list: '[data-testid="edge-applications-heading"]',
    create: '[data-testid="create-edge-application-heading"]'
  },

  // Create button (on list page) - uses addButtonLabel="Application"
  createButton: '[data-testid="create_Application_button"]',

  // List table
  listTableBlock: '[data-testid="edge-applications-list-table-block"]',

  // Form block
  formBlock: '[data-testid="create-edge-application-form-block"]',

  // Form fields - General Settings
  form: {
    // Name field - FieldText uses __input suffix pattern
    name: {
      container: '[data-testid="form-horizontal-general-name"]',
      input: '[data-testid="form-horizontal-general-name__input"]',
      label: '[data-testid="form-horizontal-general-name__label"]',
      error: '[data-testid="form-horizontal-general-name__error-message"]'
    },

    // Modules section (toggles)
    modules: {
      container: '[data-testid="form-horizontal-modules-default-switch"]',
      // Individual module toggles
      applicationAccelerator: '[data-testid="form-horizontal-modules-default-switch__application-accelerator"]',
      edgeCaching: '[data-testid="form-horizontal-modules-default-switch__edge-caching"]',
      edgeFunctions: '[data-testid="form-horizontal-modules-default-switch__edge-functions"]',
      imageProcessor: '[data-testid="form-horizontal-modules-default-switch__image-processor"]',
      loadBalancer: '[data-testid="form-horizontal-modules-default-switch__load-balancer"]',
      tieredCache: '[data-testid="form-horizontal-modules-default-switch__tiered-cache"]',
      webApplicationFirewall: '[data-testid="form-horizontal-modules-default-switch__waf"]'
    },

    // Active/Status toggle
    active: {
      container: '[data-testid="form-horizontal-active-switch"]',
      switch: '[data-testid="form-horizontal-active-switch"] .p-inputswitch',
      slider: '[data-testid="form-horizontal-active-switch"] .p-inputswitch-slider'
    },

    // Debug Rules toggle
    debugRules: {
      container: '[data-testid="form-horizontal-debug-rules-switch"]',
      switch: '[data-testid="form-horizontal-debug-rules-switch"] .p-inputswitch',
      slider: '[data-testid="form-horizontal-debug-rules-switch"] .p-inputswitch-slider'
    },

    // Delivery Settings (v4 form)
    deliverySettings: {
      // Protocol usage (HTTP, HTTPS, HTTP & HTTPS)
      protocol: {
        container: '[data-testid="form-horizontal-delivery-settings-protocol-usage"]',
        http: '[data-testid="form-horizontal-delivery-settings-protocol-usage__http"]',
        https: '[data-testid="form-horizontal-delivery-settings-protocol-usage__https"]',
        httpHttps: '[data-testid="form-horizontal-delivery-settings-protocol-usage__http-https"]'
      },

      // HTTP Ports
      httpPorts: {
        container: '[data-testid="form-horizontal-delivery-settings-http-ports-multi-select"]',
        multiSelect: '[data-testid="form-horizontal-delivery-settings-http-ports-multi-select"] .p-multiselect',
        input: '[data-testid="form-horizontal-delivery-settings-http-ports-multi-select"] input'
      },

      // HTTPS Ports
      httpsPorts: {
        container: '[data-testid="form-horizontal-delivery-settings-https-ports-multi-select"]',
        multiSelect: '[data-testid="form-horizontal-delivery-settings-https-ports-multi-select"] .p-multiselect',
        input: '[data-testid="form-horizontal-delivery-settings-https-ports-multi-select"] input'
      },

      // TLS Version
      tlsVersion: {
        container: '[data-testid="form-horizontal-delivery-settings-tls-version-field-dropdown"]',
        dropdown: '[data-testid="form-horizontal-delivery-settings-tls-version-field-dropdown"] .p-dropdown'
      },

      // Origin Address
      address: {
        container: '[data-testid="form-horizontal-delivery-settings-address"]',
        input: '[data-testid="form-horizontal-delivery-settings-address"] input'
      },

      // Host Header
      hostHeader: {
        container: '[data-testid="form-horizontal-delivery-settings-host-header"]',
        input: '[data-testid="form-horizontal-delivery-settings-host-header"] input'
      },

      // CDN Cache TTL
      cdnCacheTtl: {
        container: '[data-testid="form-horizontal-delivery-settings-cdn-cache-ttl"]',
        input: '[data-testid="form-horizontal-delivery-settings-cdn-cache-ttl"] input'
      }
    }
  },

  // Tabs (for edit view)
  tabs: {
    container: '.p-tabview',
    tabList: '.p-tabview-nav',
    // Tab headers by name
    mainSettings: '[data-testid="edge-applications__tab__main-settings"]',
    origins: '[data-testid="edge-applications__tab__origins"]',
    deviceGroups: '[data-testid="edge-applications__tab__device-groups"]',
    errorResponses: '[data-testid="edge-applications__tab__error-responses"]',
    cacheSettings: '[data-testid="edge-applications__tab__cache-settings"]',
    functions: '[data-testid="edge-applications__tab__functions"]',
    rulesEngine: '[data-testid="edge-applications__tab__rules-engine"]',
    // Tab header pattern (0-indexed)
    tabHeader: (index) => `.p-tabview-nav li:nth-child(${index + 1})`,
    // Tab panel pattern
    tabPanel: (index) => `.p-tabview-panels > div:nth-child(${index + 1})`
  },

  // List table columns
  list: {
    column: {
      name: '[data-testid="list-table-block__column__name__row"]',
      id: '[data-testid="list-table-block__column__id__row"]',
      status: '[data-testid="list-table-block__column__active__row"]',
      lastEditor: '[data-testid="list-table-block__column__lastEditor__row"]',
      lastModified: '[data-testid="list-table-block__column__lastModified__row"]'
    },
    getColumn: (columnName) => `[data-testid="list-table-block__column__${columnName}__row"]`
  },

  // Empty state
  empty: {
    container: '[data-testid="edge-applications__list-view__empty-results-block"]',
    message: '[data-testid="list-table-block__empty-message__text"]',
    createButton: '[data-testid="list-table-block__empty-results-block__create-button"]'
  },

  // Clone dialog
  clone: {
    dialog: '[data-testid="edge-applications__clone-dialog"]',
    nameInput: '[data-testid="edge-applications__clone-dialog__name-input"]',
    confirmButton: '[data-testid="edge-applications__clone-dialog__confirm-button"]',
    cancelButton: '[data-testid="edge-applications__clone-dialog__cancel-button"]'
  },

  // Locked application badge
  locked: {
    badge: '[data-testid="edge-applications__locked-badge"]',
    tooltip: '[data-testid="edge-applications__locked-tooltip"]'
  },

  // Drawer (for quick create from other modules)
  drawer: {
    container: '[data-testid="edge-applications__drawer"]',
    header: '[data-testid="edge-applications__drawer__header"]',
    closeButton: '[data-testid="edge-applications__drawer__close-button"]'
  },

  // Toast messages (for verification)
  toast: {
    created: 'Your Application has been created',
    updated: 'Your application has been updated',
    cloned: 'Your Application has been cloned',
    deleted: 'Resource successfully deleted',
    locked: 'This instance is locked and cannot be modified'
  },

  // Validation patterns
  validation: {
    nameRequired: 'Name is a required field',
    addressRequired: 'Address is a required field',
    hostHeaderRequired: 'Host Header is a required field',
    httpPortRequired: 'HTTP port is required when HTTP protocol is selected',
    httpsPortRequired: 'HTTPS port is required when HTTPS protocol is selected'
  },

  // Delivery protocols
  deliveryProtocols: {
    http: 'http',
    https: 'https',
    httpHttps: 'http,https'
  },

  // Common ports
  ports: {
    http: ['80', '8080', '8008'],
    https: ['443', '8443', '9440', '9441', '9442', '9443']
  }
}
