import * as RulesEngineService from './edit-rules-engine-service'
import { CannotReorderDefaultRule } from '@/services/axios/errors'

export const reorderRulesEngine = async (tableData, edgeApplicationId) => {
  const hasDefault = checkDefault(tableData)
  if (hasDefault) {
    throw new CannotReorderDefaultRule().message
  }

  for (let index = 0; index < tableData.length; index++) {
    await reorderRule(tableData[index], edgeApplicationId)
  }
}

const reorderRule = async (rule, edgeApplicationId) => {
  const newOrder = parseInt(rule.newIndex) + 1
  await editRuleOrder(rule, newOrder, edgeApplicationId)
}

const checkDefault = (tableData) => {
  return tableData.some((rule) => rule.phase.content === 'Default')
}

const editRuleOrder = async (rule, newOrder, edgeApplicationId) => {
  await RulesEngineService.editRulesEngineService({
    id: edgeApplicationId,
    payload: { ...rule, order: newOrder },
    reorder: true
  })
}
