const CURRENT_DATABASES = ['azion']

const LEGACY_DATABASES = ['AZION_CACHE', 'azion-cache']

async function listAllDatabases() {
  if (!window.indexedDB || !window.indexedDB.databases) {
    return []
  }

  try {
    const databases = await window.indexedDB.databases()
    return databases.map((db) => db.name).filter(Boolean)
  } catch (error) {
    return []
  }
}

async function deleteDatabase(dbName) {
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.deleteDatabase(dbName)

      request.onsuccess = () => {
        resolve(true)
      }

      request.onerror = () => {
        resolve(false)
      }

      request.onblocked = () => {
        resolve(false)
      }
    } catch (error) {
      resolve(false)
    }
  })
}

export async function cleanupLegacyDatabases() {
  const report = {
    removed: [],
    failed: [],
    total: 0
  }

  for (const dbName of LEGACY_DATABASES) {
    const success = await deleteDatabase(dbName)
    if (success) {
      report.removed.push(dbName)
    } else {
      report.failed.push(dbName)
    }
    report.total++
  }

  return report
}

export async function cleanupUnusedDatabases() {
  const allDatabases = await listAllDatabases()
  const unusedDatabases = allDatabases.filter((db) => !CURRENT_DATABASES.includes(db))

  const report = {
    removed: [],
    failed: [],
    total: unusedDatabases.length
  }

  for (const dbName of unusedDatabases) {
    const success = await deleteDatabase(dbName)
    if (success) {
      report.removed.push(dbName)
    } else {
      report.failed.push(dbName)
    }
  }

  return report
}

export async function hasLegacyDatabases() {
  const allDatabases = await listAllDatabases()
  return LEGACY_DATABASES.some((legacy) => allDatabases.includes(legacy))
}
