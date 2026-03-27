import ErrorPageBlock from '@/templates/error-page-block/index.vue';

export default {
  title: 'Templates/ErrorPageBlock',
  component: ErrorPageBlock,
  tags: ['autodocs'],
  argTypes: {
    errorCode: {
      control: 'text',
      description: 'Error code to display'
    },
    title: {
      control: 'text',
      description: 'Error title'
    },
    message: {
      control: 'text',
      description: 'Error message'
    }
  }
};

export const NotFound = {
  args: {
    errorCode: '404',
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist'
  }
};

export const ServerError = {
  args: {
    errorCode: '500',
    title: 'Server Error',
    message: 'An internal server error occurred'
  }
};

export const Forbidden = {
  args: {
    errorCode: '403',
    title: 'Access Forbidden',
    message: 'You do not have permission to access this resource'
  }
};
