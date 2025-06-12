<script setup>
  import { computed, watch, nextTick, ref } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import * as yup from 'yup'
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import Tag from 'primevue/tag'

  import * as EdgeSQLService from '@/services/edge-sql-services'
  import { useRoute } from 'vue-router'

  defineOptions({
    name: 'row-form-drawer'
  })

  const emit = defineEmits(['onSuccess', 'update:visible'])
  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    columns: {
      type: Array,
      default: () => []
    },
    columnInfo: {
      type: Array,
      default: () => []
    },
    tableName: {
      type: String,
      default: ''
    },
    initialData: {
      type: Object,
      default: () => ({})
    },
    isEditing: {
      type: Boolean,
      default: false
    },
    focusField: {
      type: String,
      default: ''
    }
  })

  const toast = useToast()
  const createDrawerRef = ref(null)
  const editDrawerRef = ref(null)
  const route = useRoute()
  const databaseId = computed(() => route.params.id)

  // Criar schema de validação dinâmico baseado nas colunas
  const validationSchema = computed(() => {
    const schema = {}
    props.columns.forEach(column => {
      schema[column] = yup.string().label(column)
    })
    return yup.object(schema)
  })

  // Valores iniciais baseados nas colunas
  const initialValues = computed(() => {
    const values = {}
    props.columns.forEach(column => {
      // Usar cópia do valor para evitar referências compartilhadas
      const value = props.initialData[column]
      values[column] = value !== undefined && value !== null ? String(value) : ''
    })
    return values
  })

  const title = computed(() => {
    return props.isEditing ? 'Edit Row' : 'Insert New Row'
  })

  // Key única para EditDrawerBlock para forçar re-render com dados novos
  const editDrawerKey = computed(() => {
    if (!props.isEditing) return 'edit'
    const dataString = JSON.stringify(props.initialData)
    return `edit-${dataString.substring(0, 20)}-${Date.now().toString().slice(-6)}`
  })

  // Utilitárieas para construir queries SQL
  const escapeValue = (value, columnType) => {
    if (value === null || value === undefined || value === '') {
      return 'NULL'
    }
    
    const strValue = value.toString().trim()
    
    // Para tipos numéricos, não colocar aspas se for um número válido
    if (columnType && (columnType.toUpperCase().includes('INTEGER') || 
                      columnType.toUpperCase().includes('REAL') || 
                      columnType.toUpperCase().includes('NUMERIC'))) {
      // Verificar se é um número válido
      if (!isNaN(strValue) && strValue !== '') {
        return strValue
      }
    }
    
    // Para outros tipos, escapar aspas simples e colocar entre aspas
    return `'${strValue.replace(/'/g, "''")}'`
  }

  const buildInsertQuery = (tableName, columns, formData) => {
    // Filtrar apenas colunas que têm valores
    const columnsWithValues = columns.filter(col => 
      formData[col] !== undefined && 
      formData[col] !== null && 
      formData[col] !== ''
    )
    
    if (columnsWithValues.length === 0) {
      throw new Error('No values provided for insert')
    }
    
    const columnNames = columnsWithValues.join(', ')
    const values = columnsWithValues.map(col => escapeValue(formData[col], getColumnType(col))).join(', ')
    return `INSERT INTO ${tableName} (${columnNames}) VALUES (${values});`
  }

  const buildUpdateQuery = (tableName, changedData, whereCondition) => {
    // Incluir apenas os campos que realmente mudaram
    const setClause = Object.keys(changedData).map(col => 
      `${col} = ${escapeValue(changedData[col], getColumnType(col))}`
    ).join(', ')
    return `UPDATE ${tableName} SET ${setClause} WHERE ${whereCondition};`
  }

  const buildWhereCondition = (formData, columnInfo) => {
    const whereConditions = []
    
    // Encontrar colunas de chave primária
    const primaryKeys = columnInfo.filter(col => col[5] === 1) // col[5] é o campo pk
    
    // Verificar se temos chaves primárias com valores não-nulos
    let usePrimaryKeys = false
    if (primaryKeys.length > 0) {
      primaryKeys.forEach(col => {
        const columnName = col[1]
        const columnType = col[2]
        const value = formData[columnName]
        
        if (value !== undefined && value !== null && value !== '') {
          const escapedValue = escapeValue(value, columnType)
          whereConditions.push(`${columnName} = ${escapedValue}`)
          usePrimaryKeys = true
        }
      })
    }
    
    // Se não temos PKs válidas, usar todas as colunas não-nulas
    if (!usePrimaryKeys) {
      Object.keys(formData).forEach(columnName => {
        const value = formData[columnName]
        if (value !== undefined && value !== null && value !== '') {
          const columnType = getColumnType(columnName)
          const escapedValue = escapeValue(value, columnType)
          whereConditions.push(`${columnName} = ${escapedValue}`)
        }
      })
    }
    
    if (whereConditions.length === 0) {
      throw new Error('Cannot build WHERE condition: no valid conditions found')
    }
    
    return whereConditions.join(' AND ')
  }

  // Serviços reais que executam SQL
  const realCreateService = async (formData) => {
    try {
      if (!props.tableName) {
        throw new Error('Table name is required')
      }
      
      // Filtrar campos vazios se necessário
      const cleanFormData = {}
      Object.keys(formData).forEach(key => {
        if (formData[key] !== undefined && formData[key] !== null && formData[key] !== '') {
          cleanFormData[key] = formData[key]
        }
      })
      
      const query = buildInsertQuery(props.tableName, props.columns, cleanFormData)
      
      const result = await EdgeSQLService.executeDatabaseService({
        databaseId: databaseId.value,
        statements: [query]
      })

      if (result.statusCode === 200) {
        return {
          feedback: 'Row inserted successfully',
          data: cleanFormData
        }
      } else {
        throw new Error(result.error || 'Failed to insert row')
      }
    } catch (error) {
      throw new Error(`Insert failed: ${error.message}`)
    }
  }

  const realEditService = async (formData) => {
    try {
      if (!props.tableName) {
        throw new Error('Table name is required')
      }
      
      // Usar dados originais para WHERE condition
      const originalData = props.initialData
      const whereCondition = buildWhereCondition(originalData, props.columnInfo)
      
      // Identificar apenas os campos que mudaram
      const changedData = {}
      props.columns.forEach(column => {
        const originalValue = originalData[column] || ''
        const newValue = formData[column] || ''
        
        // Só incluir no UPDATE se o valor realmente mudou
        if (originalValue !== newValue) {
          changedData[column] = newValue
        }
      })
      
      // Se nenhum campo mudou, não fazer update
      if (Object.keys(changedData).length === 0) {
        return 'No changes detected'
      }
      
      const query = buildUpdateQuery(props.tableName, changedData, whereCondition)
      
      const result = await EdgeSQLService.executeDatabaseService({
        databaseId: databaseId.value,
        statements: [query]
      })

      if (result.statusCode === 200) {
        return `Successfully updated ${Object.keys(changedData).length} field(s)`
      } else {
        throw new Error(result.error || 'Failed to update row')
      }
    } catch (error) {
      throw new Error(`Update failed: ${error.message}`)
    }
  }

  // Load service para EditDrawerBlock - retorna os dados iniciais
  const realLoadService = async () => {
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Retornar uma cópia limpa dos dados iniciais
    const loadedData = {}
    props.columns.forEach(column => {
      const value = props.initialData[column]
      loadedData[column] = value !== undefined && value !== null ? String(value) : ''
    })
    
    return loadedData
  }

  // Handlers para sucesso e erro
  const handleSuccess = (response) => {
    // Emitir sucesso para o componente pai
    emit('onSuccess', response)
    
    // Fechar o drawer após sucesso
    emit('update:visible', false)
  }

  const handleError = (error) => {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'An error occurred',
      life: 5000
    })
  }

  // Funções utilitárias para obter informações das colunas
  const getColumnInfo = (columnName) => {
    return props.columnInfo.find(col => col[1] === columnName) || []
  }

  const getColumnType = (columnName) => {
    const info = getColumnInfo(columnName)
    return info[2] || null
  }

  const getColumnConstraints = (columnName) => {
    const info = getColumnInfo(columnName)
    const constraints = []
    
    if (info[3]) constraints.push({ value: 'NOT NULL', severity: 'warning' })
    if (info[5]) constraints.push({ value: 'PRIMARY KEY', severity: 'info' })
    if (info[4]) constraints.push({ value: 'DEFAULT', severity: 'secondary' })
    
    return constraints
  }

  const getEnhancedLabel = (columnName) => {
    const type = getColumnType(columnName)
    return type ? `${columnName} (${type})` : columnName
  }

  const getFieldDescription = (columnName) => {
    const info = getColumnInfo(columnName)
    if (!info.length) return `Enter ${columnName} value`
    
    let description = `Column: ${columnName}`
    if (info[4]) description += ` - Default: ${info[4]}`
    
    return description
  }



  // Focus no campo específico ou primeiro campo quando o drawer abrir
  watch(() => [props.visible, props.focusField], async ([newVisible, focusField]) => {
    if (newVisible && props.columns.length > 0) {
      await nextTick()
      // Aguardar um pouco mais para garantir que o drawer está totalmente renderizado
      setTimeout(() => {
        let targetField = null
        
        // Se um campo específico foi solicitado, tentar focá-lo
        if (focusField) {
          const fieldIndex = props.columns.indexOf(focusField)
          if (fieldIndex >= 0) {
            targetField = document.querySelector(`[data-testid="row-form__field-${fieldIndex}"] input`)
          }
        }
        
        // Se não encontrou o campo específico, focar no primeiro
        if (!targetField) {
          targetField = document.querySelector(`[data-testid="row-form__field-0"] input`)
        }
        
        if (targetField) {
          targetField.focus()
          // Se for um input de texto, selecionar todo o conteúdo
          if (targetField.tagName === 'INPUT' && targetField.type === 'text') {
            targetField.select()
          }
        }
      }, 500) // Aumentei o timeout para EditDrawerBlock que pode demorar mais para carregar
    }
  })

  // Watch para acompanhar mudanças nos dados iniciais
  watch(
    () => props.initialData,
    () => {
      // Os dados são automaticamente atualizados via computed initialValues
      // Não precisamos fazer nada manual aqui
    },
    { deep: true, immediate: true }
  )
