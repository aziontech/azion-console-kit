const noDirectHttpInComponents = require('./lib/rules/no-direct-http-in-components')
const noHttpInStores = require('./lib/rules/no-http-in-stores')
const requireVueQuery = require('./lib/rules/require-vue-query')
const requireV2ServiceBaseClass = require('./lib/rules/require-v2-service-base-class')
const noTryCatchInServices = require('./lib/rules/no-try-catch-in-services')
const servicesHttpOnly = require('./lib/rules/services-http-only')
const pureAdapters = require('./lib/rules/pure-adapters')
const moduleIsolation = require('./lib/rules/module-isolation')
const namingConvention = require('./lib/rules/naming-convention')
const typeSeparation = require('./lib/rules/type-separation')
const noRawDesignValues = require('./lib/rules/no-raw-design-values')
const noIoInComponents = require('./lib/rules/no-io-in-components')
const noUnawaitedClipboard = require('./lib/rules/no-unawaited-clipboard')
const noVersioningModuleMock = require('./lib/rules/no-versioning-module-mock')
const noInternalStateAssert = require('./lib/rules/no-internal-state-assert')
const noEnvironmentCapabilityMock = require('./lib/rules/no-environment-capability-mock')
const recommended = require('./lib/configs/recommended')

module.exports = {
  rules: {
    'no-direct-http-in-components': noDirectHttpInComponents,
    'no-http-in-stores': noHttpInStores,
    'require-vue-query': requireVueQuery,
    'require-v2-service-base-class': requireV2ServiceBaseClass,
    'no-try-catch-in-services': noTryCatchInServices,
    'services-http-only': servicesHttpOnly,
    'pure-adapters': pureAdapters,
    'module-isolation': moduleIsolation,
    'naming-convention': namingConvention,
    'type-separation': typeSeparation,
    'no-raw-design-values': noRawDesignValues,
    'no-io-in-components': noIoInComponents,
    'no-unawaited-clipboard': noUnawaitedClipboard,
    'no-versioning-module-mock': noVersioningModuleMock,
    'no-internal-state-assert': noInternalStateAssert,
    'no-environment-capability-mock': noEnvironmentCapabilityMock
  },
  configs: {
    recommended
  }
}
