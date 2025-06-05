<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Edge Connectors" />
    </template>
    <template #content>
      <CreateFormBlock
        :createService="edgeConnectorsService.createEdgeConnectorsService"
        :schema="validationSchema"
        :initialValues="initialValues"
      >
        <template #form="{ resetForm }">
          <FormFieldsEdgeConnectors
            :initialValues="initialValues"
            :schema="validationSchema"
            :resetForm="resetForm"
          />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarTemplate
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsEdgeConnectors from './FormFields/FormFieldsEdgeConnectors.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import * as yup from 'yup'
  import { edgeConnectorsService } from '@/services/v2'

  const initialValues = {
    type: 'http',
    name: '',

    loadBalancerEnabled: true,
    originShieldEnabled: true,
    addresses: [],
    tlsPolicy: 'preserve',
    loadBalanceMethod: 'off',
    connectionPreference: ['IPv6', 'IPv4'],
    connectionTimeout: 60,
    readWriteTimeout: 120,
    maxRetries: 1,
    status: true,
    http: {
      versions: ['http1'],
      host: '',
      path: '',
      followingRedirect: true,
      realIpHeader: '',
      realPortHeader: ''
    },
    s3: {
      host: '',
      bucket: '',
      path: '',
      region: '',
      accessKey: '',
      secretKey: ''
    },
    edgeStorage: {
      bucket: '',
      prefix: ''
    },
    liveIngestEndpoint: ''
  }

  const validationSchema = yup.object({
    type: yup
      .string()
      .oneOf(['http', 's3', 'edge_storage', 'live_ingest'], 'Type is invalid')
      .required(),

    // http
    http: yup.object().when('type', {
      is: 'http',
      then: () =>
        yup.object({
          versions: yup.array().of(yup.string()),
          host: yup.string().required('Host is a required field'),
          path: yup.string().required('Path is a required field'),
          followingRedirect: yup.boolean().required('Following Redirect is a required field'),
          realIpHeader: yup.string().required('Real Ip Header is a required field'),
          realPortHeader: yup.string().required('Real Port Header is a required field')
        }),
      otherwise: () => yup.object().notRequired()
    }),

    // s3
    s3: yup.object().when('type', {
      is: 's3',
      then: () =>
        yup.object({
          host: yup.string().required('Host is a required field'),
          bucket: yup.string().required('Bucket is a required field'),
          path: yup.string().required('Path is a required field'),
          region: yup.string().required('Region is a required field'),
          accessKey: yup
            .string()
            .matches(/^\$\{env\.[A-Z0-9_]+\}$|^.{1,256}$/, 'Deve ser literal ou ENV var')
            .required('Access Key is a required field'),
          secretKey: yup
            .string()
            .matches(/^\$\{env\.[A-Z0-9_]+\}$|^.{1,256}$/, 'Deve ser literal ou ENV var')
            .required('Secret Key is a required field')
        }),
      otherwise: () => yup.object().notRequired()
    }),

    // edge_storage
    edgeStorage: yup.object().when('type', {
      is: 'edge_storage',
      then: () =>
        yup.object({
          bucket: yup.string().required('Bucket is a required field'),
          prefix: yup.string().required('Prefix is a required field')
        }),
      otherwise: () => yup.object().notRequired()
    }),

    // live_ingest
    liveIngestEndpoint: yup.string().when('type', {
      is: 'live_ingest',
      then: (schema) => schema.required('Endpoint is a required field')
    }),

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

    addresses: yup.array().when('type', {
      is: (val) => ['live_ingest', 'edge_storage'].includes(val),
      then: () => yup.array().notRequired(),
      otherwise: () =>
        yup.array().of(
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

            active: yup.boolean().label('active'),

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
    }),

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

    connectionTimeout: yup.number().integer().min(1).required('Connection Timeout is required'),
    readWriteTimeout: yup.number().integer().min(1).required('Read Write Timeout is required'),
    maxRetries: yup.number().integer().min(1).required('Max Retries is required'),

    status: yup.boolean().required()
  })
</script>
