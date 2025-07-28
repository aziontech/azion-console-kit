import { useDialog } from 'primevue/usedialog'
import DeleteDialog from '@/templates/list-table-block/dialog/delete-dialog.vue'

/**
 * Composable for opening delete dialogs
 * @returns {Object} Object containing openDeleteDialog function
 */
export function useDeleteDialog() {
  const dialog = useDialog()

  /**
   * Opens a delete dialog with the specified configuration
   * @param {Object} config - Configuration object for the delete dialog
   * @param {string} config.title - Title for the delete dialog
   * @param {string} config.deleteConfirmationText - Text that should be typed for deletion
   * @param {Object} config.data - Data of the item to be deleted
   * @param {Function} config.deleteService - Service function to handle deletion
   * @param {Function} [config.closeCallback] - Callback function when dialog is closed
   * @param {Function} [config.successCallback] - Callback function when deletion is successful
   */
  function openDeleteDialog(config) {
    const { title, id, data, deleteService, closeCallback, successCallback } = config

    const bodyDelete = {
      data: {
        title,
        selectedID: id,
        selectedItemData: data,
        deleteDialogVisible: true,
        deleteService,
        rerender: Math.random(),
        deleteConfirmationText: getDeleteConfirmationText(config)
      },
      onClose: closeCallback,
      onSuccess: successCallback
    }
    dialog.open(DeleteDialog, bodyDelete)
  }

  function getDeleteConfirmationText(config) {
    if (!config.data) return 'delete'

    return (
      config.data.deleteConfirmationText ||
      config.data?.name?.text ||
      config.data?.name ||
      config.data?.key ||
      (config.data.firstName ? `${config.data.firstName} ${config.data.lastName}` : undefined) ||
      'delete'
    )
  }

  return {
    openDeleteDialog
  }
}
