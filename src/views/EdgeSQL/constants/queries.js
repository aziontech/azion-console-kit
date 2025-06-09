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