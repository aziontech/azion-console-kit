# Documento de Requisitos do Bugfix

## Introdução

A lista de documentos do Real-Time Events falha com o erro "The query has reached a system limit" quando o intervalo de tempo selecionado é "Today" (24 horas) ou superior. A query `listService` envia uma requisição GraphQL com `limit: 50`, 22 campos e `orderBy: ts_DESC` sobre o intervalo completo, excedendo o limite de complexidade da Events API (`v4/events/graphql`), que é backed por ClickHouse com limites de `max_bytes_to_read`/`max_rows_to_read` configurados.

O ClickHouse é um banco columnar — cada campo solicitado é uma coluna separada que precisa ser lida do disco. Solicitar 22 colunas × milhões de rows × 24h de range excede os limites, mesmo com `LIMIT 50`, porque o ClickHouse precisa processar o range inteiro para ordenar por `ts DESC`.

O gráfico (histograma) já foi corrigido e funciona independentemente — este bug é exclusivamente sobre a lista de documentos abaixo do gráfico.

## Contexto Técnico: ClickHouse e Limites da API

### Como o ClickHouse processa a query
1. O ClickHouse é particionado por data — um range de 24h toca 1-2 partições
2. Para cada partição, lê as colunas solicitadas (22 colunas = 22 arquivos de coluna)
3. Aplica o filtro `tsRange` usando o índice primário (eficiente)
4. Ordena por `ts DESC` (eficiente se `ts` está no ORDER BY da tabela)
5. Aplica `LIMIT` e retorna os resultados

O gargalo é o passo 2: ler 22 colunas de milhões de rows. Mesmo com `LIMIT 50`, o ClickHouse pode precisar ler muitos dados para encontrar os 50 mais recentes quando o volume é alto.

### Estratégias para não estourar os limites
- **Reduzir colunas**: Buscar apenas campos essenciais (5-6) na listagem, carregar detalhes sob demanda
- **Keyset pagination**: Usar `WHERE ts < last_ts` ao invés de `OFFSET N` para deep pagination — O(1) vs O(N)
- **Limit razoável**: `LIMIT 2000` com poucos campos é viável; `LIMIT 2000` com 22 campos pode não ser

### Referência: Azion GraphQL API
A API suporta `offset` + `limit` nativamente para paginação. O `resample` com `function: sum` e `points: N` está disponível apenas para Metrics, não para Events.

## Análise do Bug

### Comportamento Atual (Defeito)

1.1 QUANDO o usuário seleciona "Today" ou qualquer intervalo > ~2 horas ENTÃO o sistema envia uma query `listService` com `limit: 50`, 22 campos e `orderBy: ts_DESC` sobre o intervalo completo, excedendo o limite de complexidade da API e retornando o erro "The query has reached a system limit"

1.2 QUANDO o intervalo de tempo é grande (> 2h) ENTÃO o `getListFilter()` aplica um workaround que restringe a janela para as últimas 2 horas do intervalo selecionado, fazendo com que o usuário veja apenas documentos recentes em vez de poder navegar por todo o intervalo

1.3 QUANDO o `getTotalRecords` é chamado com `aggregate: { count: rows }` sobre intervalos muito grandes ENTÃO a contagem pode falhar com o mesmo erro de limite do sistema, impedindo a exibição do total de registros

1.4 QUANDO o usuário clica em "Load more" ENTÃO o sistema carrega apenas mais 50 registros (`PAGE_SIZE = 50`), resultando em muitos cliques para navegar volumes significativos de dados

1.5 QUANDO mais documentos são carregados via "Load more" ENTÃO a página expande verticalmente, empurrando o gráfico e os controles para fora da viewport — o scroll é da página inteira em vez de ser interno ao container da lista

1.6 QUANDO o botão "Load more" é exibido ENTÃO o texto mostra apenas "X of Y records" sem indicação clara de quantos documentos serão carregados no próximo clique

### Comportamento Esperado (Correto)

2.1 QUANDO o usuário seleciona qualquer intervalo de tempo (incluindo "Today" ou superior) ENTÃO o sistema SHALL carregar os primeiros 2.000 documentos mais recentes dentro do intervalo, usando paginação temporal progressiva — a query inicial busca os documentos mais recentes (últimas N horas do range) com todos os 22 campos, e o "Carregar mais" expande para o bloco temporal anterior, evitando queries que excedam os limites do ClickHouse

