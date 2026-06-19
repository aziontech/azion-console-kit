const DEPLOY_DRAWER_SELECTORS = {
  // Entry point on the v6 Application edit screen (Versions tab heading action).
  openButton: '[data-testid="edge-applications-v6-edit__deploy"]',

  // Drawer shell + lifecycle regions.
  drawer: '[data-testid="deploy-drawer"]',
  loading: '[data-testid="deploy-drawer__loading"]',
  error: '[data-testid="deploy-drawer__error"]',
  retry: '[data-testid="deploy-drawer__retry"]',
  content: '[data-testid="deploy-drawer__content"]',

  // Step 1 — workload.
  workloadSelect: '[data-testid="deploy-drawer__workload-select"]',
  workloadNoBindings: '[data-testid="deploy-drawer__no-bindings"]',

  // Step 2 — environment.
  environmentSelection: '[data-testid="deploy-drawer__environment-selection"]',
  environmentEmpty: '[data-testid="deploy-drawer__environment-empty"]',
  environmentCard: (id) => `[data-testid="deploy-drawer__environment-card-${id}"]`,
  environmentRadio: (id) => `#deploy-drawer-environment-${id}`,

  // Step 3 — release composition (highlight + rest).
  composition: '[data-testid="deploy-drawer__composition"]',
  compositionHighlight: '[data-testid="deploy-drawer__composition-highlight"]',
  compositionRest: '[data-testid="deploy-drawer__composition-rest"]',
  compositionRestReadonly: '[data-testid="deploy-drawer__composition-rest-readonly"]',
  compositionKeep: (type, id) => `[data-testid="deploy-drawer__composition-keep-${type}-${id}"]`,
  versionSelect: '[data-testid="deploy-drawer__version-select"]',
  versionError: '[data-testid="deploy-drawer__version-error"]',

  // Step 4 — canary (gradual rollout).
  canary: '[data-testid="deploy-drawer__canary"]',
  canaryToggle: '[data-testid="deploy-drawer__canary-toggle"] .p-inputswitch-slider',
  canaryFields: '[data-testid="deploy-drawer__canary-fields"]',
  canaryRolloutMode: '[data-testid="deploy-drawer__canary-rollout-mode"]',
  canaryCandidatePercentage: '[data-testid="deploy-drawer__canary-candidate-percentage"]',
  canaryCookieName: '[data-testid="deploy-drawer__canary-cookie-name"]',
  canaryCookieMaxAge: '[data-testid="deploy-drawer__canary-cookie-max-age"]',

  // Footer.
  confirm: '[data-testid="deploy-drawer__confirm"]',

  // Shared PrimeVue dropdown internals (webkit Dropdown).
  dropdownLabel: '.p-dropdown-label',
  dropdownOptions: '.p-dropdown-items',
  dropdownOption: '.p-dropdown-items .p-dropdown-item'
}

export default DEPLOY_DRAWER_SELECTORS