</script>

<template>
  <!-- Create Mode -->
  <CreateDrawerBlock
    v-if="!isEditing"
    ref="createDrawerRef"
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :createService="realCreateService"
    :title="title"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleSuccess"
    @onError="handleError"
  >
    <template #formFields="{ disabledFields }">
      <FormHorizontal
        title="Row Data"
        description="Fill in the column values for this table row."
        :isDrawer="true"
      >
        <template #inputs>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div 
              v-for="(column, index) in columns" 
              :key="column"
              class="flex flex-col gap-2"
            >
              <!-- Input Field with enhanced label -->
              <FieldText
                :label="getEnhancedLabel(column)"
                :name="column"
                :placeholder="`Enter ${column} value`"
                :disabled="disabledFields"
                :description="getFieldDescription(column)"
                :data-testid="`row-form__field-${index}`"
                :data-field="column"
              />
              
              <!-- Column Constraints -->
              <div v-if="getColumnConstraints(column).length > 0" class="flex gap-1 flex-wrap mt-1">
                <Tag 
                  v-for="constraint in getColumnConstraints(column)"
                  :key="constraint.value"
                  :value="constraint.value" 
                  :severity="constraint.severity" 
                  class="text-xs" 
                  style="font-size: 0.65rem; padding: 0.125rem 0.25rem;" 
                />
              </div>
              
            </div>
          </div>
        </template>
      </FormHorizontal>
    </template>
  </CreateDrawerBlock>

  <!-- Edit Mode -->
  <EditDrawerBlock
    v-else
    :key="editDrawerKey"
    id="edit-row"
    ref="editDrawerRef"
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :loadService="realLoadService"
    :editService="realEditService"
    :title="title"
    :schema="validationSchema"
    @onSuccess="handleSuccess"
    @onError="handleError"
  >
    <template #formFields="{ disabledFields }">
      <FormHorizontal
        title="Row Data"
        description="Fill in the column values for this table row."
        :isDrawer="true"
      >
        <template #inputs>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div 
              v-for="(column, index) in columns" 
              :key="column"
              class="flex flex-col gap-2"
            >
              <!-- Input Field with enhanced label -->
              <FieldText
                :label="getEnhancedLabel(column)"
                :name="column"
                :placeholder="`Enter ${column} value`"
                :disabled="disabledFields"
                :description="getFieldDescription(column)"
                :data-testid="`row-form__field-${index}`"
                :data-field="column"
              />
              
              <!-- Column Constraints -->
              <div v-if="getColumnConstraints(column).length > 0" class="flex gap-1 flex-wrap mt-1">
                <Tag 
                  v-for="constraint in getColumnConstraints(column)"
                  :key="constraint.value"
                  :value="constraint.value" 
                  :severity="constraint.severity" 
                  class="text-xs" 
                  style="font-size: 0.65rem; padding: 0.125rem 0.25rem;" 
                />
              </div>
              
            </div>
          </div>
        </template>
      </FormHorizontal>
    </template>
  </EditDrawerBlock>
</template>

