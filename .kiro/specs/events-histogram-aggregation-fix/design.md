# Correção do Bug de Agregação do Histograma de Eventos — Design

## Visão Geral

A função `loadBucketedEventsAggregation` gera N sub-queries aliasadas (ex: 48 para "Today") em uma única requisição GraphQL, excedendo o limite de complexidade da Events API (`v4/events/graphql`). Além disso, a falha na agregação está acoplada à listagem de documentos via `Promise.all`, fazendo com que a tabela de eventos também falhe.

A correção consiste em substituir a abordagem de sub-queries aliasadas por uma query única com `groupBy: [ts]`, `aggregate: { count: rows }` e `orderBy: [ts_ASC]` — replicando exatamente o padrão do Real-Time Metrics. Os intervalos de tempo sem dados serão preenchidos com zeros usando lógica de resampling equivalente ao `FillResultQuery`. A chamada de agregação do gráfico será desacoplada do `Promise.all` para isolar falhas.

## Glossário

- **Bug_Condition (C)**: A condição que dispara o bug — quando o intervalo de tempo gera sub-queries aliasadas suficientes para exceder o limite de complexidade da API GraphQL
- **Property (P)**: O comportamento desejado — uma única query GraphQL com `groupBy: [ts]` retorna dados de agregação para o intervalo completo, com resampling para preencher lacunas
- **Preservation**: Comportamentos existentes que devem permanecer inalterados — filtros, brush-select, click-to-filter, aparência visual do histograma, paginação da tabela
- **loadBucketedEventsAggregation**: Função em `src/services/real-time-events-service/load-events-aggregation.js` que constrói N sub-queries aliasadas por bucket de tempo
- **FillResultQuery**: Função em `src/modules/real-time-metrics/reports/fill-result-query.js` que preenche lacunas temporais com zeros usando resampling (minuto/hora/dia)
- **convertGQLAggregation**: Helper em `src/helpers/convert-gql-aggregation.js` que já suporta construção de query única com `groupBy`, `aggregate` e `orderBy`
- **GqlRules**: Classe em `src/modules/real-time-metrics/reports/convert-report-meta-to-gql.js` que o Real-Time Metrics usa para construir queries GraphQL — padrão de referência

## Detalhes do Bug

### Condição do Bug

O bug se manifesta quando o intervalo de tempo selecionado gera um número de buckets que, ao ser convertido em sub-queries aliasadas com 2 variáveis DateTime cada, excede o limite de complexidade da Events API. A função `loadBucketedEventsAggregation` constrói uma query com `bucketCount` aliases, cada um com suas próprias variáveis `$b{idx}s` e `$b{idx}e`, resultando em `2 * bucketCount` variáveis DateTime na query.

**Especificação Formal:**
```
FUNCTION isBugCondition(input)
  INPUT: input de tipo { tsRange: { tsRangeBegin, tsRangeEnd }, dataset: string }
  OUTPUT: boolean

  duration := tsRangeEnd - tsRangeBegin
  bucketCount := calculateHistogramBuckets(duration)
  totalVariables := 2 * bucketCount + filterVariables

  RETURN bucketCount > 1
         AND totalVariables > API_COMPLEXITY_LIMIT
         AND queryUsesAliasedSubQueries(bucketCount)
END FUNCTION
```

### Exemplos

- **Today (24h)**: `duration = 86400000ms` → `bucketCount = 48` → 48 aliases com 96 variáveis DateTime → **ERRO**: "The query has reached a system limit"
- **Last 7 Days**: `duration = 604800000ms` → `bucketCount = 42` → 42 aliases com 84 variáveis DateTime → **ERRO**: excede limite de complexidade
- **Last 30 Days**: `duration = 2592000000ms` → `bucketCount = 60` → 60 aliases com 120 variáveis DateTime → **ERRO**: excede limite de complexidade
- **Last 15 Minutes**: `duration = 900000ms` → `bucketCount = 15` → 15 aliases com 30 variáveis → pode funcionar, mas a abordagem é ineficiente
- **Efeito cascata**: Quando a agregação falha, o `Promise.all` no `loadData()` rejeita todas as promises, e a tabela de documentos exibe "No logs found" mesmo que a listagem e contagem estejam disponíveis

## Comportamento Esperado

### Requisitos de Preservação

**Comportamentos Inalterados:**
- Filtros (and/in) aplicados na listagem de eventos devem continuar sendo aplicados na query de agregação do histograma
- Brush-select e click-to-filter no histograma devem continuar filtrando os eventos da tabela pelo intervalo de tempo selecionado
- Todos os datasets (httpEvents, edgeFunctionsEvents, cellsConsoleEvents, imagesProcessedEvents, l2CacheEvents, idnsQueriesEvents, dataStreamedEvents, activityHistoryEvents) devem continuar exibindo o histograma corretamente
- A tabela de documentos deve continuar exibindo registros com paginação, contagem total e funcionalidade de "carregar mais"
- A aparência visual do histograma (tipo bar chart, cores, eixos) deve permanecer inalterada

