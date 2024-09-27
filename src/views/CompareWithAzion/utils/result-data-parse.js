import { formatBytes } from './format-bytes'

export const gradeTranslate = (score) => {
  let letter = ''

  if (!score) return letter

  if (score >= 90) {
    letter = 'A'
  } else if (score >= 80 && score <= 89) {
    letter = 'B'
  } else if (score >= 70 && score <= 79) {
    letter = 'C'
  } else if (score >= 60 && score <= 69) {
    letter = 'D'
  } else if (score >= 0 && score <= 59) {
    letter = 'F'
  }

  return letter
}

export const resultparse = {
  cdn: (test) => {
    return test.data.median.firstView.base_page_cdn || ''
  },

  possibleSave: (test) => {
    const possible = test.data.median.firstView.image_savings || 0
    const total = test.data.median.firstView.image_total || 0

    return `${formatBytes(possible)} of ${formatBytes(total)}`
  },

  percentilImageSave: (test) => {
    const possible = test.data.median.firstView.image_savings || 0
    const total = test.data.median.firstView.image_total || 0

    return Number(((100 * possible) / total).toFixed(2))
  },

  grade: (test) => {
    const grade = {}
    const secHeaders = test.data.median.firstView.securityHeaders

    grade.security =
      secHeaders && secHeaders.securityHeadersGrade ? secHeaders.securityHeadersGrade : ''
    grade.ttfb = `${test.data.median.firstView.TTFB}ms`
    grade['score_keep-alive'] = gradeTranslate(test.data.median.firstView['score_keep-alive'])
    grade.score_gzip = gradeTranslate(test.data.median.firstView.score_gzip)
    grade.score_compress = gradeTranslate(test.data.median.firstView.score_compress)
    grade.score_progressive_jpeg = gradeTranslate(test.data.median.firstView.score_progressive_jpeg)
    grade.score_cache = gradeTranslate(test.data.median.firstView.score_cache)
    grade.cdn = gradeTranslate(test.data.median.firstView.score_cdn)

    return grade
  }
}