2.1.1 A paginação temporal funciona assim: para um range de 24h, a primeira query busca as últimas 2h (22:00-23:59) com `limit: 2000`. Se o usuário quer mais, a próxima query busca 20:00-22:00, e assim por diante. Cada bloco temporal é uma query independente que não excede os limites da API.

2.2 QUANDO o carregamento inicial é executado ENTÃO o sistema SHALL usar uma janela temporal reduzida (últimas 2h do range selecionado) para a query de documentos com todos os 22 campos, garantindo que a query não exceda os limites do ClickHouse — a constante `MAX_LIST_RANGE_MS` SHALL ser mantida mas o comportamento de "Load more" SHALL expandir progressivamente para blocos temporais anteriores ao invés de usar offset

2.3 QUANDO o `getTotalRecords` é chamado sobre o intervalo completo ENTÃO o sistema SHALL executar a contagem normalmente (a query de agregação `count: rows` é leve e deve funcionar para qualquer intervalo), exibindo o total real de documentos

2.4 QUANDO o usuário faz scroll até o final dos documentos carregados ENTÃO o sistema SHALL exibir um botão "Carregar mais 2.000" (ou CTA equivalente) — o carregamento adicional é explícito por clique do usuário, NÃO por infinite scroll automático

2.5 QUANDO o usuário clica em "Carregar mais" ENTÃO o sistema SHALL buscar o próximo bloco temporal (ex: as 2h anteriores ao último documento carregado) com `limit: 2000` e todos os 22 campos, adicionando os resultados à lista já renderizada e preservando a posição de scroll — cada bloco temporal é uma query independente que respeita os limites do ClickHouse

2.6 QUANDO documentos são carregados e exibidos ENTÃO o sistema SHALL manter o scroll INTERNO ao container da lista — o gráfico, barra de busca e seletor de tempo SHALL permanecer fixos/visíveis, e apenas o container de eventos SHALL ter scroll interno, replicando o padrão do painel de documentos do Kibana Discover

2.7 QUANDO documentos estão sendo exibidos ENTÃO o sistema SHALL mostrar um contador no formato "Exibindo X de N documentos" (ou "~N" quando o total é estimado), indicando claramente o progresso de carregamento

2.8 QUANDO um novo lote está sendo carregado ENTÃO o sistema SHALL exibir um estado de loading sem bloquear os documentos já renderizados — o usuário pode continuar navegando nos documentos existentes enquanto o novo lote carrega

2.9 QUANDO não há mais documentos para carregar ENTÃO o sistema SHALL desabilitar/ocultar o botão "Carregar mais" e indicar que o fim da lista foi alcançado

2.10 QUANDO múltiplos "Carregar mais" resultam em muitos documentos no DOM (ex: 10.000+) ENTÃO o sistema SHALL considerar virtualização de lista no frontend para manter a performance de renderização

### Comportamento Inalterado (Prevenção de Regressão)

3.1 QUANDO o gráfico (histograma) é carregado ENTÃO o sistema SHALL CONTINUAR A calcular a agregação sobre o intervalo completo, independentemente do estado de carregamento da lista de documentos — o gráfico já foi corrigido e funciona de forma independente

3.2 QUANDO o usuário aplica filtros (and/in) na listagem de eventos ENTÃO o sistema SHALL CONTINUAR A aplicar os mesmos filtros nas queries de documentos e contagem total

3.3 QUANDO o usuário clica em uma barra do histograma (click-to-filter) ou faz brush-select ENTÃO o sistema SHALL CONTINUAR A filtrar os eventos da tabela pelo intervalo de tempo selecionado, reiniciando a paginação do zero

3.4 QUANDO qualquer dataset é selecionado (httpEvents, edgeFunctionsEvents, cellsConsoleEvents, etc.) ENTÃO o sistema SHALL CONTINUAR A exibir a lista de documentos corretamente com a nova estratégia de paginação

3.5 QUANDO o usuário exporta dados (CSV/JSON) ENTÃO o sistema SHALL CONTINUAR A exportar os documentos atualmente carregados na tabela

3.6 QUANDO o usuário navega por teclado (setas, Enter, Escape) ENTÃO o sistema SHALL CONTINUAR A suportar navegação por teclado na lista de documentos

3.7 QUANDO o usuário expande um documento (inline ou sidebar) ENTÃO o sistema SHALL CONTINUAR A exibir os detalhes do documento corretamente

3.8 QUANDO o usuário alterna entre datasets ENTÃO o sistema SHALL CONTINUAR A reiniciar a lista e carregar os primeiros 2.000 documentos do novo dataset
