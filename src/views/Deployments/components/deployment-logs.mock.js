export const deploymentLogsMock = [
  { timestamp: '13:47:33', level: 'info', content: '[TASK] - #. Deploy started successfully!' },
  { timestamp: '13:47:33', level: 'info', content: '[TASK] - #. Creating Azion token!' },
  { timestamp: '13:47:33', level: 'info', content: '[TASK] - #. Add to Azion CLI!' },
  {
    timestamp: '13:47:33',
    level: 'info',
    content:
      "Please remember to login before running any commands. You can do this by running the following command: 'azion login'"
  },
  {
    timestamp: '13:47:33',
    level: 'info',
    content: 'Token saved in /root/.azion/default/settings.toml'
  },
  {
    timestamp: '13:47:33',
    level: 'info',
    content: 'This token will be used by default with all commands'
  },
  {
    timestamp: '13:47:33',
    level: 'info',
    content: '[TASK] - # Current directory: vue/vue3-vite-static/'
  },
  { timestamp: '13:47:33', level: 'info', content: '[TASK] - #. Cloning template!' },
  { timestamp: '13:47:38', level: 'info', content: '[TASK] - # Build template' },
  {
    timestamp: '13:47:47',
    level: 'info',
    content: 'added 478 packages, and audited 479 packages in 9s'
  },
  { timestamp: '13:47:47', level: 'info', content: '82 packages are looking for funding' },
  { timestamp: '13:47:47', level: 'info', content: 'run `npm fund` for details' },
  {
    timestamp: '13:47:47',
    level: 'warning',
    content: '24 vulnerabilities (5 low, 7 moderate, 10 high, 2 critical)'
  },
  {
    timestamp: '13:47:47',
    level: 'info',
    content: 'To address issues that do not require attention, run:'
  },
  { timestamp: '13:47:47', level: 'info', content: 'npm audit fix' },
  { timestamp: '13:47:47', level: 'info', content: 'To address all issues, run:' },
  { timestamp: '13:47:47', level: 'info', content: 'npm audit fix --force' },
  { timestamp: '13:47:50', level: 'info', content: '[TASK] - # Running vite build' },
  {
    timestamp: '13:47:52',
    level: 'error',
    content: "ERROR: Failed to resolve import './config/env' from src/main.js"
  },
  {
    timestamp: '13:47:52',
    level: 'error',
    content: "TypeError: Cannot read properties of undefined (reading 'apiBaseUrl')"
  },
  {
    timestamp: '13:47:52',
    level: 'error',
    content: '    at loadEnvironment (src/config/env.js:14:23)'
  },
  {
    timestamp: '13:47:52',
    level: 'error',
    content: '    at Object.<anonymous> (src/main.js:8:1)'
  },
  {
    timestamp: '13:47:53',
    level: 'error',
    content: 'Build failed with 4 errors — exit code 1'
  },
  {
    timestamp: '13:47:53',
    level: 'error',
    content: '[TASK] - # Deploy aborted: build step did not complete successfully'
  }
]