**Escopo:**
Todas as interações que NÃO envolvem a construção da query de agregação do histograma devem ser completamente não afetadas pela correção. Isso inclui:
- Listagem de documentos na tabela
- Contagem total de registros
- Paginação e "carregar mais"
- Filtros avançados
- Navegação entre tabs/datasets
- Seleção de intervalo de tempo

## Causa Raiz Hipotética

Com base na análise do bug, as causas mais prováveis são:

1. **Abordagem de Sub-Queries Aliasadas**: A função `buildBucketedQuery` em `load-events-aggregation.js` constrói uma query com N aliases (`b0`, `b1`, ..., `bN`), cada um sendo uma sub-query completa com seu próprio `tsRange`. Para 24h, isso gera 48 aliases com 96 variáveis DateTime, excedendo o limite de complexidade da API.

2. **Ausência de Resampling**: A abordagem atual não utiliza lógica de resampling (`FillResultQuery`) para preencher lacunas temporais. Em vez disso, tenta garantir cobertura completa criando um bucket para cada intervalo, o que é a causa direta do excesso de aliases.

3. **Acoplamento no Promise.all**: No `tab-panel-block.vue`, a chamada `loadBucketedEventsAggregation` está dentro de um `Promise.all` junto com `listService` e `getTotalRecords`. Quando a agregação falha, todas as promises são rejeitadas, impedindo a exibição da tabela de documentos.

4. **Não Replicação do Padrão do Metrics**: O Real-Time Metrics usa uma query única com `groupBy: [ts]` + `aggregate` + `orderBy` e depois aplica `FillResultQuery` para preencher lacunas. A abordagem de Events não replica esse padrão, optando por sub-queries aliasadas que não escalam.

## Propriedades de Corretude

Property 1: Bug Condition - Query Única Substitui Sub-Queries Aliasadas

_Para qualquer_ input onde a condição do bug se aplica (isBugCondition retorna true), a função corrigida SHALL enviar uma única query GraphQL com `groupBy: [ts]`, `aggregate: { count: rows }` e `orderBy: [ts_ASC]` para a Events API, sem aliases ou sub-queries, e aplicar resampling (`FillResultQuery`) para preencher lacunas temporais com zeros, retornando dados de contagem para o intervalo completo.

**Valida: Requisitos 2.1, 2.3, 2.4**

Property 2: Preservation - Desacoplamento e Comportamento Existente

_Para qualquer_ input onde a condição do bug NÃO se aplica (isBugCondition retorna false), a função corrigida SHALL produzir o mesmo resultado que a função original, preservando filtros, brush-select, click-to-filter, aparência visual do histograma, e a tabela de documentos deve continuar funcionando independentemente de falhas na agregação do gráfico.

**Valida: Requisitos 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Implementação da Correção

### Mudanças Necessárias

Assumindo que nossa análise de causa raiz está correta:

**Arquivo**: `src/services/real-time-events-service/load-events-aggregation.js`

**Função**: `loadBucketedEventsAggregation` → substituir por nova função `loadEventsChartAggregation`

**Mudanças Específicas**:

1. **Substituir a abordagem de sub-queries aliasadas por query única**: Remover `loadBucketedEventsAggregation`, `buildBucketedQuery`, `parseBucketedResponse` e `calculateHistogramBuckets`. Criar nova função `loadEventsChartAggregation` que usa `convertGQLAggregation` (já existente em `src/helpers/convert-gql-aggregation.js`) para construir uma query única com `groupBy: [ts]`, `aggregate: { count: rows }`, `orderBy: [ts_ASC]` e `limit: 10000`.

2. **Aplicar resampling com FillResultQuery**: Após receber os dados da API, aplicar a lógica de `FillResultQuery` (de `src/modules/real-time-metrics/reports/fill-result-query.js`) para preencher intervalos de tempo sem dados com zeros. O intervalo de resampling segue a mesma regra do Metrics: `< 2.5 dias = minuto`, `2.5-60 dias = hora`, `> 60 dias = dia`.

3. **Adaptar o formato de saída**: Garantir que a saída da nova função mantenha o formato `[{ ts: string, count: number }]` esperado pelo `event-chart.vue`, compatível com o `chartData` computed property.

**Arquivo**: `src/views/RealTimeEvents/Blocks/tab-panel-block.vue`

**Função**: `loadData()`

**Mudanças Específicas**:

4. **Desacoplar a chamada de agregação do Promise.all**: Mover a chamada de agregação do gráfico para fora do `Promise.all`, executando-a de forma independente com seu próprio tratamento de erro. Se a agregação falhar, o gráfico exibe estado de erro, mas a tabela de documentos continua funcionando normalmente.

5. **Atualizar import**: Substituir o import de `loadBucketedEventsAggregation` por `loadEventsChartAggregation` (ou o nome final da nova função).

## Estratégia de Testes

### Abordagem de Validação

A estratégia de testes segue uma abordagem em duas fases: primeiro, surfar contraexemplos que demonstram o bug no código não corrigido, depois verificar que a correção funciona corretamente e preserva o comportamento existente.

### Verificação Exploratória da Condição do Bug

