# Plano de Implementação

- [x] 1. Criar nova função `loadEventsChartAggregation` em `load-events-aggregation.js`
  - [x] 1.1 Implementar `loadEventsChartAggregation` usando `convertGQLAggregation` com `groupBy: [ts]`, `aggregate: { count: rows }`, `orderBy: [ts_ASC]` — sem aliases, sem sub-queries, sem limit cap artificial
    - Receber `{ dataset, tsRange, filters }` como parâmetros
    - Usar `convertGQLAggregation` já existente em `src/helpers/convert-gql-aggregation.js` para construir a query única
    - Enviar a query via `AxiosHttpClientSignalDecorator` para `makeRealTimeEventsBaseUrl()`
    - Parsear a resposta com `adaptResponse` existente
    - _Bug_Condition: isBugCondition(input) onde bucketCount > 1 AND totalVariables > API_COMPLEXITY_LIMIT AND queryUsesAliasedSubQueries_
    - _Expected_Behavior: query única com groupBy:[ts] + aggregate:{count:rows} + orderBy:[ts_ASC] retorna dados para o intervalo completo_
    - _Preservation: filtros (and/in) devem ser passados corretamente para a query única_
    - _Requirements: 2.1, 2.3, 3.2, 3.4_
  - [x] 1.2 Implementar lógica de resampling (FillResultQuery-equivalente) para Events
    - Calcular intervalo de resampling: `< 2.5 dias = minuto`, `2.5-60 dias = hora`, `> 60 dias = dia` (mesma regra do Real-Time Metrics)
    - Reutilizar ou adaptar `FillResultQuery` de `src/modules/real-time-metrics/reports/fill-result-query.js` para preencher lacunas temporais com `{ ts, count: 0 }`
    - Aplicar resampling após receber dados da API, antes de retornar ao chamador
    - _Requirements: 2.4, 3.1_

- [x] 2. Desacoplar agregação do gráfico do `Promise.all` em `tab-panel-block.vue`
  - [x] 2.1 Mover a chamada de agregação do gráfico para fora do `Promise.all` no `loadData()`
    - Executar `loadEventsChartAggregation` de forma independente com seu próprio `try/catch`
    - Se a agregação falhar, setar `chartData.value = []` e manter o gráfico em estado de erro
    - A tabela de documentos (`listService` + `getTotalRecords`) deve continuar funcionando normalmente mesmo se a agregação falhar
    - _Bug_Condition: Promise.all rejeita todas as promises quando a agregação falha_
    - _Expected_Behavior: falha na agregação não impede exibição da tabela_
    - _Preservation: paginação, contagem total e "carregar mais" devem continuar funcionando_
    - _Requirements: 2.2, 3.5_

- [x] 3. Atualizar imports e referências da função antiga para a nova
  - [x] 3.1 Substituir import de `loadBucketedEventsAggregation` por `loadEventsChartAggregation` em `tab-panel-block.vue`
    - Atualizar a chamada no `loadData()` para usar a nova assinatura da função
    - _Requirements: 2.1, 2.3_
  - [x] 3.2 Remover código legado de `load-events-aggregation.js`
    - Remover `loadBucketedEventsAggregation`, `buildBucketedQuery`, `parseBucketedResponse` e `calculateHistogramBuckets`
    - Manter `loadEventsAggregation` (export default) e `adaptResponse` intactos
    - _Requirements: 2.1_

- [x] 4. Verificação final — garantir que tudo funciona junto
  - Confirmar que o histograma renderiza corretamente para todos os intervalos de tempo (15min, 1h, 24h, 7d, 30d)
  - Confirmar que filtros, brush-select e click-to-filter continuam funcionando
  - Confirmar que a tabela de documentos funciona independentemente do gráfico
  - Confirmar que todos os 8 datasets exibem o histograma corretamente
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
