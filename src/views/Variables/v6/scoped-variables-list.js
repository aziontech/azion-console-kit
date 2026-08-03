import { variablesV6Service } from '@/services/v2/variables/v6/variables-v6-service'

export const makeScopedVariablesList =
  (scopeType, scopeId) =>
  (params = {}) =>
    variablesV6Service.list({ ...params, scope_type: scopeType, scope_id: scopeId })
