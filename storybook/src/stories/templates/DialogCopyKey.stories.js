import DialogCopyKey from '@/templates/dialog-copy-key/index.vue';
import { ref, provide } from 'vue';

export default {
  title: 'Templates/DialogCopyKey',
  component: DialogCopyKey,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A dialog component that displays a personal token value with copy functionality and a warning message. Uses PrimeDialog with a password input (with toggle mask and readonly) and receives the token via dialogRef injection. Designed to be used with PrimeVue dynamic dialog systems. The token is displayed once with a warning to copy it before closing.'
      }
    }
  }
};

// Helper component to provide dialogRef injection
const DialogWrapper = {
  components: { DialogCopyKey },
  props: {
    personalToken: {
      type: String,
      default: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    }
  },
  setup(props) {
    const dialogData = ref({
      personalToken: props.personalToken
    });

    const dialogRef = ref({
      data: dialogData.value,
      close: () => {
        // eslint-disable-next-line no-console
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
    template: '<DialogWrapper personalToken="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" />'
  })
};