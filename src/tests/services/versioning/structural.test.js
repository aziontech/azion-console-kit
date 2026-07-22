import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, relative, sep } from 'node:path'
import { createRequire } from 'node:module'
import { parse } from '@babel/parser'
import {
  isComposableImport,
  isStoreImport,
  isDomImport,
  isTypeOnlyImport
} from '../../../../eslint/plugin/lib/utils/import-resolver.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const V2_ROOT = resolve(__dirname, '../../../services/v2')

const P1_PENDING_BASE = {}
const P2_KNOWN_EXCEPTIONS = {
  'deployment/deployment-version-adapter.js': 'design §3.14 (bespoke normalization)'
}

const toKey = (absPath) => relative(V2_ROOT, absPath).split(sep).join('/')

const listFiles = (suffix) => {
  const out = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = resolve(dir, entry.name)
      if (entry.isDirectory()) walk(abs)
      else if (entry.isFile() && entry.name.endsWith(suffix)) out.push(abs)
    }
  }
  walk(V2_ROOT)
  return out.sort()
}

const parseModule = (code) => parse(code, { sourceType: 'module', plugins: ['classProperties'] })

const importSourcesOf = (code) =>
  parseModule(code)
    .program.body.filter((node) => node.type === 'ImportDeclaration')
    .map((node) => node.source.value)

const superclassOf = (code) => {
  const ast = parseModule(code)
  for (const node of ast.program.body) {
    const decl = node.type === 'ExportNamedDeclaration' ? node.declaration : node
    if (decl?.type === 'ClassDeclaration' && decl.superClass) {
      return decl.superClass.name ?? null
    }
  }
  return null
}

const serviceFiles = listFiles('-version-service.js')
const adapterFiles = listFiles('-version-adapter.js')

const versionedSubResourceServiceFiles = listFiles('-service.js').filter(
  (file) =>
    file.includes(`${sep}versioned${sep}`) &&
    !file.endsWith('create-versioned-sub-resource-service.js')
)

const httpOnlyServiceFiles = [...serviceFiles, ...versionedSubResourceServiceFiles].sort()

const REQUIRED_VERSION_SERVICES = [
  'network-lists/network-list-version-service.js',
  'waf/waf-version-service.js'
]
const REQUIRED_VERSION_ADAPTERS = [
  'network-lists/network-list-version-adapter.js',
  'waf/waf-version-adapter.js'
]
const REQUIRED_VERSIONED_SUB_RESOURCE_SERVICES = [
  'waf/versioned/versioned-waf-exceptions-service.js'
]

describe('versioning structural properties', () => {
  it('finds every version service and adapter module', () => {
    expect(serviceFiles.length).toBeGreaterThan(0)
    expect(adapterFiles.length).toBeGreaterThan(0)
  })

  it('enumerates the network-list and waf version services + adapters', () => {
    const serviceKeys = serviceFiles.map(toKey)
    const adapterKeys = adapterFiles.map(toKey)
    const subResourceKeys = versionedSubResourceServiceFiles.map(toKey)
    for (const key of REQUIRED_VERSION_SERVICES) {
      expect(serviceKeys, `${key} must be discovered by the P1/P3 enumeration`).toContain(key)
    }
    for (const key of REQUIRED_VERSION_ADAPTERS) {
      expect(adapterKeys, `${key} must be discovered by the P2 enumeration`).toContain(key)
    }
    for (const key of REQUIRED_VERSIONED_SUB_RESOURCE_SERVICES) {
      expect(subResourceKeys, `${key} must be discovered by the P3 enumeration`).toContain(key)
    }
  })

  describe('P1 — version services extend VersionServiceBase', () => {
    it.each(serviceFiles.map((file) => [toKey(file), file]))(
      '%s extends VersionServiceBase (or is documented pending drift)',
      (key, file) => {
        const superclass = superclassOf(readFileSync(file, 'utf-8'))
        if (P1_PENDING_BASE[key]) {
          expect(
            superclass,
            `${key}: remove from P1_PENDING_BASE once ${P1_PENDING_BASE[key]} lands`
          ).not.toBe('VersionServiceBase')
          return
        }
        expect(superclass, `${key} must extend VersionServiceBase`).toBe('VersionServiceBase')
      }
    )

    it('no version service extends BaseService directly (outside the documented allow-list)', () => {
      const offenders = serviceFiles
        .map((file) => ({
          key: toKey(file),
          superclass: superclassOf(readFileSync(file, 'utf-8'))
        }))
        .filter(({ key, superclass }) => superclass === 'BaseService' && !P1_PENDING_BASE[key])
        .map(({ key }) => key)
      expect(offenders).toEqual([])
    })
  })

  describe('P2 — version adapters reuse createVersionAdapter', () => {
    const definesLocalStripUndefinedDeep = (code) =>
      /\b(const|let|var|function)\s+stripUndefinedDeep\b/.test(code)
    const handRollsNormalizeVersion = (code) =>
      /\b(const|let|var|function)\s+normalizeVersion\b/.test(code)
    const usesFactory = (code) => /\bcreateVersionAdapter\s*\(/.test(code)

    it.each(adapterFiles.map((file) => [toKey(file), file]))(
      '%s does not duplicate stripUndefinedDeep / normalizeVersion',
      (key, file) => {
        if (P2_KNOWN_EXCEPTIONS[key]) return
        const code = readFileSync(file, 'utf-8')
        expect(
          definesLocalStripUndefinedDeep(code),
          `${key} must import stripUndefinedDeep, not redefine it`
        ).toBe(false)
        expect(
          handRollsNormalizeVersion(code),
          `${key} must use createVersionAdapter, not hand-roll normalizeVersion`
        ).toBe(false)
        expect(usesFactory(code), `${key} must be built via createVersionAdapter`).toBe(true)
      }
    )

    it('documented exceptions still exist (drop the entry once the file is migrated)', () => {
      for (const key of Object.keys(P2_KNOWN_EXCEPTIONS)) {
        const match = adapterFiles.find((file) => toKey(file) === key)
        expect(match, `stale P2 exception: ${key} no longer exists`).toBeTruthy()
      }
    })
  })

  describe('P3 — services-http-only covers version services', () => {
    const requireCjs = createRequire(import.meta.url)
    const archConfig = requireCjs('../../../../.eslintrc-architecture.cjs')
    const v2Override = archConfig.overrides.find((entry) =>
      (entry.files ?? []).includes('src/services/v2/**/*')
    )

    it('the eslint override targets src/services/v2/** with services-http-only enabled', () => {
      expect(v2Override, 'missing src/services/v2/** override').toBeTruthy()
      expect(v2Override.rules['azion-architecture/services-http-only']).toBeDefined()
      expect(v2Override.rules['azion-architecture/services-http-only']).not.toBe('off')
    })

    it('every version service lives under the covered glob path', () => {
      for (const file of httpOnlyServiceFiles) {
        const rel = relative(resolve(__dirname, '../../../..'), file).split(sep).join('/')
        expect(rel.startsWith('src/services/v2/'), `${rel} is outside the lint glob`).toBe(true)
      }
    })

    it.each(httpOnlyServiceFiles.map((file) => [toKey(file), file]))(
      '%s imports no composables/stores/DOM',
      (key, file) => {
        const sources = importSourcesOf(readFileSync(file, 'utf-8')).filter(
          (source) => !isTypeOnlyImport(source)
        )
        expect(sources.filter(isComposableImport)).toEqual([])
        expect(sources.filter(isStoreImport)).toEqual([])
        expect(sources.filter(isDomImport)).toEqual([])
      }
    )
  })
})
