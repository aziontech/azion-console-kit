import * as FunctionsInstanceService from '@/services/edge-application-functions-services'
import * as EdgeFunctionsService from '@/services/edge-functions-services'

export const listEdgeApplicationFunctionsService = async (edgeApplicationId) => {
  const functionsInstances = await FunctionsInstanceService.listFunctionsService({
    id: edgeApplicationId
  })

  const functionsList = await Promise.all(
    functionsInstances.map(async (edgeApplicationFunction) => {
      let functionData = await EdgeFunctionsService.loadEdgeFunctionsService({
        id: edgeApplicationFunction.edgeFunctionId
      })

      return {
        id: edgeApplicationFunction.id,
        name: edgeApplicationFunction.name,
        languageIcon: functionData.languageIcon,
        referenceCount: functionData.referenceCount,
        initiatorType: functionData.initiatorType,
        lastEditor: functionData.lastEditor,
        modified: functionData.modified,
        statusTag: functionData.statusTag,
        version: functionData.version
      }

    })
  )

  return await functionsList
}
