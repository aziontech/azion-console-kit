import * as FunctionsInstanceService from '@/services/edge-application-functions-services'
import * as EdgeFunctionsService from '@/services/edge-functions-services'
import { parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'

const getFunctionInstances = async (edgeApplicationId) => {
  return await FunctionsInstanceService.listFunctionsService({
    id: edgeApplicationId
  })
}

const getFunctionData = async (edgeApplicationFunction) => {
  return await EdgeFunctionsService.loadEdgeFunctionsService({
    id: edgeApplicationFunction.edgeFunctionId
  })
}

const createFunctionsList = async (functionsInstances) => {
  return await Promise.all(
    functionsInstances?.map(async (edgeApplicationFunction) => {
      let functionData = await getFunctionData(edgeApplicationFunction)

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
}

const createHttpResponse = async (functionsList) => {
  return {
    body: await functionsList,
    statusCode: 200
  }
}

export const listEdgeApplicationFunctionsService = async (edgeApplicationId) => {
  const functionsInstances = await getFunctionInstances(edgeApplicationId)
  const functionsList = await createFunctionsList(functionsInstances)
  const httpResponse = await createHttpResponse(functionsList)

  return parseHttpResponse(httpResponse)
}
