/**
 * reporter.js - Formats architecture conformance results as markdown or JSON.
 *
 * Produces a human-readable markdown report with tables, status indicators,
 * and a summary section, or raw JSON for programmatic consumption.
 */

/**
 * Returns a status indicator based on the conformance score.
 *
 * @param {number} score - Conformance score (0-100)
 * @returns {string} Status emoji and label
 */
function getStatus(score) {
  if (score === 100) return '\u2705 Perfect'
  if (score >= 90) return '\u2705 Good'
  if (score >= 75) return '\u26A0\uFE0F Needs Work'
  return '\u274C Critical'
}

/**
 * Pads a string to a minimum length for table alignment.
 *
 * @param {string} str - The string to pad
 * @param {number} len - Target length
 * @returns {string} Padded string
 */
function pad(str, len) {
  return String(str).padEnd(len)
}

/**
 * Formats a single table row for the markdown report.
 *
 * @param {string} name - Module or service name
 * @param {{ score: number, filesTotal: number, filesWithViolations: number, violationCount: number, errorCount: number, warningCount: number }} scored
 * @returns {string} Markdown table row
 */
function formatRow(name, scored) {
  const status = getStatus(scored.score)
  return `| ${pad(name, 35)} | ${pad(`${scored.score}%`, 6)} | ${pad(status, 16)} | ${pad(String(scored.violationCount), 11)} | ${pad(String(scored.errorCount), 7)} | ${pad(String(scored.warningCount), 9)} | ${pad(String(scored.filesTotal), 6)} |`
}

/**
 * Generates a markdown-formatted architecture conformance report.
 *
 * @param {{
 *   modules: Record<string, object>,
 *   v2Services: Record<string, object>,
 *   legacy: object,
 *   overall: object,
 *   topViolations: Array<{ ruleId: string, count: number }>
 * }} scores - Output from scorer.calculateScores()
 * @returns {string} Markdown report
 */
function formatMarkdown(scores) {
  const lines = []
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

  lines.push('# Architecture Conformance Report')
  lines.push('')
  lines.push(`> Generated at ${now} UTC`)
  lines.push('')

  // Overall summary
  lines.push('## Summary')
  lines.push('')
  lines.push(`| Metric                | Value |`)
  lines.push(`|-----------------------|-------|`)
  lines.push(
    `| Overall Score         | **${scores.overall.score}%** ${getStatus(scores.overall.score)} |`
  )
  lines.push(`| Total Files Scanned   | ${scores.overall.filesTotal} |`)
  lines.push(`| Files Clean           | ${scores.overall.filesClean} |`)
  lines.push(`| Files With Violations | ${scores.overall.filesWithViolations} |`)
  lines.push(`| Total Violations      | ${scores.overall.violationCount} |`)
  lines.push(`| Errors                | ${scores.overall.errorCount} |`)
  lines.push(`| Warnings              | ${scores.overall.warningCount} |`)
  lines.push('')

  // Table header
  const tableHeader = `| ${pad('Name', 35)} | ${pad('Score', 6)} | ${pad('Status', 16)} | ${pad('Violations', 11)} | ${pad('Errors', 7)} | ${pad('Warnings', 9)} | ${pad('Files', 6)} |`
  const tableSeparator = `|${'-'.repeat(37)}|${'-'.repeat(8)}|${'-'.repeat(18)}|${'-'.repeat(13)}|${'-'.repeat(9)}|${'-'.repeat(11)}|${'-'.repeat(8)}|`

  // Modules section
  const moduleNames = Object.keys(scores.modules).sort()
  if (moduleNames.length > 0) {
    lines.push('## Modules (src/modules/)')
    lines.push('')
    lines.push(tableHeader)
    lines.push(tableSeparator)
    for (const name of moduleNames) {
      lines.push(formatRow(name, scores.modules[name]))
    }
    lines.push('')
  }

  // V2 Services section
  const serviceNames = Object.keys(scores.v2Services).sort()
  if (serviceNames.length > 0) {
    lines.push('## V2 Services (src/services/v2/)')
    lines.push('')
    lines.push(tableHeader)
    lines.push(tableSeparator)
    for (const name of serviceNames) {
      lines.push(formatRow(name, scores.v2Services[name]))
    }
    lines.push('')
  }

  // Legacy section
  if (scores.legacy.filesTotal > 0) {
    lines.push('## Legacy Code (src/views/, src/stores/, src/components/, src/composables/)')
    lines.push('')
    lines.push(tableHeader)
    lines.push(tableSeparator)
    lines.push(formatRow('legacy (all)', scores.legacy))
    lines.push('')
  }

  // Top violations section
  if (scores.topViolations.length > 0) {
    lines.push('## Top Violations by Rule')
    lines.push('')
    lines.push(`| ${pad('Rule', 55)} | ${pad('Count', 7)} |`)
    lines.push(`|${'-'.repeat(57)}|${'-'.repeat(9)}|`)
    for (const { ruleId, count } of scores.topViolations) {
      lines.push(`| ${pad(ruleId, 55)} | ${pad(String(count), 7)} |`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Formats scores as a JSON string.
 *
 * @param {object} scores - Output from scorer.calculateScores()
 * @returns {string} Pretty-printed JSON
 */
function formatJson(scores) {
  return JSON.stringify(scores, null, 2)
}

/**
 * Formats the conformance report in the requested format.
 *
 * @param {object} scores - Output from scorer.calculateScores()
 * @param {'markdown'|'json'} format - Output format
 * @returns {string} Formatted report
 */
function format(scores, format) {
  if (format === 'json') {
    return formatJson(scores)
  }
  return formatMarkdown(scores)
}

module.exports = { format }
