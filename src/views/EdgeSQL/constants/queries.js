// Quick Templates para o Edge SQL
export const QUICK_TEMPLATES = [
  {
    name: 'Create Table',
    query: `CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`
  },
  {
    name: 'Insert Data',
    query: `INSERT INTO users (name, email) VALUES 
('John Doe', 'john@example.com'),
('Jane Smith', 'jane@example.com');`
  },
  {
    name: 'Select All',
    query: 'SELECT * FROM users LIMIT 100;'
  },
  {
    name: 'Count Records',
    query: 'SELECT COUNT(*) as total FROM users;'
  },
  {
    name: 'Vector Table',
    query: `CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  embedding F32_BLOB(1536)
);`
  },
  {
    name: 'Insert Vectors',
    query: `INSERT INTO products (name, description, embedding) VALUES 
('Laptop', 'Gaming laptop with RTX graphics', vector('[0.1, 0.2, 0.3, 0.4, 0.5]')),
('Mouse', 'Wireless ergonomic mouse', vector('[0.2, 0.3, 0.1, 0.6, 0.4]')),
('Keyboard', 'Mechanical RGB keyboard', vector('[0.3, 0.1, 0.4, 0.2, 0.7]'));`
  },
  {
    name: 'Vector Search',
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
    query: `CREATE INDEX products_vector_idx 
ON products (libsql_vector_idx(embedding));`
  },
  {
    name: 'Vector Top K Query',
    query: `SELECT
  name,
  description,
  vector_distance_cos(embedding, vector('[0.1, 0.3, 0.2, 0.4, 0.5]')) AS distance
FROM products
ORDER BY distance ASC
LIMIT 3;`
  }
]

// Queries SQLite específicas
export const SQLITE_QUERIES = {
  // Informações da tabela
  TABLE_INFO: (tableName) => `PRAGMA table_info(${tableName});`,
  
  // Definição da tabela (CREATE TABLE statement)
  TABLE_DEFINITION: (tableName) => `SELECT sql FROM sqlite_master WHERE type='table' AND name='${tableName}';`,
  
  // Selecionar todos os dados de uma tabela
  SELECT_ALL: (tableName) => `SELECT * FROM ${tableName} LIMIT 100;`,
  
  // Contar registros
  COUNT_RECORDS: (tableName) => `SELECT COUNT(*) FROM ${tableName};`,
  
  // Listar todas as tabelas
  LIST_TABLES: () => `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;`,
  
  // Informações do banco
  DATABASE_INFO: () => `PRAGMA database_list;`,
  
  // Índices de uma tabela
  TABLE_INDEXES: (tableName) => `PRAGMA index_list(${tableName});`
}

// Queries de ação rápida para o menu contextual
export const QUICK_ACTIONS = {
  SELECT_ALL: (tableName) => SQLITE_QUERIES.SELECT_ALL(tableName),
  COUNT_RECORDS: (tableName) => SQLITE_QUERIES.COUNT_RECORDS(tableName),
  TABLE_INFO: (tableName) => SQLITE_QUERIES.TABLE_INFO(tableName)
} 