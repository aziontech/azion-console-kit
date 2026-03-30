import Button from '@aziontech/webkit/button'
import Illustration403 from '@aziontech/webkit/svg/error-403'
import Illustration404 from '@aziontech/webkit/svg/error-404'
import ErrorPageBlock from '@/templates/error-page-block/index.vue';

export default {
  title: 'Templates/ErrorPageBlock',
  component: ErrorPageBlock,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Error title displayed on the page'
    },
    description: {
      control: 'text',
      description: 'Error description text'
    }
  },
  parameters: {
    docs: {
      description: {
        component: 'Error page template with customizable illustration and action slots. Use the illustration slot for error graphics and actions slot for navigation buttons.'
      }
    }
  }
};

export const Forbidden403 = {
  args: {
    title: 'Access Forbidden',
    description: 'You do not have permission to access this resource. Please contact your administrator if you believe this is an error.'
  },
  render: (args) => ({
    components: {
      ErrorPageBlock,
      Illustration403,
      Button
    },
    setup() {
      const handleGoBackHome = () => {
        alert('Back to home')
      };

      const handleContactSupport = () => {
        alert('Contact Support')
      };

      return { args, handleGoBackHome, handleContactSupport };
    },
    template: `
      <ErrorPageBlock v-bind="args">
        <template #illustration>
          <Illustration403 />
        </template>

        <template #actions>
          <Button
            label="Back to Home"
            @click="handleGoBackHome"
          />
          <Button
            outlined
            label="Contact Support"
            @click="handleContactSupport"
          />
        </template>
      </ErrorPageBlock>
    `
  })
};

export const NotFound404 = {
  args: {
    title: 'Page Not Found',
  description: 'The page you are looking for does not exist or has been moved.'
  },
  render: (args) => ({
    components: {
      ErrorPageBlock,
      Illustration404,
      Button
    },
    setup() {
      const handleGoBackHome = () => {
        alert('Back to home')
      };

      const handleContactSupport = () => {
        alert('Contact Support')
      };

      return { args, handleGoBackHome, handleContactSupport };
    },
    template: `
      <ErrorPageBlock v-bind="args">
        <template #illustration>
          <Illustration404 />
        </template>

        <template #actions>
          <Button
            label="Back to Home"
            @click="handleGoBackHome"
          />
          <Button
            outlined
            label="Contact Support"
            @click="handleContactSupport"
          />
        </template>
      </ErrorPageBlock>
    `
  })
};