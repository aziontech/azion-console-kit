// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve as pathResolve, dirname } from 'node:path'

const ROOT = pathResolve(dirname(fileURLToPath(import.meta.url)), '../../../../')

const resolve = (relative) => pathResolve(ROOT, relative)

const DEPLOYMENTS_VIEWS_DIR = 'src/views/Deployments'
const DEPLOYMENT_ROUTES_FILE = 'src/router/routes/deployment-routes/index.js'

const FORBIDDEN_COMPONENTS = [
  'VersionsTab',
  'VersionEditView',
  'DeploymentVersionEditor',
  'DeploymentVersionAdapter'
]

const SOURCE_EXTENSIONS = ['.vue', '.js', '.ts']

const listSourceFiles = (relativeDir) => {
  const dir = resolve(relativeDir)
  if (!existsSync(dir)) return []

  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile())
    .filter((entry) => SOURCE_EXTENSIONS.some((ext) => entry.name.endsWith(ext)))
    .map((entry) => {
      const base = entry.parentPath ?? entry.path
      return `${base}/${entry.name}`
    })
    .sort()
}

const extractImportStatements = (content) => {
  const statics = content.match(/import\s+[^;]*?\s+from\s+['"][^'"]+['"]/gs) ?? []
  const dynamics = content.match(/import\s*\(\s*['"][^'"]+['"]\s*\)/gs) ?? []
  return [...statics, ...dynamics]
}

const importsForbiddenComponent = (content, component) => {
  const boundary = new RegExp(`\\b${component}\\b`)
  return extractImportStatements(content).some((statement) => boundary.test(statement))
}

describe('P5 — legacy deployment version editor is removed from the UI', () => {
  const files = listSourceFiles(DEPLOYMENTS_VIEWS_DIR)

  it('scans at least the deployment views tree', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(FORBIDDEN_COMPONENTS)('no file under src/views/Deployments imports "%s"', (component) => {
    const offenders = files
      .filter((file) => importsForbiddenComponent(readFileSync(file, 'utf8'), component))
      .map((file) => file.slice(resolve(DEPLOYMENTS_VIEWS_DIR).length + 1))

    expect(offenders, `Files still importing "${component}":\n${offenders.join('\n')}`).toEqual([])
  })

  it('deployment-routes no longer declares an edit-deployment-version route', () => {
    const source = readFileSync(resolve(DEPLOYMENT_ROUTES_FILE), 'utf8')

    expect(source).not.toContain('edit-deployment-version')
  })
})
