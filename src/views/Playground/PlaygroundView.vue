<template>
  <div>
    <ScriptRunnerBlock
      title="Build"
      :executionId="uuid"
      :scriptRunnerService="getLogs"></ScriptRunnerBlock>
      
  </div>
</template>
  <script>
    import ScriptRunnerBlock from '@/templates/script-runner-block'
    import {getLogs} from '@/services/script-runner-service'
    export default {
      name: 'script-runner-test-block',
      components: {
        ScriptRunnerBlock
      },
      async created() {
        //
      },
      data: () => ({
        uuid: 'xx',
        getLogs
      }),
    }
  </script>
  