**Objetivo**: Surfar contraexemplos que demonstram o bug ANTES de implementar a correção. Confirmar ou refutar a análise de causa raiz. Se refutarmos, precisaremos re-hipotizar.

**Plano de Teste**: Escrever testes que simulam chamadas de `loadBucketedEventsAggregation` com diferentes intervalos de tempo e verificam a estrutura da query GraphQL gerada. Executar esses testes no código NÃO CORRIGIDO para observar falhas e entender a causa raiz.

**Casos de Teste**:
1. **Teste Today (24h)**: Simular chamada com `tsRange` de 24h e verificar que a query gerada contém 48 aliases com 96 variáveis DateTime (vai falhar no código não corrigido por exceder o limite)
2. **Teste Last 7 Days**: Simular chamada com `tsRange` de 7 dias e verificar que a query gerada contém 42 aliases (vai falhar no código não corrigido)
3. **Teste Last 30 Days**: Simular chamada com `tsRange` de 30 dias e verificar que a query gerada contém 60 aliases (vai falhar no código não corrigido)
4. **Teste de Estrutura da Query**: Verificar que a query gerada usa aliases `b0`, `b1`, etc. em vez de `groupBy: [ts]` (vai confirmar a causa raiz)

**Contraexemplos Esperados**:
- A query gerada contém N aliases com 2N variáveis DateTime, excedendo o limite de complexidade
- Causas possíveis: `buildBucketedQuery` cria aliases em vez de usar `groupBy: [ts]`, ausência de resampling

### Verificação da Correção (Fix Checking)

**Objetivo**: Verificar que para todos os inputs onde a condição do bug se aplica, a função corrigida produz o comportamento esperado.

**Pseudocódigo:**
```
PARA TODO input ONDE isBugCondition(input) FAÇA
  result := loadEventsChartAggregation(input)
  ASSERT result é um array de { ts: string, count: number }
  ASSERT a query enviada usa groupBy: [ts] sem aliases
  ASSERT lacunas temporais são preenchidas com count: 0
  ASSERT o intervalo de resampling segue a regra (< 2.5d = minuto, 2.5-60d = hora, > 60d = dia)
FIM PARA
```

### Verificação de Preservação (Preservation Checking)

**Objetivo**: Verificar que para todos os inputs onde a condição do bug NÃO se aplica, a função corrigida produz o mesmo resultado que a função original.

**Pseudocódigo:**
```
PARA TODO input ONDE NÃO isBugCondition(input) FAÇA
  ASSERT loadEventsChartAggregation(input) produz dados no mesmo formato
  ASSERT filtros (and/in) são aplicados corretamente na query
  ASSERT a tabela de documentos funciona independentemente da agregação
FIM PARA
```

**Abordagem de Teste**: Testes baseados em propriedades são recomendados para verificação de preservação porque:
- Geram muitos casos de teste automaticamente em todo o domínio de entrada
- Capturam edge cases que testes unitários manuais podem perder
- Fornecem garantias fortes de que o comportamento é inalterado para todos os inputs não-bugados

**Plano de Teste**: Observar o comportamento no código NÃO CORRIGIDO primeiro para filtros, brush-select e interações com a tabela, depois escrever testes baseados em propriedades capturando esse comportamento.

**Casos de Teste**:
1. **Preservação de Filtros**: Observar que filtros (and/in) são passados corretamente para a query de agregação no código não corrigido, depois verificar que continuam sendo passados após a correção
2. **Preservação do Formato de Saída**: Observar que a saída é `[{ ts, count }]` no código não corrigido, depois verificar que o formato é mantido após a correção
3. **Preservação de Datasets**: Observar que todos os 8 datasets funcionam no código não corrigido (para intervalos curtos), depois verificar que continuam funcionando após a correção
4. **Isolamento de Falhas**: Verificar que a tabela de documentos funciona mesmo quando a agregação falha

### Testes Unitários

- Testar que `loadEventsChartAggregation` gera uma query única com `groupBy: [ts]` sem aliases
- Testar que o resampling preenche lacunas temporais com zeros para intervalos de minuto, hora e dia
- Testar que filtros (and/in) são incluídos corretamente na query única
- Testar edge cases: intervalo de tempo zero, tsRange ausente, dataset inválido
- Testar que a resposta da API é parseada corretamente no formato `[{ ts, count }]`

### Testes Baseados em Propriedades

- Gerar intervalos de tempo aleatórios e verificar que a query gerada sempre usa `groupBy: [ts]` sem aliases, independentemente da duração
- Gerar combinações aleatórias de filtros e verificar que são incluídos corretamente na query
- Gerar respostas da API com lacunas temporais aleatórias e verificar que o resampling preenche todas as lacunas com zeros
- Verificar que o intervalo de resampling é sempre correto para a duração dada (minuto/hora/dia)

### Testes de Integração

- Testar o fluxo completo: `loadData()` no `tab-panel-block.vue` com a nova função de agregação
- Testar que a falha na agregação não impede a exibição da tabela de documentos
- Testar que o `event-chart.vue` renderiza corretamente com dados da nova função
- Testar que brush-select e click-to-filter continuam funcionando com os dados resampleados
