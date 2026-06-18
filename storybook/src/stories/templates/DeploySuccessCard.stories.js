import DeploySuccessCard from '@/templates/deploy-template/DeploySuccessCard.vue';

export default {
  title: 'Templates/DeploySuccessCard',
  component: DeploySuccessCard,
  tags: ['autodocs'],
  argTypes: {
    appUrl: {
      control: 'text',
      description: 'Deployed application URL'
    },
    executionId: {
      control: 'text',
      description: 'Execution ID for viewing logs'
    },
    previewSrc: {
      control: 'text',
      description: 'Preview image URL'
    },
    previewAlt: {
      control: 'text',
      description: 'Alt text for preview image'
    },
    templateTitle: {
      control: 'text',
      description: 'Template name'
    },
    templateUrl: {
      control: 'text',
      description: 'Template documentation URL'
    },
    templateDescription: {
      control: 'text',
      description: 'Template description'
    },
    githubUrl: {
      control: 'text',
      description: 'GitHub repository URL'
    },
    results: {
      control: 'object',
      description: 'Deployment results with created resources'
    },
    workloadId: {
      control: 'text',
      description: 'Workload ID for loading existing domain data'
    },
    isSaving: {
      control: 'boolean',
      description: 'Loading state for save operation'
    }
  },
  parameters: {
    docs: {
      description: {
        component:
          'Step 4 of the deploy template flow. Displays success confirmation with app URL, lists created resources, provides domain customization via accordion, and suggests next steps for the user.'
      }
    }
  }
};

export const Default = {
  render: (args) => ({
    components: { DeploySuccessCard },
    setup() {
      return { args };
    },
    template: `
      <DeploySuccessCard
        v-bind="args"
        @onSave="(values) => console.log('Save:', values)"
      />
    `
  }),
  args: {
    appUrl: 'https://myapp1234.azion.app',
    executionId: 'exec-12345',
    previewSrc: 'https://via.placeholder.com/120x80',
    previewAlt: 'Template Preview',
    templateTitle: 'Next.js Starter',
    templateUrl: 'https://docs.azion.com/templates/nextjs',
    templateDescription: 'A modern Next.js application with edge optimization.',
    results: {
      domain: {
        id: 'domain-123',
        url: 'https://myapp1234.azion.app'
      },
      edgeApplication: {
        id: 'app-456',
        name: 'My Next.js App'
      }
    },
    isSaving: false
  }
};

export const WithFunction = {
  render: (args) => ({
    components: { DeploySuccessCard },
    setup() {
      return { args };
    },
    template: `
      <DeploySuccessCard v-bind="args" />
    `
  }),
  args: {
    appUrl: 'https://apicomplete.azion.app',
    executionId: 'exec-67890',
    templateTitle: 'Full Stack Template',
    templateUrl: 'https://docs.azion.com/templates/fullstack',
    results: {
      domain: {
        id: 'domain-456',
        url: 'https://apicomplete.azion.app'
      },
      edgeApplication: {
        id: 'app-789',
        name: 'Full Stack App'
      },
      extras: {
        functionName: 'API Handler',
        functionId: 'func-123'
      }
    }
  }
};

export const WithFirewall = {
  render: (args) => ({
    components: { DeploySuccessCard },
    setup() {
      return { args };
    },
    template: `
      <DeploySuccessCard v-bind="args" />
    `
  }),
  args: {
    appUrl: 'https://secureapp.azion.app',
    executionId: 'exec-firewall',
    templateTitle: 'Secure Template',
    templateUrl: 'https://docs.azion.com/templates/secure',
    results: {
      domain: {
        id: 'domain-789',
        url: 'https://secureapp.azion.app'
      },
      edgeApplication: {
        id: 'app-101',
        name: 'Secure Application'
      },
      extras: {
        firewallName: 'WAF Rules',
        firewallId: 'fw-456'
      }
    }
  }
};

export const CompleteResources = {
  render: (args) => ({
    components: { DeploySuccessCard },
    setup() {
      return { args };
    },
    template: `
      <DeploySuccessCard v-bind="args" />
    `
  }),
  args: {
    appUrl: 'https://complete.azion.app/home',
    executionId: 'exec-complete',
    previewSrc: 'https://via.placeholder.com/120x80',
    templateTitle: 'Enterprise Template',
    templateUrl: 'https://docs.azion.com/templates/enterprise',
    templateDescription: 'Full enterprise setup with all components.',
    githubUrl: 'https://github.com/aziontech/enterprise-template',
    results: {
      domain: {
        id: 'domain-999',
        url: 'https://complete.azion.app'
      },
      edgeApplication: {
        id: 'app-999',
        name: 'Enterprise Application'
      },
      extras: {
        functionName: 'Auth Middleware',
        functionId: 'func-999',
        firewallName: 'Security Layer',
        firewallId: 'fw-999'
      }
    }
  }
};

export const Saving = {
  render: (args) => ({
    components: { DeploySuccessCard },
    setup() {
      return { args };
    },
    template: `
      <DeploySuccessCard v-bind="args" />
    `
  }),
  args: {
    appUrl: 'https://saving.azion.app',
    executionId: 'exec-saving',
    templateTitle: 'Template',
    templateUrl: 'https://docs.azion.com/templates/test',
    results: {
      domain: { id: 'domain-1', url: 'https://saving.azion.app' },
      edgeApplication: { id: 'app-1', name: 'App' }
    },
    isSaving: true
  }
};

export const WithWorkload = {
  render: (args) => ({
    components: { DeploySuccessCard },
    setup() {
      return { args };
    },
    template: `
      <DeploySuccessCard v-bind="args" />
    `
  }),
  args: {
    appUrl: 'https://workload.azion.app',
    executionId: 'exec-workload',
    templateTitle: 'Existing Workload',
    templateUrl: 'https://docs.azion.com/templates/workload',
    results: {
      domain: { id: 'domain-workload', url: 'https://workload.azion.app' },
      edgeApplication: { id: 'app-workload', name: 'Workload App' }
    },
    workloadId: 'workload-123'
  }
};

export const MinimalResults = {
  render: (args) => ({
    components: { DeploySuccessCard },
    setup() {
      return { args };
    },
    template: `
      <DeploySuccessCard v-bind="args" />
    `
  }),
  args: {
    appUrl: 'https://minimal.azion.app',
    templateTitle: 'Minimal Template',
    templateUrl: 'https://docs.azion.com/templates/minimal',
    results: null
  }
};
