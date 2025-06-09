import { listDatabasesService } from './list-databases-service'
import { createDatabaseService } from './create-database-service'
import { deleteDatabaseService } from './delete-database-service'
import { getDatabaseService } from './get-database-service'
import { checkDatabaseStatusService } from './check-database-status-service'
import { queryDatabaseService } from './query-database-service'
import { executeDatabaseService } from './execute-database-service'
import { getTablesService } from './get-tables-service'

/**
 * @typedef {Object} EdgeSQLServicesType
 * @property {typeof listDatabasesService} listDatabasesService
 * @property {typeof createDatabaseService} createDatabaseService
 * @property {typeof deleteDatabaseService} deleteDatabaseService
 * @property {typeof getDatabaseService} getDatabaseService
 * @property {typeof checkDatabaseStatusService} checkDatabaseStatusService
 * @property {typeof queryDatabaseService} queryDatabaseService
 * @property {typeof executeDatabaseService} executeDatabaseService
 * @property {typeof getTablesService} getTablesService
 */

/**
 * @type {EdgeSQLServicesType}
 */
export {
  listDatabasesService,
  createDatabaseService,
  deleteDatabaseService,
  getDatabaseService,
  checkDatabaseStatusService,
  queryDatabaseService,
  executeDatabaseService,
  getTablesService
} 