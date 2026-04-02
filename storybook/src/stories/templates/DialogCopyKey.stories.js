import DialogCopyKey from '@/templates/dialog-copy-key/index.vue';
import { ref, provide } from 'vue';

export default {
  title: 'Templates/DialogCopyKey',
  component: DialogCopyKey,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A dialog component that displays a key/token value with copy functionality and a warning message. Uses PrimeDialog with a password input (with toggle mask) and receives parameters via dialogRef injection. Designed to be used with dynamic dialog systems.'
      }
    }
  }
};

// Helper component to provide dialogRef injection
const DialogWrapper = {
  components: { DialogCopyKey },
  props: {
    title: {
      type: String,
      default: 'API Key'
    },
    keyValue: {
      type: String,
      default: 'sk-1234567890abcdef1234567890abcdef'
    }
  },
  setup(props) {
    const dialogData = ref({
      title: props.title,
      key: props.keyValue
    });

    const dialogRef = ref({
      data: dialogData.value,
      close: () => {
        console.log('Dialog closed');
      }
    });

    provide('dialogRef', dialogRef);

    return {};
  },
  template: `
    <DialogCopyKey />
  `
};

export const Default = {
  render: () => ({
    components: { DialogWrapper },
    template: '<DialogWrapper title="Personal Token" keyValue="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" />'
  })
};