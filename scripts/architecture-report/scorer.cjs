/**
 * scorer.js - Calculates architecture conformance scores per module.
 *
 * Takes scanner results and produces per-module and overall conformance scores.
 * Score formula: Math.round((1 - (filesWithViolations / totalFiles)) * 100)
 * A score of 100 means zero violations; a score of 0 means every file has violations.
 */

/**
 * Counts the number of unique files that have at least one violation.
 *
 * @param {Array<{ file: string }>} violations - Array of violation objects
 * @returns {number} Number of unique files with violations
 */
function countFilesWithViolations(violations) {
  const uniqueFiles = new Set(violations.map((violation) => violation.file))
  return uniqueFiles.size
}

/**
 * Calculates the conformance score for a bucket (module, service, or legacy).
 *
 * @param {{ files: number, violations: Array, errorCount: number, warningCount: number }} bucket
 * @returns {{ score: number, filesTotal: number, filesClean: number, filesWithViolations: number, errorCount: number, warningCount: number, violationCount: number }}
 */
function scoreBucket(bucket) {
  const filesTotal = bucket.files
  const filesWithViolations = countFilesWithViolations(bucket.violations)
  const filesClean = filesTotal - filesWithViolations
  const score = filesTotal === 0 ? 100 : Math.round((1 - filesWithViolations / filesTotal) * 100)

  return {
    score,
    filesTotal,
    filesClean,
    filesWithViolations,
    errorCount: bucket.errorCount,
    warningCount: bucket.warningCount,
    violationCount: bucket.violations.length
  }
}

/**
 * Calculates conformance scores for all scanned buckets.
 *
 * @param {{
 *   modules: Record<string, { files: number, violations: Array, errorCount: number, warningCount: number }>,
 *   v2Services: Record<string, { files: number, violations: Array, errorCount: number, warningCount: number }>,
 *   legacy: { files: number, violations: Array, errorCount: number, warningCount: number }
 * }} scanResults - Output from scanner.scan()
 * @returns {{
 *   modules: Record<string, { score: number, filesTotal: number, filesClean: number, filesWithViolations: number, errorCount: number, warningCount: number, violationCount: number }>,
 *   v2Services: Record<string, { score: number, filesTotal: number, filesClean: number, filesWithViolations: number, errorCount: number, warningCount: number, violationCount: number }>,
 *   legacy: { score: number, filesTotal: number, filesClean: number, filesWithViolations: number, errorCount: number, warningCount: number, violationCount: number },
 *   overall: { score: number, filesTotal: number, filesClean: number, filesWithViolations: number, errorCount: number, warningCount: number, violationCount: number },
 *   topViolations: Array<{ ruleId: string, count: number }>
 * }}
 */
function calculateScores(scanResults) {
  // Score each module
  const modules = {}
  for (const [name, bucket] of Object.entries(scanResults.modules)) {
    modules[name] = scoreBucket(bucket)
  }

  // Score each v2 service domain
  const v2Services = {}
  for (const [name, bucket] of Object.entries(scanResults.v2Services)) {
    v2Services[name] = scoreBucket(bucket)
  }

  // Score legacy bucket
  const legacy = scoreBucket(scanResults.legacy)

  // Calculate overall score across all buckets
  const allScored = [...Object.values(modules), ...Object.values(v2Services), legacy]
  const totalFiles = allScored.reduce((sum, scored) => sum + scored.filesTotal, 0)
  const totalFilesWithViolations = allScored.reduce((sum, scored) => sum + scored.filesWithViolations, 0)
  const totalFilesClean = totalFiles - totalFilesWithViolations
  const totalErrors = allScored.reduce((sum, scored) => sum + scored.errorCount, 0)
  const totalWarnings = allScored.reduce((sum, scored) => sum + scored.warningCount, 0)
  const totalViolations = allScored.reduce((sum, scored) => sum + scored.violationCount, 0)
  const overallScore =
    totalFiles === 0 ? 100 : Math.round((1 - totalFilesWithViolations / totalFiles) * 100)

  // Aggregate top violations by rule across all buckets
  const ruleCounts = {}
  const allViolations = [
    ...Object.values(scanResults.modules).flatMap((bucket) => bucket.violations),
    ...Object.values(scanResults.v2Services).flatMap((bucket) => bucket.violations),
    ...scanResults.legacy.violations
  ]
  for (const violation of allViolations) {
    ruleCounts[violation.ruleId] = (ruleCounts[violation.ruleId] || 0) + 1
  }
  const topViolations = Object.entries(ruleCounts)
    .map(([ruleId, count]) => ({ ruleId, count }))
    .sort((entryA, entryB) => entryB.count - entryA.count)

  return {
    modules,
    v2Services,
    legacy,
    overall: {
      score: overallScore,
      filesTotal: totalFiles,
      filesClean: totalFilesClean,
      filesWithViolations: totalFilesWithViolations,
      errorCount: totalErrors,
      warningCount: totalWarnings,
      violationCount: totalViolations
    },
    topViolations
  }
}

module.exports = { calculateScores }
