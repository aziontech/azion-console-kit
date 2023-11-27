<template>
  <div class="p-5">
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
        uuid: '3fb88190-a496-4d02-960d-25eecbe1e586',
        getLogs
      }),
    }
  </script>
