import * as RulesEngineService from './edit-rules-engine-service'
import { CannotReorderDefaultRule } from '@/services/axios/errors'

/**
 * Reorders the rules engine.
 * @param {Array} tableData - The table data containing the rules.
 * @param {string} edgeApplicationId - The ID of the edge application.
 * @throws {CannotReorderDefaultRule} If a default rule is found.
 */
export const reorderRulesEngine = async (tableData, edgeApplicationId) => {
  const hasDefault = checkDefault(tableData)
  if (hasDefault) {
    throw new CannotReorderDefaultRule().message
  }

  for (let index = 0; index < tableData.length; index++) {
    await reorderRule(tableData[index], edgeApplicationId)
  }
}

/**
 * Reorders a single rule.
 * @param {Object} rule - The rule to be reordered.
 * @param {string} edgeApplicationId - The ID of the edge application.
 */
const reorderRule = async (rule, edgeApplicationId) => {
  const newOrder = parseInt(rule.newIndex) + 1
  await editRuleOrder(rule, newOrder, edgeApplicationId)
}

/**
 * Checks if a default rule exists in the table data.
 * @param {Array} tableData - The table data containing the rules.
 * @returns {boolean} True if a default rule exists, false otherwise.
 */
const checkDefault = (tableData) => {
  return tableData.some((rule) => rule.phase.content === 'Default')
}

/**
 * Edits the order of a rule.
 * @param {Object} rule - The rule to be reordered.
 * @param {number} newOrder - The new order of the rule.
 * @param {string} edgeApplicationId - The ID of the edge application.
 */
const editRuleOrder = async (rule, newOrder, edgeApplicationId) => {
  await RulesEngineService.editRulesEngineService({
    id: edgeApplicationId,
    payload: { ...rule, order: newOrder },
    reorder: true
  })
}
