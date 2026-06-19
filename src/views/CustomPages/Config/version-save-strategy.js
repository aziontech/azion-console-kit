import { customPageService } from '@/services/v2/custom-page/custom-page-service'

// Custom Page content (incl. the protected `pages` field) is saved via the BASE
// endpoint: the version endpoint rejects `pages` as a protected override
// (edge-api 10109). SAVE_AND_BUILD saves through the base, then builds the draft.
export const customPageSaveStrategy = {
  save: ({ resourceId, values }) =>
    customPageService.editCustomPagesService({ id: resourceId, ...values }),
  saveAndBuild: async ({ service, resourceId, versionId, values, comment }) => {
    const result = await customPageService.editCustomPagesService({ id: resourceId, ...values })
    await service.build(resourceId, versionId, { comment })
    return result
  }
}
