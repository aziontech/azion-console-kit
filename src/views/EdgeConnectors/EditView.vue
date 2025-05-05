<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit Edge Connectors"></PageHeadingBlock>
    </template>
    <template #content>
      <EditFormBlock
        :editService="editEdgeConnectorsService"
        :loadService="loadEdgeConnectorsService"
        :schema="validationSchema"
      >
        <template #form>
          <FormFieldsEdgeConnectors
            :schema="validationSchema"
            :resetForm="resetForm"
          />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarBlockWithTeleport
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </EditFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import ActionBarBlockWithTeleport from '@/templates/action-bar-block/action-bar-with-teleport.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsEdgeConnectors from './FormFields/FormFieldsEdgeConnectors.vue'
  import * as yup from 'yup'

  defineProps({
    editEdgeConnectorsService: {
      type: Function,
      required: true
    },
    loadEdgeConnectorsService: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    type: yup
      .string()
      .oneOf(['http', 's3', 'edge_storage', 'live_ingest'], 'Type is invalid')
      .required(),

    name: yup
      .string()
      .label('Name')
      .required()
      .test(
        'only-ascii',
        'Invalid characters. Use letters, numbers, and standard symbols, with no accents.',
        (value) => /^[\x20-\x21\x23-\x7E]+$/.test(value)
      ),

    loadBalancerEnabled: yup.boolean().required(),
    originShieldEnabled: yup.boolean().required(),

    addresses: yup
      .array()
      .of(
        yup.object({
          address: yup
            .string()
            .label('Address')
            .required('Address is required')
            .min(1, 'Address must be at least 1 character')
            .max(255, 'Address must be at most 255 characters'),

          plainPort: yup
            .number()
            .label('Plain Port')
            .integer('Plain Port must be an integer')
            .min(1, 'Plain Port must be ≥ 1')
            .max(65535, 'Plain Port must be ≤ 65535')
            .required('Plain Port is required'),

          tlsPort: yup
            .number()
            .label('TLS Port')
            .integer('TLS Port must be an integer')
            .min(1, 'TLS Port must be ≥ 1')
            .max(65535, 'TLS Port must be ≤ 65535')
            .required('TLS Port is required'),

          serverRole: yup
            .string()
            .label('Server Role')
            .oneOf(['primary', 'backup'], 'Server Role must be primary or backup')
            .required('Server Role is required'),

          weight: yup
            .number()
            .label('Weight')
            .integer('Weight must be an integer')
            .min(0, 'Weight must be ≥ 0')
            .max(100, 'Weight must be ≤ 100')
            .required('Weight is required'),

          active: yup.boolean().label('active').required(),

          maxConns: yup
            .number()
            .label('Max Connections')
            .integer('Max Connections must be an integer')
            .min(0, 'Max Connections must be ≥ 0')
            .max(1000, 'Max Connections must be ≤ 1000')
            .required('Max Connections is required'),

          maxFails: yup
            .number()
            .label('Max Fails')
            .integer('Max Fails must be an integer')
            .min(1, 'Max Fails must be ≥ 1')
            .max(10, 'Max Fails must be ≤ 10')
            .required('Max Fails is required'),

          failTimeout: yup
            .number()
            .label('Fail Timeout')
            .integer('Fail Timeout must be an integer')
            .min(0, 'Fail Timeout must be ≥ 0')
            .required('Fail Timeout is required')
        })
      )
      .min(1, 'At least one address entry is required')
      .required('Addresses is required'),

    tlsPolicy: yup.string().oneOf(['preserve', 'off', 'on'], 'TLS Policy is invalid'),

    loadBalanceMethod: yup
      .string()
      .oneOf(
        ['off', 'round_robin', 'least_connections', 'ip_hash'],
        'Load Balance Method is invalid'
      )
      .default('off')
      .required(),

    connectionPreference: yup
      .array()
      .of(yup.string().oneOf(['IPv6', 'IPv4'], 'Connection Preference is invalid'))
      .required(),

    connectionTimeout: yup.number().integer().min(0).required(),
    readWriteTimeout: yup.number().integer().min(0).required(),
    maxRetries: yup.number().integer().min(0).required(),

    active: yup.boolean().required(),

    typeProperties: yup.object({
      versions: yup.array().of(yup.string()).required(),
      host: yup.string().required(),
      path: yup.string().required(),
      followingRedirect: yup.boolean().required().default(true),
      realIpHeader: yup.string().required('Real Ip Header is a required field'),
      realPortHeader: yup.string().required('Real Port Header is a required field')
    })
  })
</script>
