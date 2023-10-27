const messageErrors = {
  ddress_conflicts_with_cname:
    'Can\'t configure Origin Address "{0}", because it is in use by a CNAME.',
  address_localhost_block: 'Can\'t configure Origin Address "{0}", because its use is not allowed.',
  broken_json:
    "Unfortunately an error occurred and we couldn't process the data sent through the form. Please, try again later.",
  bucket_not_found: '"{0}" is not a valid bucket.',
  cant_specify_port_with_preserve_protocol:
    "Can't specify Origin Address port when preserving protocol.",
  cname_already_in_use: 'CNAMEs already in use: {0}',
  cname_in_origin_address:
    'You can\'t use "{0}" as CNAME because it is already in an Origin Address.',
  cname_invalid_format: 'Invalid CNAME format: "{0}".',
  cname_invalid_tld:
    'It\'s not possible to use a CNAME which is an invalid top level domain: "{0}".',
  cname_overwrite_other_cnames:
    'The following CNAME(s) cannot be used, in order to avoid CNAMEs overwriting: {0}',
  cname_used_as_domain: 'You can\'t use "{0}" as CNAME because it is already used as Domain.',
  could_not_generate_domain_name:
    'It was not possible to generate a new Domain Name. Please, try again later or contact the support service.',
  custom_error_responses_requires_uri:
    "You can't set up a Custom Status Code without setting up an URI.",
  duplicated_domain_name: 'A Domain with the name "{0}" already exists.',
  related_domains_exceeded:
    'Domain limit exceeded. You cannot associate new domains with edge application {0}.',
  error_responses_in_use: 'The Error Responses set could not be deleted because it is being used.',
  error_responses_name_already_in_use: 'An Error Responses Set with the name "{0}" already exists.',
  function_instance_in_use: 'This function can not be deleted because it is being used.',
  function_name_already_in_use: 'A Function with the name "{0}" already exists.',
  invalid_account_edge_application:
    'In order to perform this action, you must first have access to "{0}"',
  invalid_browser_cache_settings_maximum_ttl:
    "You can't set up a value for \"Browser Cache Settings - 'Maximum TTL, when selecting the option Honor Origin 'Cache Header",
  invalid_cdn_cache_settings_maximum_ttl:
    'You can\'t set up a value for "CDN Cache Settings - Maximum TTL" when selecting the option "Honor Origin Cache Settings".',
  invalid_cname_access_only:
    'At least one valid CNAME is needed in order to enable "CNAME Access Only".',
  invalid_cnames_limit: 'You have exceeded the maximum limit of {0} CNAMEs.',
  invalid_edge_application: 'The Edge Application "{0}" is not valid',
  invalid_edge_function: 'The Edge Function "{0}" is not valid.',
  invalid_runtime_environment: 'The runtime environment "{0}" of Edge Function is not valid.',
  invalid_json: 'Unable to save the JSON Args with an invalid JSON.',
  invalid_host_header: 'You cannot use the Host Header "{0}", because it is invalid.',
  invalid_path: '"{0}" is not a valid path.',
  invalid_status_code: '"{0}" is not a valid status code.',
  edge_functions_disabled:
    'Enable Edge Functions on the Edge application before creating a new Edge Function',
  missing_address: 'The field "Address" is required',
  missing_browser_cache_settings_maximum_ttl:
    'When overriding the Browser Cache Settings, you must provide a value for "Maximum TTL".',
  missing_bucket: 'The field "Bucket" is required',
  missing_cdn_cache_settings_maximum_ttl:
    'When overriding the CDN Cache Settings: you must provide a value for "Maximum TTL".',
  invalid_cdn_cache_settings_maximum_ttl_without_application_acceleration:
    'TTL for CDN cache should be equal or higher than 60 seconds. To use a lower value, you need to subscribe Application Acceleration.',
  missing_status_code_any: 'The status code "any" is mandatory.',
  name_already_in_use: 'An Edge Application with the name "{0}" already exists.',
  not_valid_address: '"{0}" is not a valid address.',
  user_has_no_permission: 'You do not have permission to perform this action',
  user_has_no_product:
    'In order to perform this action, you must first have access to the product "{0}"',
  edge_application_already_in_use:
    "It's not possible to use an Edge Application which is already in use.",
  edge_application_has_some_product_using:
    'It was not possible to perform this operation. To disable "{0}", you must first remove all settings on this site that require it.',
  origin_missing_uri: 'You need at least one URI to set an Origin',
  uri_missing_origin: 'You need to set Origin if you set URIs',
  user_has_no_flag: 'You do not have permission to perform this action',
  debug_rules: "You don't have access to this feature",
  domain_not_deployed:
    "Remember to deploy your changes when you're done. Your changes won't take effect until you deploy it.",
  product_can_not_activate: 'The product "{0}" cannot be activated.',
  incorrect_tls_version: 'HTTP cannot have TLS version.',
  cannot_disable_l2:
    'It was not possible to perform this operation. To disable "L2 Caching", you must first change all Cache Settings on this Edge Application that uses it.',
  invalid_instance_json_args_max_size: 'JSON Args for "{0}" cannot be larger than "{1}" bytes.',
  invalid_origin_type: '"{0}" is not a valid origin type.',
  originless_cache_settings:
    "It's not possible to create Cache Settings for Originless Edge Application",
  delete_edge_application_disabled: 'Delete Edge Application is disabled for your account.',
  enable_caching_for_post: '{0}',
  enable_caching_for_options: '{0}',
  cannot_update_environment: "It's not possible to update the domain environment.",
  disable_actions_domains: 'Domains actions are temporarily blocked for your account.',
  ipv6_not_enabled: 'IPv6 is not enabled for your account.',
  browser_cache_settings: '{0}',
  cdn_cache_settings_maximum_ttl: 'Ensure this value is greater than or equal to {0}.',
  invalid_trusted_ca_certificate: '{0}',
  invalid_edge_certificate: '{0}',
  invalid_account_for_trusted_ca_certificate: '{0}',
  invalid_account_for_edge_certificate: '{0}',
  mtls_authentication: '{0}',
  enable_stale_cache: '{0}',
  cannot_use_cnames: 'This account is not allowed to use the following CNAMEs: {0}',
  http_port: '{0}',
  https_port: '{0}',
  http3: '{0}',
  digital_certificate_id: '{0}',
  disable_update_actions: '{0}',
  tls_ciphers_not_allowed: 'Ciphers only can be used in applications with an SSL/TLS encryption.',
  cnames_managed_certificate: '{0}',
  cannot_create_same_edge_application:
    'It is not possible to create multiple Edge Applications at the same time',
  detail: '{0}'
}

const replaceErrorMsg = (key, value = '') => {
  const error = messageErrors[key]

  return value ? error.replace('{0}', value) : error
}

const getMsgError = (httpResponse) => {
  const keys = Object.keys(httpResponse.body)
  const firstPropertyOfError = keys[0]
  let message = ''
  if (httpResponse.body[firstPropertyOfError] instanceof Array) {
    message = httpResponse.body[firstPropertyOfError][0]
  } else {
    message = httpResponse.body[firstPropertyOfError]
  }
  return replaceErrorMsg(firstPropertyOfError, message)
}

export default getMsgError
