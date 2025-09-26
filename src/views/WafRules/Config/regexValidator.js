// validators/pathRegexSchema.js
import * as yup from 'yup'

// Default config (focused on WAF paths)
const DEFAULTS = {
  min: 1,
  max: 500,
  requireAnchors: true, // require ^ ... $
  forbidGlobalFlag: true, // avoid stateful .test() with /g
  forbidNullByte: true, // block real \x00
  engine: 'ecmascript' // "ecmascript" | "pcre-like" (warning only)
}

// Detect literal /pattern/flags
const REGEX_LITERAL_PARSER = /^\/([\s\S]+)\/([a-z]*)$/i

// Simple heuristics against ReDoS/catastrophic backtracking
const REDOS_HEURISTICS = [
  {
    re: /\(\.\*\??\)\+|\(\.\+\??\)\+/,
    message: 'Avoid nested quantifiers over wildcards: (.*)+, (.+)+, etc.'
  },
  {
    re: /\(\.\*\??\)\{\d+,?\}|\(\.\+\??\)\{\d+,?\}/,
    message: 'Avoid repeating groups with wildcards: (.*){2,}, (.+){3,}, etc.'
  },
  {
    re: /\[[^\]]*\][+*?]{2,}/,
    message: 'Stacked quantifiers on character classes are not allowed.'
  },
  { re: /\([^)]*\|[^)]*\)[+*]\+/, message: 'Avoid nested quantifiers over alternation: (a|b)*+.' },
  {
    re: /\((?:[^()|]+(?:\|[^()|]+)+)\)\+/,
    message: 'Repeated alternations (e.g., (a|aa)+) may cause excessive backtracking.'
  }
]

