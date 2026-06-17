// src/services/v2/environment/environment-mock.js

import { formatDateToDayMonthYearHour } from '@/helpers/convert-date'

// Helper to format status for display
const formatStatus = (status) => {
  return status === 'active'
    ? { content: 'Active', severity: 'success' }
    : { content: 'Inactive', severity: 'danger' }
}

// Helper to parse status from form data
const parseStatus = (status) => {
  if (typeof status === 'string') {
    return status
  }
  return status?.content?.toLowerCase() === 'active' ? 'active' : 'inactive'
}

// Helper to format configuration for display
const formatConfiguration = (config) => {
  return config === 'versioned_urls'
    ? { content: 'Versioned URLs', severity: 'info' }
    : { content: 'Single Version', severity: 'secondary' }
}

// Helper to parse configuration from form data
const parseConfiguration = (config) => {
  if (typeof config === 'string') {
    return config
  }
  return config?.content?.toLowerCase().includes('versioned') ? 'versioned_urls' : 'single_version'
}

// Helper to get current timestamp
const getCurrentTimestamp = () => {
  return new Date().toISOString()
}

let environments = [
  {
    id: '1',
    name: 'production',
    status: formatStatus('active'),
    configuration: formatConfiguration('single_version'),
    url: 'console.azion.com',
    lastEditor: 'guilherme.santana@azion.com',
    lastModified: formatDateToDayMonthYearHour(getCurrentTimestamp())
  },
  {
    id: '2',
    name: 'staging',
    status: formatStatus('active'),
    configuration: formatConfiguration('versioned_urls'),
    url: '*.azion.com',
    lastEditor: 'guilherme.santana@azion.com',
    lastModified: formatDateToDayMonthYearHour(getCurrentTimestamp())
  }
]

let nextId = 3

const simulateDelay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

export const listEnvironmentsService = async () => {
  await simulateDelay()
  return {
    data: environments,
    total: environments.length
  }
}

export const createEnvironmentService = async (data) => {
  await simulateDelay()
  const timestamp = getCurrentTimestamp()
  const newEnvironment = {
    id: String(nextId++),
    name: data.name,
    status: formatStatus(parseStatus(data.status) || 'active'),
    configuration: formatConfiguration(parseConfiguration(data.configuration) || 'single_version'),
    lastEditor: data.lastEditor || 'guilherme.santana@azion.com',
    lastModified: formatDateToDayMonthYearHour(timestamp)
  }
  environments.push(newEnvironment)
  return { data: newEnvironment }
}

export const updateEnvironmentService = async (id, data) => {
  await simulateDelay()
  const index = environments.findIndex((env) => env.id === id)
  if (index === -1) {
    throw new Error('Environment not found')
  }
  const timestamp = getCurrentTimestamp()
  environments[index] = {
    ...environments[index],
    name: data.name,
    status: formatStatus(parseStatus(data.status)),
    configuration: formatConfiguration(parseConfiguration(data.configuration)),
    lastEditor: data.lastEditor || 'guilherme.santana@azion.com',
    lastModified: formatDateToDayMonthYearHour(timestamp)
  }
  return { data: environments[index] }
}

export const deleteEnvironmentService = async (id) => {
  await simulateDelay()
  const index = environments.findIndex((env) => env.id === id)
  if (index === -1) {
    throw new Error('Environment not found')
  }
  environments.splice(index, 1)
  return { success: true }
}

export const getEnvironmentByIdService = async (id) => {
  await simulateDelay()
  const environment = environments.find((env) => env.id === id)
  if (!environment) {
    throw new Error('Environment not found')
  }
  return { data: environment }
}
