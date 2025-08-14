# Advanced Filter System

Sistema completo de filtros estilo Elastic Observability com busca, datas e filtros avançados, construído com Vue 3 e PrimeVue, seguindo o tema Azion.

## 🎯 Visão Geral

O Advanced Filter System é um sistema modular de filtros que replica a funcionalidade do Elastic Observability, composto por 4 componentes principais que se comunicam através de um componente pai:

- **AdvancedFilterSystem** - Componente pai que orquestra todos os filtros
- **AdvancedCalendar** - Seletor de datas avançado
- **AdvancedInput** - Campo de busca com funcionalidades avançadas
- **AdvancedFilter** - Sistema de filtros condicionais

## 🎨 Design System

O sistema foi projetado seguindo o **tema Azion** com:

- **Cores consistentes** com a identidade visual da Azion
- **Espaçamentos harmoniosos** usando o sistema de design
- **Animações suaves** para melhor experiência do usuário
- **Responsividade completa** para todos os dispositivos
- **Acessibilidade** seguindo as melhores práticas
- **Estados visuais** claros (hover, focus, loading, error, success)
- **Tailwind CSS** para estilização completa sem CSS customizado

### Tailwind CSS

O sistema utiliza **100% Tailwind CSS** para estilização, eliminando a necessidade de arquivos CSS customizados:

- **Classes utilitárias** para todos os estilos
- **Responsividade** com breakpoints do Tailwind
- **Estados interativos** (hover, focus, active) com classes Tailwind
- **Animações** usando `transition-*` e `duration-*`
- **Cores do tema Azion** através de variáveis CSS customizadas
- **Consistência visual** mantida através do sistema de design

### Vantagens do Tailwind CSS

✅ **Zero CSS customizado** - Tudo é feito com classes utilitárias
✅ **Performance otimizada** - Apenas as classes usadas são incluídas no bundle
✅ **Manutenibilidade** - Mudanças de estilo são feitas diretamente no template
✅ **Consistência** - Sistema de design padronizado
✅ **Responsividade** - Breakpoints integrados
✅ **Tema dinâmico** - Suporte a modo escuro/claro através de variáveis CSS



### Arquivos de Design

```
advanced-filter-system/
├── index.vue                                    # Componente pai principal
├── components/
│   ├── AdvancedCalendar.vue                    # Seletor de datas
│   ├── AdvancedInput.vue                       # Campo de busca
│   └── AdvancedFilter.vue                      # Sistema de filtros
├── utils/
│   └── dateUtils.js                            # Utilitários de data
└── README.md                                   # Esta documentação
```

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
advanced-filter-system/
├── index.vue                                    # Componente pai principal
├── components/
│   ├── AdvancedCalendar.vue                    # Seletor de datas
│   ├── AdvancedInput.vue                       # Campo de busca
│   └── AdvancedFilter.vue                      # Sistema de filtros
├── utils/
│   └── dateUtils.js                            # Utilitários de data
└── README.md                                   # Esta documentação
```

### Comunicação entre Componentes

```
AdvancedFilterSystem (Pai)
├── AdvancedInput (Busca)
├── AdvancedCalendar (Datas)
└── AdvancedFilter (Filtros condicionais)
```

## 🚀 Funcionalidades

### Vue 3 defineModel

O sistema utiliza o **defineModel** do Vue 3 para comunicação entre componentes:

- ✅ **Sintaxe moderna** - Uso do defineModel em vez de defineProps/defineEmits
- ✅ **Código mais limpo** - Menos boilerplate para v-model
- ✅ **Type safety** - Melhor suporte a TypeScript
- ✅ **Performance** - Otimizações internas do Vue 3

### 1. AdvancedFilterSystem (Componente Pai)

**Responsabilidades:**
- Orquestra todos os componentes filhos
- Gerencia o estado global dos filtros
- Emite eventos para o componente pai
- Controla o overlay de filtros

**Props:**
```javascript
{
  modelValue: {
    searchQuery: string,
    dateRange: { startDate: Date, endDate: Date },
    filters: Array
  }
}
```

**Events:**
- `update:modelValue` - Atualização do estado
- `search` - Busca executada
- `dateChange` - Mudança de data
- `filterChange` - Mudança de filtros
- `update` - Atualização geral

### 2. AdvancedCalendar

**Funcionalidades:**
- ✅ Seleção de datas absolutas e relativas
- ✅ Sistema de abreviações (Today, Last 7 days, etc.)
- ✅ Edição direta de campos de data
- ✅ Histórico de datas recentes
- ✅ Formato 24 horas (sem AM/PM)
- ✅ Navegação por mês/ano
- ✅ Seleção de horário

**Formato de Data:**
- **Formato padrão**: `DD/MM/YYYY HH:mm` (24 horas)
- **Formato com segundos**: `DD/MM/YYYY HH:mm:ss`
- **Sem AM/PM**: Todas as horas são exibidas no formato 24 horas
- **Consistência**: Formato uniforme em todo o sistema
- ✅ Modo "Now" para data atual

**Props:**
```javascript
{
  modelValue: {
    startDate: Date,
    endDate: Date
  }
}
```

### 3. AdvancedInput

**Funcionalidades:**
- ✅ Campo de busca com ícone
- ✅ Botão de limpar
- ✅ Suporte a Enter para buscar
- ✅ Placeholder customizável
- ✅ Ícone customizável

**Props:**
```javascript
{
  modelValue: string,
  placeholder: string,
  icon: string
}
```

### 4. AdvancedFilter

**Funcionalidades:**
- ✅ Múltiplos filtros condicionais
- ✅ Operadores lógicos (AND/OR)
- ✅ Campos dinâmicos baseados no tipo
- ✅ Preview em tempo real
- ✅ Label customizável
- ✅ Adicionar/remover filtros
- ✅ Validação de campos

**Props:**
```javascript
{
  modelValue: Array<Filter>
}
```

## 📦 Instalação e Uso

### 1. Importar o Componente

```vue
<script setup>
import AdvancedFilterSystem from '@/templates/advanced-filter-system/index.vue'
```

### 2. Integração com Métricas em Tempo Real

O sistema está integrado ao módulo de métricas em tempo real:

```vue
<script setup>
import { AdvancedFilterSystem } from '@/modules/real-time-metrics'
```

**Arquivos de integração:**
- `src/modules/real-time-metrics/components/AdvancedFilterSystem.vue` - Componente integrado
- `src/modules/real-time-metrics/pages/MetricsPage.vue` - Página de exemplo
- `src/modules/real-time-metrics/index.js` - Exportação do módulo
</script>
```

