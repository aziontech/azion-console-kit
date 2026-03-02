const noDirectHttpInComponents = require('./lib/rules/no-direct-http-in-components')
const noHttpInStores = require('./lib/rules/no-http-in-stores')
const requireVueQuery = require('./lib/rules/require-vue-query')
const noTryCatchInServices = require('./lib/rules/no-try-catch-in-services')
const servicesHttpOnly = require('./lib/rules/services-http-only')
const pureAdapters = require('./lib/rules/pure-adapters')
const noHttpInAdapters = require('./lib/rules/no-http-in-adapters')
const moduleIsolation = require('./lib/rules/module-isolation')
const namingConvention = require('./lib/rules/naming-convention')
const typeSeparation = require('./lib/rules/type-separation')
const recommended = require('./lib/configs/recommended')

module.exports = {
  rules: {
    'no-direct-http-in-components': noDirectHttpInComponents,
    'no-http-in-stores': noHttpInStores,
    'require-vue-query': requireVueQuery,
    'no-try-catch-in-services': noTryCatchInServices,
    'services-http-only': servicesHttpOnly,
    'pure-adapters': pureAdapters,
    'no-http-in-adapters': noHttpInAdapters,
    'module-isolation': moduleIsolation,
    'naming-convention': namingConvention,
    'type-separation': typeSeparation
  },
  configs: {
    recommended
  }
}
