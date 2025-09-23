export const QUICK_TEMPLATES = [
  {
    name: 'Create Table',
    description: 'Create a basic users table with auto-increment ID and timestamp',
    query: `CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`
  },
  {
    name: 'Insert Data',
    description: 'Insert sample user records into the users table',
    query: `INSERT INTO users (name, email) VALUES 
('John Doe', 'john@example.com'),
('Jane Smith', 'jane@example.com');`
  },
  {
    name: 'Select All',
    description: 'Retrieve all records from users table with limit',
    query: 'SELECT * FROM users LIMIT 100;'
  },
  {
    name: 'Count Records',
    description: 'Count total number of records in users table',
    query: 'SELECT COUNT(*) as total FROM users;'
  },
  {
    name: 'Vector Table',
    description: 'Create a products table with vector embeddings for AI search',
    query: `CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  embedding F32_BLOB(1536)
);`
  },
  {
    name: 'Insert Vectors',
    description: 'Insert sample products with vector embeddings',
    query: `INSERT INTO products (name, description, embedding) VALUES 
('Laptop', 'Gaming laptop with RTX graphics', vector('[0.1, 0.2, 0.3, 0.4, 0.5]')),
('Mouse', 'Wireless ergonomic mouse', vector('[0.2, 0.3, 0.1, 0.6, 0.4]')),
('Keyboard', 'Mechanical RGB keyboard', vector('[0.3, 0.1, 0.4, 0.2, 0.7]'));`
  },
  {
    name: 'Vector Search',
    description: 'Search products using cosine similarity with vector embeddings',
    query: `SELECT 
  name,
  description,
  vector_distance_cos(embedding, vector('[0.25, 0.25, 0.25, 0.25, 0.25]')) AS similarity
FROM products
ORDER BY similarity ASC
LIMIT 5;`
  },
  {
    name: 'Create Vector Index',
    description: 'Create an index to optimize vector search performance',
    query: `CREATE INDEX products_vector_idx 
ON products (libsql_vector_idx(embedding));`
  },
  {
    name: 'Vector Top K Query',
    description: 'Find top 3 most similar products using vector distance',
    query: `SELECT
  name,
  description,
  vector_distance_cos(embedding, vector('[0.1, 0.3, 0.2, 0.4, 0.5]')) AS distance
FROM products
ORDER BY distance ASC
LIMIT 3;`
  }
]

export const SQLITE_QUERIES = {
  TABLE_INFO: (tableName) => `PRAGMA table_info(${tableName});`,

  TABLE_DEFINITION: (tableName) =>
    `SELECT sql FROM sqlite_master WHERE type='table' AND name='${tableName}';`,

  SELECT_ALL: (tableName) => `SELECT * FROM ${tableName} LIMIT 100;`,

  COUNT_RECORDS: (tableName) => `SELECT COUNT(*) FROM ${tableName};`,

  LIST_TABLES: () => `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;`,

  DATABASE_INFO: () => `PRAGMA database_list;`,

  TABLE_INDEXES: (tableName) => `PRAGMA index_list(${tableName});`,

  FOREIGN_KEYS: (tableName) => `PRAGMA foreign_key_list(${tableName});`,

  TABLE_SIZE: (tableName) => `SELECT 
    name,
    COUNT(*) as row_count
  FROM ${tableName}, sqlite_master 
  WHERE sqlite_master.name = '${tableName}';`,

  VACUUM_ANALYZE: () => `VACUUM; ANALYZE;`,

  DELETE_ALL: (tableName) => `DELETE FROM ${tableName};`,

  DELETE_DATA: (tableName, rowData, columns) => {
    const hasIdColumn = columns.some((col) => col.name === 'id' || col.name === 'ID')

    if (hasIdColumn && rowData.id !== undefined) {
      return `DELETE FROM ${tableName} WHERE id = ${rowData.id};`
    } else {
      const whereConditions = columns
        .filter((col) => rowData[col.name] !== undefined && rowData[col.name] !== null)
        .map((col) => {
          const value = rowData[col.name]
          if (typeof value === 'string') {
            return `${col.name} = '${value.replace(/'/g, "''")}'`
          } else if (typeof value === 'number') {
            return `${col.name} = ${value}`
          } else if (typeof value === 'boolean') {
            return `${col.name} = ${value ? 1 : 0}`
          } else {
            return `${col.name} = '${String(value).replace(/'/g, "''")}'`
          }
        })
        .join(' AND ')

      if (whereConditions) {
        return `DELETE FROM ${tableName} WHERE ${whereConditions};`
      } else {
        throw new Error('Cannot build DELETE query: no valid columns found')
      }
    }
  },

  TRUNCATE_SIMULATION: (tableName) => `DELETE FROM ${tableName}; VACUUM;`,

  DATABASE_SIZE: () => `SELECT 
    (page_count * page_size) AS size_bytes,
    ROUND((page_count * page_size) / 1024.0, 2) AS size_kb,
    ROUND((page_count * page_size) / 1048576.0, 2) AS size_mb
  FROM 
    pragma_page_count(), pragma_page_size();`
}

export const QUICK_ACTIONS = {
  SELECT_ALL: (tableName) => SQLITE_QUERIES.SELECT_ALL(tableName),
  COUNT_RECORDS: (tableName) => SQLITE_QUERIES.COUNT_RECORDS(tableName),
  TABLE_INFO: (tableName) => SQLITE_QUERIES.TABLE_INFO(tableName)
}
