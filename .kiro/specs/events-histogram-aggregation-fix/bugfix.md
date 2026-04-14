# Documento de Requisitos do Bugfix

## Introdução

O gráfico de histograma do Real-Time Events falha com o erro "The query has reached a system limit" quando o intervalo de tempo selecionado é "Today" (24 horas) ou superior. A função `loadBucketedEventsAggregation` gera N sub-queries aliasadas em uma única requisição GraphQL — uma por bucket de tempo. Para 24h, isso resulta em 48 aliases com 96 variáveis DateTime, excedendo o limite de complexidade da Events API (`v4/events/graphql`). Como a chamada de agregação do gráfico está dentro de um `Promise.all` junto com a listagem de documentos e contagem total, a falha na agregação impede que a tabela de eventos também exiba dados, resultando em "No logs found" na página inteira.

## Análise do Bug

### Comportamento Atual (Defeito)

1.1 QUANDO o intervalo de tempo é "Today" (24 horas) ou superior ENTÃO o sistema gera 48+ sub-queries aliasadas com 96+ variáveis DateTime em uma única requisição GraphQL, excedendo o limite de complexidade da API e retornando o erro "The query has reached a system limit"

1.2 QUANDO a agregação do histograma falha ENTÃO o sistema exibe "No events in selected time range" no gráfico e "No logs found" na tabela de documentos, pois ambas as chamadas estão acopladas em um `Promise.all` no `loadData()` do `tab-panel-block.vue`

1.3 QUANDO o intervalo de tempo é superior a 24 horas ENTÃO o sistema gera ainda mais aliases e variáveis (ex: 7 dias = 42 aliases, 30 dias = 60 aliases), agravando o problema de complexidade da query

1.4 QUANDO a API retorna dados de agregação via `groupBy: [ts]` com a abordagem de query única ENTÃO o sistema não preenche os intervalos de tempo sem dados com zeros, resultando em lacunas no histograma (a lógica de resampling do `FillResultQuery` usada pelo Real-Time Metrics não é aplicada)

### Comportamento Esperado (Correto)

2.1 QUANDO o intervalo de tempo é "Today" (24 horas) ou superior ENTÃO o sistema SHALL enviar uma única query GraphQL com `groupBy: [ts]`, `aggregate: { count: rows }` e `orderBy: [ts_ASC]` para a Events API, sem aliases ou sub-queries, evitando o limite de complexidade

2.2 QUANDO a agregação do histograma falha ENTÃO o sistema SHALL continuar exibindo a tabela de documentos normalmente, isolando a falha do gráfico da listagem de eventos (as chamadas não devem estar acopladas em um único `Promise.all`)

2.3 QUANDO o intervalo de tempo é qualquer valor válido (minutos, horas ou dias) ENTÃO o sistema SHALL utilizar a mesma query única com `groupBy: [ts]` independentemente da duração, sem limite de cap artificial, buscando o intervalo completo

2.4 QUANDO a API retorna dados de agregação com lacunas temporais ENTÃO o sistema SHALL aplicar lógica de resampling (equivalente ao `FillResultQuery` do Real-Time Metrics) para preencher intervalos sem dados com zeros, usando o cálculo de intervalo: < 2.5 dias = minuto, 2.5-60 dias = hora, > 60 dias = dia

### Comportamento Inalterado (Prevenção de Regressão)

3.1 QUANDO o intervalo de tempo é curto (ex: últimos 15 minutos, última hora) ENTÃO o sistema SHALL CONTINUAR A exibir o histograma corretamente com dados de contagem de eventos por timestamp

3.2 QUANDO o usuário aplica filtros (and/in) na listagem de eventos ENTÃO o sistema SHALL CONTINUAR A aplicar os mesmos filtros na query de agregação do histograma

3.3 QUANDO o usuário clica em uma barra do histograma (click-to-filter) ou faz brush-select ENTÃO o sistema SHALL CONTINUAR A filtrar os eventos da tabela pelo intervalo de tempo selecionado

3.4 QUANDO qualquer dataset é selecionado (httpEvents, edgeFunctionsEvents, cellsConsoleEvents, imagesProcessedEvents, l2CacheEvents, idnsQueriesEvents, dataStreamedEvents, activityHistoryEvents) ENTÃO o sistema SHALL CONTINUAR A exibir o histograma corretamente com a nova abordagem de query única

3.5 QUANDO a tabela de documentos carrega dados ENTÃO o sistema SHALL CONTINUAR A exibir os registros com paginação, contagem total e funcionalidade de "carregar mais"

3.6 QUANDO o histograma é renderizado ENTÃO o sistema SHALL CONTINUAR A manter a mesma aparência visual (tipo bar chart, cores, eixos) sem alterações perceptíveis ao usuário
