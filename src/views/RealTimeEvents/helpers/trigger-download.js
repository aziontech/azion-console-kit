/**
 * Triggers a browser file download by creating a temporary anchor element.
 *
 * @param {Object} options
 * @param {string} options.url      – Object URL (from URL.createObjectURL) to download
 * @param {string} options.filename – Suggested filename for the download
 */
export function triggerBlobDownload({ url, filename }) {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
