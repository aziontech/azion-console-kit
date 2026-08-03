import { customPageService } from '@/services/v2/custom-page/custom-page-service'

export const customPageSaveStrategy = {
  save: ({ resourceId, values }) =>
    customPageService.editCustomPagesService({ id: resourceId, ...values }),
  saveAndBuild: async ({ service, resourceId, versionId, values, comment }) => {
    const result = await customPageService.editCustomPagesService({ id: resourceId, ...values })
    await service.build(resourceId, versionId, { comment })
    return result
  }
}
