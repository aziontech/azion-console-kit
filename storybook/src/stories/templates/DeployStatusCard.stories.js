import DeployStatusCard from '@/templates/deploy-template/DeployStatusCard.vue';

export default {
  title: 'Templates/DeployStatusCard',
  component: DeployStatusCard,
  tags: ['autodocs'],
  argTypes: {
    executionId: {
      control: 'text',
      description: 'Execution ID for the script runner'
    },
    getLogsService: {
      control: 'object',
      description: 'Service function to fetch logs'
    },
    results: {
      control: 'object',
      description: 'Results from deployment (populated after finish)'
    },
    deployFailed: {
      control: 'boolean',
      description: 'Whether deployment failed'
    },
    applicationName: {
      control: 'text',
      description: 'Application name for heading'
    },
    deployStartTime: {
      control: 'number',
      description: 'Deploy start timestamp (milliseconds)'
    },
    deployLabel: {
      control: 'text',
      description: 'Label for deploy action'
    },
    manageLabel: {
      control: 'text',
      description: 'Label for manage action'
    },
    backLabel: {
      control: 'text',
      description: 'Label for back action'
    },
    showManageButton: {
      control: 'boolean',
      description: 'Show manage button'
    },
    showUrlButton: {
      control: 'boolean',
      description: 'Show URL button'
    },
    deployStarted: {
      control: 'boolean',
      description: 'Whether deployment has started'
    }
  },
  parameters: {
    docs: {
      description: {
        component:
          'Step 3 of the deploy template flow. Displays deployment progress with real-time logs using ScriptRunnerBlock, shows elapsed time, and emits events for finish and manage actions.'
      }
    }
  }
};

const mockGetLogsService = async () => {
  return {
    body: [
      { time: '10:00:01', message: 'Starting deployment...' },
      { time: '10:00:02', message: 'Building application...' },
      { time: '10:00:05', message: 'Uploading to edge...' },
      { time: '10:00:08', message: 'Configuring edge functions...' },
      { time: '10:00:10', message: 'Deployment complete!' }
    ]
  };
};

export const Default = {
  render: (args) => ({
    components: { DeployStatusCard },
    setup() {
      return { args };
    },
    template: `
      <DeployStatusCard
        v-bind="args"
        @finish="() => console.log('Deploy finished')"
        @manage="(data) => console.log('Manage:', data)"
      />
    `
  }),
  args: {
    executionId: 'exec-12345',
    getLogsService: mockGetLogsService,
    applicationName: 'My Application',
    deployStarted: true,
    deployStartTime: Date.now() - 30000,
    deployLabel: 'Deploy',
    manageLabel: 'Manage',
    backLabel: 'Back'
  }
};

export const NotStarted = {
  render: (args) => ({
    components: { DeployStatusCard },
    setup() {
      return { args };
    },
    template: `
      <DeployStatusCard v-bind="args" />
    `
  }),
  args: {
    executionId: 'exec-pending',
    getLogsService: mockGetLogsService,
    applicationName: 'Pending App',
    deployStarted: false,
    deployStartTime: null
  }
};

export const WithResults = {
  render: (args) => ({
    components: { DeployStatusCard },
    setup() {
      return { args };
    },
    template: `
      <DeployStatusCard
        v-bind="args"
        @finish="() => console.log('Deploy finished')"
      />
    `
  }),
  args: {
    executionId: 'exec-complete',
    getLogsService: mockGetLogsService,
    applicationName: 'Deployed App',
    deployStarted: true,
    deployStartTime: Date.now() - 120000,
    results: {
      domain: {
        id: 'domain-123',
        url: 'https://myapp.azion.app'
      },
      edgeApplication: {
        id: 'app-456',
        name: 'My Edge Application'
      }
    }
  }
};

export const Failed = {
  render: (args) => ({
    components: { DeployStatusCard },
    setup() {
      return { args };
    },
    template: `
      <DeployStatusCard
        v-bind="args"
        @retry="() => console.log('Retry clicked')"
      />
    `
  }),
  args: {
    executionId: 'exec-failed',
    getLogsService: mockGetLogsService,
    applicationName: 'Failed App',
    deployStarted: true,
    deployStartTime: Date.now() - 60000,
    deployFailed: true
  }
};

export const LongRunning = {
  render: (args) => ({
    components: { DeployStatusCard },
    setup() {
      return { args };
    },
    template: `
      <DeployStatusCard v-bind="args" />
    `
  }),
  args: {
    executionId: 'exec-long',
    getLogsService: mockGetLogsService,
    applicationName: 'Large Application',
    deployStarted: true,
    deployStartTime: Date.now() - 180000
  }
};
