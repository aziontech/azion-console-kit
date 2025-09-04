import { useDialog } from 'primevue/usedialog'
import DeleteDialog from '@/templates/list-table-block/dialog/delete-dialog.vue'

/**
 * Derives the confirmation text for deletion.
 * @param {Object} data - Data of the item to be deleted.
 * @returns {string} Confirmation text.
 */
const getDeleteConfirmationText = (data) =>
  !data
    ? 'delete'
    : data.deleteConfirmationText ??
      data.name?.text ??
      data.name ??
      data.key ??
      (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : undefined) ??
      'delete'

/**
 * Composable for opening delete confirmation dialogs.
 * @returns {{ openDeleteDialog: (config: Object) => void }}
 */
export const useDeleteDialog = () => {
  const dialog = useDialog()

  /**
   * Opens a delete dialog with the provided configuration.
   * @param {Object} config - Dialog configuration.
   * @param {string} config.title - Dialog title.
   * @param {string} [config.deleteConfirmationText] - Required confirmation text.
   * @param {Object} config.data - Item to be deleted.
   * @param {Function} config.deleteService - Deletion function.
   * @param {Function} [config.closeCallback] - Callback when closing.
   * @param {Function} [config.successCallback] - Callback when deletion is successful.
   * @param {boolean} [config.bypassConfirmation] - Bypass confirmation.
   */
  const openDeleteDialog = ({
    title,
    id,
    data,
    deleteService,
    closeCallback,
    successCallback,
    bypassConfirmation = false
  }) => {
    dialog.open(DeleteDialog, {
      data: {
        title,
        selectedID: id,
        selectedItemData: data,
        deleteDialogVisible: true,
        bypassConfirmation,
        deleteService,
        rerender: Math.random(),
        deleteConfirmationText: getDeleteConfirmationText(data)
      },
      onClose: closeCallback,
      onSuccess: successCallback
    })
  }

  return {
    openDeleteDialog
  }
}
