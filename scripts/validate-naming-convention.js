#!/usr/bin/env node

/**
 * Script de validação de convenção de nomenclatura
 * Garante que arquivos e pastas seguem o padrão kebab-case
 *
 * Uso:
 *   node scripts/validate-naming-convention.js           # Valida todos os arquivos
 *   node scripts/validate-naming-convention.js --staged  # Valida apenas arquivos staged (para commit)
 *   node scripts/validate-naming-convention.js --fix     # Mostra sugestões de correção
 *
 * Integração:
 *   - Pre-commit hook (husky) com --staged
 *   - CI/CD pipeline sem flags
 *   - npm script
 */

import { readdir, stat } from 'fs/promises'
import { join, basename, extname, dirname } from 'path'
import { execSync } from 'child_process'

// Configuração
const CONFIG = {
  // Diretórios para validar (quando não usa --staged)
  includePaths: ['src/services', 'src/views', 'src/components', 'src/composables', 'src/helpers'],

  // Padrões para ignorar
  ignorePaths: [
    'node_modules',
    '.git',
    'dist',
    'coverage',
    '__snapshots__',
    '.husky'
  ],

  // Arquivos para ignorar (regex)
  ignoreFiles: [
    /^\./, // Arquivos ocultos (.gitignore, .env, etc)
    /^index\.js$/, // index.js é permitido
    /^index\.ts$/, // index.ts é permitido
    /\.test\.js$/, // Arquivos de teste
    /\.spec\.js$/, // Arquivos de spec
    /\.cy\.js$/, // Arquivos Cypress
    /\.d\.ts$/, // Type definitions
    /^README\.md$/i, // README
    /^CHANGELOG\.md$/i, // CHANGELOG
    /\.md$/, // Arquivos markdown
    /\.json$/, // Arquivos JSON
    /\.yaml$/, // Arquivos YAML
    /\.yml$/, // Arquivos YAML
    /\.config\./, // Arquivos de config (vite.config.js, etc)
  ],

  // Pastas que podem ter nomes diferentes (exceções)
  allowedFolderNames: ['__tests__', '__mocks__', 'v2', 'v3', 'V3']
}

// Regex para validar kebab-case
const KEBAB_CASE_REGEX = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/

/**
 * Verifica se um nome segue kebab-case
 * @param {string} name - Nome do arquivo ou pasta
 * @returns {boolean}
 */
function isKebabCase(name) {
  return KEBAB_CASE_REGEX.test(name)
}

/**
 * Converte um nome para kebab-case
 * @param {string} name - Nome original
 * @returns {string}
 */
function toKebabCase(name) {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
}

/**
 * Verifica se o arquivo/pasta deve ser ignorado
 * @param {string} name - Nome do arquivo ou pasta
 * @param {boolean} isDirectory - Se é diretório
 * @returns {boolean}
 */
function shouldIgnore(name, isDirectory) {
  if (isDirectory && CONFIG.allowedFolderNames.includes(name)) {
    return true
  }

  if (!isDirectory) {
    for (const pattern of CONFIG.ignoreFiles) {
      if (pattern.test(name)) {
        return true
      }
    }
  }

  return false
}

/**
 * Valida um arquivo ou pasta
 * @param {string} fullPath - Caminho completo
 * @param {string} name - Nome do arquivo/pasta
 * @param {boolean} isDirectory - Se é diretório
 * @returns {{ valid: boolean, suggestion?: string }}
 */
function validateName(fullPath, name, isDirectory) {
  const nameWithoutExt = isDirectory ? name : basename(name, extname(name))

  if (shouldIgnore(name, isDirectory)) {
    return { valid: true }
  }

  if (isKebabCase(nameWithoutExt)) {
    return { valid: true }
  }

  return {
    valid: false,
    suggestion: toKebabCase(nameWithoutExt) + (isDirectory ? '' : extname(name))
  }
}

/**
 * Obtém arquivos staged no git
 * @returns {string[]}
 */
function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACR', {
      encoding: 'utf-8'
    })
    return output
      .split('\n')
      .filter((file) => file.trim() !== '')
      .filter((file) => {
        // Filtrar apenas arquivos nos paths incluídos
        return CONFIG.includePaths.some((p) => file.startsWith(p))
      })
  } catch {
    return []
  }
}

