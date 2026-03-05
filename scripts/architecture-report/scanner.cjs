/**
 * scanner.js - Scans the codebase for architecture violations using ESLint Node.js API.
 *
 * Runs ESLint programmatically against target directories and filters results
 * to only include azion-architecture/* rule violations. Groups violations by
 * module name, v2 service domain, or legacy bucket.
 */
const { ESLint } = require('eslint')
const path = require('path')

const PROJECT_ROOT = path.resolve(__dirname, '..', '..')

/** Target directories to scan for architecture violations */
const TARGET_PATTERNS = [
  'src/modules/**/*.{js,ts,vue}',
  'src/services/v2/**/*.{js,ts,vue}',
  'src/views/**/*.{js,ts,vue}',
  'src/stores/**/*.{js,ts,vue}',
  'src/components/**/*.{js,ts,vue}',
  'src/composables/**/*.{js,ts,vue}'
]

/** Prefix used to identify architecture-specific ESLint rules */
const RULE_PREFIX = 'azion-architecture/'

/**
 * Extracts the module name from a file path inside src/modules/.
 * e.g. "src/modules/azion-ai-chat/components/Foo.vue" => "azion-ai-chat"
 *
 * @param {string} filePath - Absolute or relative file path
 * @returns {string|null} The module name, or null if the file is not in src/modules/
 */
function getModuleName(filePath) {
  const relative = path.relative(PROJECT_ROOT, filePath)
  const match = relative.match(/^src\/modules\/([^/]+)/)
  return match ? match[1] : null
}

/**
 * Extracts the service domain name from a file path inside src/services/v2/.
 * e.g. "src/services/v2/marketplace/marketplace-service.ts" => "marketplace"
 *
 * @param {string} filePath - Absolute or relative file path
 * @returns {string|null} The service domain name, or null if the file is not in src/services/v2/
 */
function getV2ServiceDomain(filePath) {
  const relative = path.relative(PROJECT_ROOT, filePath)
  const match = relative.match(/^src\/services\/v2\/([^/]+)/)
  return match ? match[1] : null
}

/**
 * Determines which bucket a file belongs to: module, v2Service, or legacy.
 *
 * @param {string} filePath - Absolute file path
 * @returns {{ type: 'module'|'v2Service'|'legacy', name: string|null }}
 */
function classifyFile(filePath) {
  const moduleName = getModuleName(filePath)
  if (moduleName) {
    return { type: 'module', name: moduleName }
  }

  const serviceDomain = getV2ServiceDomain(filePath)
  if (serviceDomain) {
    return { type: 'v2Service', name: serviceDomain }
  }

  return { type: 'legacy', name: null }
}

/**
 * Filters ESLint messages to only include azion-architecture/* rule violations.
 *
 * @param {import('eslint').Linter.LintMessage[]} messages - ESLint lint messages
 * @returns {import('eslint').Linter.LintMessage[]} Filtered messages
 */
function filterArchitectureViolations(messages) {
  return messages.filter((msg) => msg.ruleId && msg.ruleId.startsWith(RULE_PREFIX))
}

/**
 * Creates an empty bucket structure for grouping violations.
 *
 * @returns {{ files: number, violations: Array, errorCount: number, warningCount: number }}
 */
function createBucket() {
  return {
    files: 0,
    violations: [],
    errorCount: 0,
    warningCount: 0
  }
}

/**
 * Adds violations from an ESLint result to a bucket.
 *
 * @param {object} bucket - Target bucket
 * @param {import('eslint').ESLint.LintResult} result - ESLint result
 * @param {import('eslint').Linter.LintMessage[]} archViolations - Filtered architecture violations
 */
function addViolationsToBucket(bucket, result, archViolations) {
  bucket.files += 1
  for (const violation of archViolations) {
    bucket.violations.push({
      file: path.relative(PROJECT_ROOT, result.filePath),
      ruleId: violation.ruleId,
      message: violation.message,
      severity: violation.severity,
      line: violation.line,
      column: violation.column
    })
    if (violation.severity === 2) {
      bucket.errorCount += 1
    } else {
      bucket.warningCount += 1
    }
  }
}

/**
 * Scans the codebase for architecture violations using ESLint.
 *
 * Uses ESLint's Node.js API to lint files matching the target patterns,
 * filters results to only include azion-architecture/* rule violations,
 * and groups them by module, v2 service domain, or legacy bucket.
 *
 * @returns {Promise<{
 *   modules: Record<string, { files: number, violations: Array, errorCount: number, warningCount: number }>,
 *   v2Services: Record<string, { files: number, violations: Array, errorCount: number, warningCount: number }>,
 *   legacy: { files: number, violations: Array, errorCount: number, warningCount: number }
 * }>}
 */
async function scan() {
  const eslint = new ESLint({
    cwd: PROJECT_ROOT,
    // Use the project's .eslintrc.cjs configuration
    useEslintrc: true
  })

  const results = await eslint.lintFiles(TARGET_PATTERNS)

  const modules = {}
  const v2Services = {}
  const legacy = createBucket()

  for (const result of results) {
    const archViolations = filterArchitectureViolations(result.messages)
    const { type, name } = classifyFile(result.filePath)

    if (type === 'module') {
      if (!modules[name]) modules[name] = createBucket()
      addViolationsToBucket(modules[name], result, archViolations)
    } else if (type === 'v2Service') {
      if (!v2Services[name]) v2Services[name] = createBucket()
      addViolationsToBucket(v2Services[name], result, archViolations)
    } else {
      addViolationsToBucket(legacy, result, archViolations)
    }
  }

  return { modules, v2Services, legacy }
}

module.exports = { scan }