// PCRE features not supported in JS (compatibility warnings)
const PCRE_ONLY = [
  { re: /\(\?>/, message: 'Atomic groups (?>...) are PCRE and do not exist in JS.' },
  { re: /\\K/, message: '\\K is PCRE-specific and does not exist in JS.' },
  {
    re: /\(\*(?:SKIP|PRUNE|THEN|COMMIT|FAIL)\)/,
    message: 'Backtracking verbs (*SKIP|*PRUNE|*THEN|*COMMIT|*FAIL) are PCRE.'
  },
  { re: /\(\?(?:R|\d+)\)/, message: 'Recursion/subroutines (?R), (?1) are PCRE.' },
  { re: /\\[RC]/, message: '\\R/\\C are PCRE escapes, do not exist in JS.' },
  { re: /\(\?P<[^>]+>/, message: 'Named group (?P<name>) is PCRE/Python; in JS use (?<name>...).' }
]

// Modern JS flags that don't exist in PCRE (warning only if engine "pcre-like")
const JS_ONLY_FLAGS = /[vd]/i // v = set notation; d = match indices

function parseRegexInput(input) {
  const match = input.match(REGEX_LITERAL_PARSER)
  if (match) return { pattern: match[1], flags: match[2] || '' }
  return { pattern: input, flags: '' }
}

function normalizeFlags(flags, forbidGlobal) {
  const set = new Set(flags.split(''))
  if (forbidGlobal) set.delete('g')
  return Array.from(set).sort().join('')
}

// Detect real null byte (literal \x00 or \u0000 without double escape) or NUL character
function hasNullByteEscape(pattern) {
  // Without lookbehind: (^|[^\\])\x00escape
  if (/(^|[^\\])\\x00/.test(pattern)) return true // eslint-disable-line no-control-regex
  if (/(^|[^\\])\\u0000/.test(pattern)) return true
  if (pattern.includes('\u0000')) return true // literal NUL character
  return false
}

function looksLikePath(pattern) {
  return /^(\^\s*)?\/.*/.test(pattern) // starts with "/" or "^/"
}

function checkAnchorsIfRequired(pattern, requireAnchors) {
  if (!requireAnchors) return null
  if (!pattern.startsWith('^')) return 'Consider anchoring the start with ^ (e.g., ^/my/route).'
  if (!pattern.endsWith('$')) return 'Consider anchoring the end with $ (e.g., ^/my/route$).'
  return null
}

function detectOverlyBroad(pattern) {
  if (pattern === '.*') return 'Pattern ".*" is too broad and matches everything.'
  if (/^\^\/\.\+\$/.test(pattern))
    return 'Pattern too permissive (^/.+$). Restrict the path better.'
  return null
}

function detectRedos(pattern) {
  for (const heuristic of REDOS_HEURISTICS) {
    if (heuristic.re.test(pattern)) return `Potential ReDoS: ${heuristic.message}`
  }
  return null
}

function detectPcreIncompat(pattern, flags, engine) {
  if (engine !== 'ecmascript') return null
  for (const rule of PCRE_ONLY) {
    if (rule.re.test(pattern)) return `Compatibility: ${rule.message}`
  }
  return null
}

function detectJsOnlyFlagsForPcre(flags, engine) {
  if (engine !== 'pcre-like') return null
  if (JS_ONLY_FLAGS.test(flags)) return 'JS flags (v/d) do not exist in PCRE (NGINX/Naxsi).'
  return null
}

function compileRegex(pattern, flags) {
  try {
    // use normalized flags to avoid /g
    // if it fails, return the JS engine error message
    // (useful for user to adjust syntax)
    // eslint-disable-next-line no-new
    new RegExp(pattern, flags)
    return null
  } catch (error) {
    return `Invalid syntax: ${error?.message || 'error compiling regex'}`
  }
}

/**
 * Analyzes/validates a regex input focused on paths.
 * Returns the first error message found (string) or null.
 */
export function validateRegexForPath(input, opts = {}) {
  const cfg = { ...DEFAULTS, ...opts }
  const { pattern: rawPattern, flags: rawFlags } = parseRegexInput(String(input))

  if (rawPattern.length < cfg.min) return `Pattern must have at least ${cfg.min} character(s).`
  if (rawPattern.length > cfg.max) return `Pattern exceeds ${cfg.max} characters.`

  const flags = normalizeFlags(rawFlags, cfg.forbidGlobalFlag)
  if (cfg.forbidGlobalFlag && /g/.test(rawFlags)) {
    return 'The "g" flag is unnecessary in this context and may cause inconsistent validation.'
  }

  if (cfg.forbidNullByte && hasNullByteEscape(rawPattern)) {
    return 'Use of null byte (\\x00/\\u0000) blocked for security in paths.'
  }

  if (!looksLikePath(rawPattern)) {
    return 'Pattern must start with "/" (e.g., ^/my/route$).'
  }

  const anchorIssue = checkAnchorsIfRequired(rawPattern, cfg.requireAnchors)
  if (anchorIssue) return anchorIssue

  const broad = detectOverlyBroad(rawPattern)
  if (broad) return broad

  const redos = detectRedos(rawPattern)
  if (redos) return redos

  const pcreCompat = detectPcreIncompat(rawPattern, flags, cfg.engine)
  if (pcreCompat) return pcreCompat

  const pcreFlagsWarn = detectJsOnlyFlagsForPcre(flags, cfg.engine)
  if (pcreFlagsWarn) return pcreFlagsWarn

  const compileErr = compileRegex(rawPattern, flags)
  if (compileErr) return compileErr

  return null
}

/**
 * Creates a Yup schema ready for vee-validate.
 * Error messages come from validateRegexForPath().
 */
export function makePathRegexSchema(options = {}) {
  return yup
    .string()
    .required('Enter an expression to allow the path.')
    .test('is-valid-path-regex', 'Invalid expression.', function (value) {
      if (!value) return false
      const error = validateRegexForPath(value, options)
      if (error) return this.createError({ message: error })
      return true
    })
}

export const pathRegexSchema = makePathRegexSchema()
// If you need to validate "PCRE-like mode" (compatibility warnings only):
// export const pathRegexSchema = makePathRegexSchema({ engine: 'pcre-like' })