### 2. Usar no Template

```vue
<template>
  <AdvancedFilterSystem
    v-model="filterState"
    @search="handleSearch"
    @dateChange="handleDateChange"
    @filterChange="handleFilterChange"
    @update="handleUpdate"
  />
</template>
```

### 3. Configurar o Estado

```javascript
const filterState = ref({
  searchQuery: '',
  dateRange: {
    startDate: new Date(),
    endDate: new Date()
  },
  filters: []
})
```

## 🎨 Personalização

### Campos Disponíveis

O componente `AdvancedFilter` suporta os seguintes campos:

```javascript
const availableFields = [
  { label: 'Alert Name', value: 'alert.name' },
  { label: 'Alert Status', value: 'alert.status' },
  { label: 'Alert Severity', value: 'alert.severity' },
  { label: 'Alert Type', value: 'alert.type' },
  { label: 'Host Name', value: 'host.name' },
  { label: 'Service Name', value: 'service.name' },
  { label: 'Message', value: 'message' },
  { label: 'Source', value: 'source' },
  { label: 'Tags', value: 'tags' },
  { label: 'Environment', value: 'environment' }
]
```

### Operadores por Tipo

**Texto:**
- is, is not, contains, does not contain, starts with, ends with

**Número:**
- is, is not, is greater than, is less than, is greater than or equal to, is less than or equal to

**Booleano:**
- is, is not

## 🔧 Utilitários

### dateUtils.js

Funções utilitárias para manipulação de datas:

- `getTimeInMs(value, unit)` - Converte valor e unidade para milissegundos
- `calculateRelativeDate(referenceDate, value, unit, direction)` - Calcula data relativa
- `createRelativeRange(value, unit, direction, referenceDate)` - Cria intervalo relativo
- `createStartOfDay(date)` - Cria data no início do dia
- `createEndOfDay(date)` - Cria data no final do dia
- `createWeekRange(date)` - Cria intervalo da semana
- `isValidDate(date)` - Valida se data é válida
- `formatDateTime(date, short, options)` - Formata data para exibição

## 📱 Responsividade

O sistema é totalmente responsivo e se adapta a diferentes tamanhos de tela:

- **Desktop:** Layout horizontal com todos os componentes visíveis
- **Tablet:** Layout adaptativo com componentes empilhados
- **Mobile:** Layout vertical otimizado para toque

## 🎯 Exemplo de Uso Completo

```vue
<template>
  <div class="filter-dashboard">
    <AdvancedFilterSystem
      v-model="filterState"
      @search="handleSearch"
      @dateChange="handleDateChange"
      @filterChange="handleFilterChange"
      @update="handleUpdate"
    />
    
    <!-- Exibir resultados -->
    <div class="results">
      <h3>Resultados da Busca:</h3>
      <p>Query: {{ filterState.searchQuery }}</p>
      <p>Data: {{ formatDate(filterState.dateRange.startDate) }} → {{ formatDate(filterState.dateRange.endDate) }}</p>
      <p>Filtros: {{ filterState.filters.length }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AdvancedFilterSystem from '@/templates/advanced-filter-system/index.vue'

const filterState = ref({
  searchQuery: '',
  dateRange: {
    startDate: new Date(Date.now() - 15 * 60 * 1000),
    endDate: new Date()
  },
  filters: []
})

const handleSearch = (query) => {
  console.log('Busca:', query)
  // Implementar lógica de busca
}

const handleDateChange = (range) => {
  console.log('Mudança de data:', range)
  // Implementar lógica de mudança de data
}

const handleFilterChange = (filters) => {
  console.log('Mudança de filtros:', filters)
  // Implementar lógica de filtros
}

const handleUpdate = (state) => {
  console.log('Estado atualizado:', state)
  // Implementar lógica de atualização
}

const formatDate = (date) => {
  return new Date(date).toLocaleString()
}
</script>
```

## 🚀 Benefícios

- ✅ **Modularidade** - Componentes independentes e reutilizáveis
- ✅ **Flexibilidade** - Fácil personalização e extensão
- ✅ **Performance** - Otimizado para grandes volumes de dados
- ✅ **UX/UI** - Interface intuitiva e responsiva
- ✅ **Manutenibilidade** - Código limpo e bem documentado
- ✅ **Compatibilidade** - Vue 3 + PrimeVue 3.35.0+
- ✅ **Design System** - Seguindo o tema Azion
- ✅ **Acessibilidade** - Melhores práticas de acessibilidade
- ✅ **Animações** - Transições suaves e profissionais

## 🔮 Roadmap

- [ ] Suporte a Query DSL
- [ ] Filtros salvos/favoritos
- [ ] Exportação/importação de filtros
- [ ] Temas customizáveis
- [ ] Integração com APIs externas
- [ ] Suporte a múltiplos idiomas
- [ ] Modo escuro/claro automático
- [ ] Animações mais avançadas
- [ ] Testes de acessibilidade automatizados