/**
 * Valida arquivos staged
 * @returns {Array}
 */
function validateStagedFiles() {
  const stagedFiles = getStagedFiles()
  const errors = []

  for (const filePath of stagedFiles) {
    const fileName = basename(filePath)
    const dirPath = dirname(filePath)
    const dirParts = dirPath.split('/')

    // Validar nome do arquivo
    const fileResult = validateName(filePath, fileName, false)
    if (!fileResult.valid) {
      errors.push({
        path: filePath,
        name: fileName,
        suggestion: fileResult.suggestion,
        type: 'file'
      })
    }

    // Validar pastas no caminho (apenas novas pastas)
    for (const part of dirParts) {
      if (CONFIG.ignorePaths.includes(part)) continue
      if (CONFIG.allowedFolderNames.includes(part)) continue

      const folderResult = validateName(part, part, true)
      if (!folderResult.valid) {
        // Verificar se essa pasta já foi reportada
        const alreadyReported = errors.some(
          (e) => e.type === 'folder' && e.name === part
        )
        if (!alreadyReported) {
          errors.push({
            path: dirPath,
            name: part,
            suggestion: folderResult.suggestion,
            type: 'folder'
          })
        }
      }
    }
  }

  return errors
}

/**
 * Percorre diretório recursivamente
 * @param {string} dir - Diretório para percorrer
 * @param {Array} errors - Array para acumular erros
 */
async function walkDirectory(dir, errors) {
  try {
    const entries = await readdir(dir)

    for (const entry of entries) {
      const fullPath = join(dir, entry)

      if (CONFIG.ignorePaths.some((p) => fullPath.includes(p))) {
        continue
      }

      const stats = await stat(fullPath)
      const isDirectory = stats.isDirectory()

      const result = validateName(fullPath, entry, isDirectory)

      if (!result.valid) {
        errors.push({
          path: fullPath,
          name: entry,
          suggestion: result.suggestion,
          type: isDirectory ? 'folder' : 'file'
        })
      }

      if (isDirectory) {
        await walkDirectory(fullPath, errors)
      }
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Error reading ${dir}:`, err.message)
    }
  }
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2)
  const showFix = args.includes('--fix')
  const stagedOnly = args.includes('--staged')

  let errors = []

  if (stagedOnly) {
    console.log('\n🔍 Validando arquivos staged (kebab-case)...\n')
    errors = validateStagedFiles()

    if (errors.length === 0) {
      const stagedFiles = getStagedFiles()
      if (stagedFiles.length === 0) {
        console.log('ℹ️  Nenhum arquivo staged nos diretórios monitorados.\n')
      } else {
        console.log(`✅ ${stagedFiles.length} arquivo(s) staged seguem o padrão kebab-case!\n`)
      }
      process.exit(0)
    }
  } else {
    console.log('\n🔍 Validando convenção de nomenclatura (kebab-case)...\n')

    for (const includePath of CONFIG.includePaths) {
      await walkDirectory(includePath, errors)
    }

    if (errors.length === 0) {
      console.log('✅ Todos os arquivos e pastas seguem o padrão kebab-case!\n')
      process.exit(0)
    }
  }

  console.log(`❌ Encontrados ${errors.length} arquivo(s)/pasta(s) fora do padrão:\n`)

  const folders = errors.filter((e) => e.type === 'folder')
  const files = errors.filter((e) => e.type === 'file')

  if (folders.length > 0) {
    console.log('📁 Pastas:')
    for (const error of folders) {
      console.log(`   ${error.path}`)
      if (showFix) {
        console.log(`   └─ Sugestão: ${error.suggestion}`)
      }
    }
    console.log()
  }

  if (files.length > 0) {
    console.log('📄 Arquivos:')
    for (const error of files) {
      console.log(`   ${error.path}`)
      if (showFix) {
        console.log(`   └─ Sugestão: ${error.suggestion}`)
      }
    }
    console.log()
  }

  if (!showFix) {
    console.log('💡 Dica: Execute com --fix para ver sugestões de correção\n')
  }

  console.log('📖 Padrão esperado: kebab-case (ex: my-component.js, user-service.js)\n')

  process.exit(1)
}

main().catch((err) => {
  console.error('Erro ao executar validação:', err)
  process.exit(1)
})
