<script setup>
  import PrimeTag from 'primevue/tag'

  defineProps({
    behaviors: {
      type: Array,
      default: () => []
    }
  })

  const behaviorProps = {
    add_request_cookie: {
      icon: 'pi pi-cookie',
      value: 'Add Request Cookie',
      severity: 'info'
    },
    add_request_header: {
      icon: 'pi pi-send',
      value: 'Add Request Header',
      severity: 'info'
    },
    bypass_cache: {
      icon: 'pi pi-fast-forward',
      value: 'Bypass Cache',
      severity: 'info'
    },
    capture_match_groups: {
      icon: 'pi pi-search',
      value: 'Capture Match Groups',
      severity: 'info'
    },
    deliver: {
      icon: 'pi pi-box',
      value: 'Deliver',
      severity: 'info'
    },
    deny: {
      icon: 'pi pi-ban',
      value: 'Deny',
      severity: 'info'
    },
    enable_gzip: {
      icon: 'pi pi-cog',
      value: 'Enable Gzip',
      severity: 'info'
    },
    filter_request_cookie: {
      icon: 'pi pi-filter',
      value: 'Filter Request Cookie',
      severity: 'info'
    },
    filter_request_header: {
      icon: 'pi pi-shield',
      value: 'Filter Request Header',
      severity: 'info'
    },
    forward_cookies: {
      icon: 'pi pi-arrow-right',
      value: 'Forward Cookies',
      severity: 'info'
    },
    no_content: {
      icon: 'pi pi-times-circle',
      value: 'No Content',
      severity: 'info'
    },
    optimize_images: {
      icon: 'pi pi-image',
      value: 'Optimize Images',
      severity: 'info'
    },
    redirect_http_to_https: {
      icon: 'pi pi-lock',
      value: 'Redirect HTTP to HTTPS',
      severity: 'info'
    },
    redirect_to_301: {
      icon: 'pi pi-directions',
      value: 'Redirect to 301',
      severity: 'info'
    },
    redirect_to_302: {
      icon: 'pi pi-arrow-down-right',
      value: 'Redirect to 302',
      severity: 'info'
    },
    rewrite_request: {
      icon: 'pi pi-pencil',
      value: 'Rewrite Request',
      severity: 'info'
    },
    run_function: {
      icon: 'pi pi-code',
      value: 'Run Function',
      severity: 'info'
    },
    set_cache_policy: {
      icon: 'pi pi-database',
      value: 'Set Cache Policy',
      severity: 'info'
    },
    set_origin: {
      icon: 'pi pi-globe',
      value: 'Set Origin',
      severity: 'info'
    },
    set_cookie: {
      icon: 'pi pi-sparkles',
      value: 'Set Cookie',
      severity: 'info'
    },
    add_response_cookie: {
      icon: 'pi pi-sparkles',
      value: 'Add Response Cookie',
      severity: 'info'
    },
    add_response_header: {
      icon: 'pi pi-paperclip',
      value: 'Add Response Header',
      severity: 'info'
    },
    filter_response_cookie: {
      icon: 'pi pi-filter',
      value: 'Filter Response Cookie',
      severity: 'info'
    },
    filter_response_header: {
      icon: 'pi pi-sliders-h',
      value: 'Filter Response Header',
      severity: 'info'
    },
    enable_gzip_response: {
      icon: 'pi pi-compress',
      value: 'Enable Gzip Response',
      severity: 'info'
    },
    redirect_to_301_response: {
      icon: 'pi pi-compass',
      value: 'Redirect to 301 Response',
      severity: 'info'
    },
    redirect_to_302_response: {
      icon: 'pi pi-arrow-up-right',
      value: 'Redirect to 302 Response',
      severity: 'info'
    },
    run_function_response: {
      icon: 'pi pi-server',
      value: 'Run Function Response',
      severity: 'info'
    },
    bypass_cache_phase: {
      icon: 'pi pi-fast-forward',
      value: 'Bypass Cache Phase',
      severity: 'info'
    }
  }

  const getBehaviorProps = (behavior) => {
    const propsInit = behaviorProps[behavior.name]
    return {
      ...propsInit,
      value: behavior.argument || propsInit.value
    }
  }
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <PrimeTag
      v-for="(behavior, index) in behaviors"
      :key="index"
      v-bind="getBehaviorProps(behavior)"
      class="mr-2"
    />
  </div>
</template>
