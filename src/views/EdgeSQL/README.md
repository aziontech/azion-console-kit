# Azion SQL Interface

Esta implementação fornece uma interface completa para interagir com o Azion Edge SQL, similar ao Supabase. A interface permite gerenciar bancos de dados, executar queries SQL e visualizar resultados de forma intuitiva.

## Estrutura de Arquivos

```
src/views/AzionSQL/
├── ListView.vue              # Listagem de bancos de dados
├── DatabaseView.vue          # Interface principal do banco
├── Dialog/
│   └── CreateDatabase.vue    # Modal para criar novos bancos
├── components/
│   └── QueryHistory.vue      # Componente de histórico de queries
└── README.md                 # Esta documentação

src/services/azion-sql-services/
├── index.js                  # Exportações dos serviços
├── list-databases-service.js # Listar bancos de dados
├── create-database-service.js # Criar banco de dados
├── delete-database-service.js # Deletar banco de dados
├── get-database-service.js    # Obter informações de um banco
├── query-database-service.js  # Executar queries SELECT
├── execute-database-service.js # Executar comandos SQL
└── get-tables-service.js      # Listar tabelas de um banco

src/stores/
└── azion-sql.js              # Store Pinia para gerenciar estado

src/router/routes/
└── azion-sql-routes/
    └── index.js              # Definições de rotas
```

## Funcionalidades

### 1. Listagem de Bancos de Dados (`ListView.vue`)
- ✅ Listagem paginada de bancos de dados
- ✅ Busca por nome
- ✅ Criação de novos bancos via dialog
- ✅ Deleção de bancos existentes
- ✅ Navegação para interface do banco específico

### 2. Interface do Banco de Dados (`DatabaseView.vue`)
- ✅ Sidebar com estrutura de tabelas
- ✅ Editor SQL com syntax highlighting
- ✅ Templates de queries rápidas
- ✅ Execução de queries SELECT e comandos SQL
- ✅ Visualização de resultados em tabela
- ✅ Histórico de queries executadas
- ✅ Tempo de execução das queries
- ✅ Atualização automática de tabelas após DDL

### 3. Componentes Adicionais

#### Dialog de Criação (`CreateDatabase.vue`)
- ✅ Validação de nome do banco
- ✅ Criação via API Azion SQL
- ✅ Navegação automática para o banco criado

#### Histórico de Queries (`QueryHistory.vue`)
- ✅ Lista de queries executadas
- ✅ Re-execução de queries do histórico
- ✅ Limpeza do histórico
- ✅ Informações de tempo de execução

## Serviços

Todos os serviços utilizam a biblioteca oficial `azion` e seguem o padrão do projeto:

### `listDatabasesService`
- Parâmetros: `orderBy`, `sort`, `page`, `pageSize`, `search`
- Retorna: Lista paginada de bancos de dados

### `createDatabaseService`
- Parâmetros: `name`
- Retorna: Informações do banco criado

### `queryDatabaseService` / `executeDatabaseService`
- Parâmetros: `databaseName`, `query/statements`
- Retorna: Resultados da execução

## Store (Pinia)

O store `azion-sql` gerencia:
- Lista de bancos de dados
- Banco de dados atual
- Tabelas do banco atual
- Histórico de queries
- Estados de loading e erro

## Rotas

```javascript
/azion-sql                    # Lista de bancos de dados
/azion-sql/database/:name     # Interface do banco específico
```

## Configuração do Menu

A entrada "Azion SQL" foi adicionada no menu lateral em uma nova seção "Database".

## Dependências

- `azion` - Biblioteca oficial para integração com Azion SQL
- `primevue` - Componentes UI
- `pinia` - Gerenciamento de estado
- `vue-router` - Roteamento
- `vee-validate` + `yup` - Validação de formulários

## Padrões Seguidos

### Arquitetura
- ✅ Separação clara entre services, stores e views
- ✅ Componentização reutilizável
- ✅ Padrão de nomenclatura consistente

### UX/UI
- ✅ Design consistente com o resto da aplicação
- ✅ Feedback visual para ações do usuário
- ✅ Estados de loading e erro
- ✅ Interface responsiva

### Código
- ✅ TypeScript/JSDoc para documentação
- ✅ Tratamento de erros consistente
- ✅ Formatação PT-BR para datas/números
- ✅ Validação de entrada de dados

## Templates de Queries Rápidas

A interface inclui templates prontos para:
1. **Criar Tabela** - CREATE TABLE com estrutura comum
2. **Inserir Dados** - INSERT com dados de exemplo
3. **Selecionar Tudo** - SELECT básico com LIMIT
4. **Contar Registros** - COUNT para análise

## Possíveis Melhorias Futuras

1. **Editor SQL Avançado**
   - Syntax highlighting
   - Auto-complete
   - Formatação de código

2. **Exportação de Dados**
   - CSV, JSON, SQL
   - Filtros avançados

3. **Gestão de Schema**
   - Visualização de colunas
   - Chaves estrangeiras
   - Índices

4. **Backups e Restore**
   - Export/import de estrutura
   - Versionamento de schema

5. **Monitoramento**
   - Métricas de performance
   - Logs de queries
   - Alertas de erro 