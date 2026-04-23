/* eslint-disable no-console */
import ToastBlock from '@/templates/toast-block/index.vue';
import { useToast } from 'primevue/usetoast';

export default {
  title: '[tech debit] / Templates/ToastBlock',
  component: ToastBlock,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Toast notification component with customizable severity, actions, and styling.'
      }
    }
  }
};

const ToastTemplate = (args) => ({
  components: { ToastBlock },
  setup() {
    const toast = useToast();

    const showSuccess = () => {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Operation completed successfully',
        life: 5000
      });
    };

    const showError = () => {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'An error occurred during the operation',
        life: 5000
      });
    };

    const showInfo = () => {
      toast.add({
        severity: 'info',
        summary: 'Information',
        detail: 'This is an informational message',
        life: 5000
      });
    };

    const showWarn = () => {
      toast.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please review your input',
        life: 5000
      });
    };

    const showWithActions = () => {
      toast.add({
        severity: 'info',
        summary: 'Action Required',
        detail: 'Would you like to proceed?',
        action: {
          primary: {
            label: 'Confirm',
            // eslint-disable-next-line no-console
            callback: () => console.log('Confirmed')
          },
          secondary: {
            label: 'Cancel',
            callback: () => console.log('Cancelled')
          }
        },
        life: 10000
      });
    };

    return { args, showSuccess, showError, showInfo, showWarn, showWithActions };
  },
  template: `
    <div>
      <ToastBlock v-bind="args" />
      <div class="flex gap-2 p-4">
        <button @click="showSuccess" class="px-4 py-2 bg-green-500 text-white rounded">Show Success</button>
        <button @click="showError" class="px-4 py-2 bg-red-500 text-white rounded">Show Error</button>
        <button @click="showInfo" class="px-4 py-2 bg-blue-500 text-white rounded">Show Info</button>
        <button @click="showWarn" class="px-4 py-2 bg-yellow-500 text-white rounded">Show Warning</button>
        <button @click="showWithActions" class="px-4 py-2 bg-purple-500 text-white rounded">Show With Actions</button>
      </div>
    </div>
  `
});

export const Default = ToastTemplate.bind({});
Default.args = {};
