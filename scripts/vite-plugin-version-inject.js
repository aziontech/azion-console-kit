export default function versionInjectPlugin() {
  return {
    name: 'version-inject',
    transformIndexHtml(html) {
      const version = process.env.npm_package_version || '0.0.0'
      const buildTime = new Date().toISOString()
      const gitCommit = process.env.GITHUB_SHA || 'unknown'

      return html
        .replace(
          /<meta name="app-version" content="" \/>/,
          `<meta name="app-version" content="${version}" />`
        )
        .replace(
          /<meta name="build-time" content="" \/>/,
          `<meta name="build-time" content="${buildTime}" />`
        )
        .replace(
          /<meta name="git-commit" content="" \/>/,
          `<meta name="git-commit" content="${gitCommit}" />`
        )
    }
  }
}
