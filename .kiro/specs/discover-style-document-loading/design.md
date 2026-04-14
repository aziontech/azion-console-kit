# Bugfix Design — Carregamento de Documentos com Paginação Temporal (Discover-Style)

## Overview

A lista de documentos do Real-Time Events falha com "The query has reached a system limit" quando o intervalo de tempo excede ~2 horas. A causa raiz é que a query GraphQL solicita 22 campos (colunas) sobre um range temporal grande, excedendo os limites de `max_bytes_to_read` do ClickHouse.

A correção implementa **paginação temporal**: ao invés de paginar por offset, o sistema fatia o range temporal em blocos de 2 horas, começando pelo mais recente. Cada bloco é uma query independente com `limit: 2000` que respeita os limites do ClickHouse. O botão "Carregar mais" avança para o bloco temporal anterior até cobrir todo o intervalo.

## Glossário

- **Bug_Condition (C)**: A condição que dispara o bug — query de documentos com 22 campos sobre um intervalo > 2h que excede os limites do ClickHouse
- **Property (P)**: O comportamento desejado — documentos são carregados via blocos temporais de 2h, cada bloco sendo uma query independente que não excede os limites da API
- **Preservation**: Comportamentos existentes que devem permanecer inalterados — gráfico (histograma), filtros, brush-select, click-to-filter, exportação, navegação por teclado, expansão de documentos
- **`getListFilter()`**: Função em `tab-panel-block.vue` que constrói o filtro temporal para a query de documentos — atualmente retorna sempre as últimas 2h do range
- **`loadMoreData()`**: Função em `tab-panel-block.vue` que carrega mais registros — atualmente usa offset, será reescrita para usar paginação temporal
- **`MAX_LIST_RANGE_MS`**: Constante de 2 horas (7.200.000 ms) — tamanho máximo de cada janela temporal
- **`PAGE_SIZE`**: Constante que define o limite de documentos por query — muda de 50 para 2000
- **`currentWindowEnd`**: Novo estado que rastreia o fim da última janela temporal carregada — usado para calcular o próximo bloco

## Bug Details

### Bug Condition

O bug se manifesta quando o usuário seleciona um intervalo de tempo superior a ~2 horas (ex: "Today", "Last 24 hours", "Last 3 days"). A query `listService` envia uma requisição GraphQL com 22 campos sobre o intervalo completo, e o ClickHouse precisa ler 22 colunas × milhões de rows para processar a ordenação `ts_DESC`, excedendo `max_bytes_to_read`.

**Especificação Formal:**
```
FUNCTION isBugCondition(input)
  INPUT: input de tipo { tsRangeBegin: Date, tsRangeEnd: Date, fields: string[], pageSize: number }
  OUTPUT: boolean

  rangeMs := input.tsRangeEnd - input.tsRangeBegin
  MAX_LIST_RANGE_MS := 2 * 60 * 60 * 1000  // 2 horas

  RETURN rangeMs > MAX_LIST_RANGE_MS
         AND input.fields.length >= 20  // 22 campos na query atual
         AND queryExceedsClickHouseLimits(rangeMs, input.fields.length)
END FUNCTION
```

### Exemplos

- **"Today" (24h)**: Usuário seleciona "Today" às 15:00 → range de 00:00–15:00 (15h). Query com 22 campos sobre 15h → erro "system limit". **Esperado**: Carregar últimas 2h (13:00–15:00) com `limit: 2000`, "Carregar mais" busca 11:00–13:00, etc.
- **"Last 3 days" (72h)**: Range de 72h com 22 campos → erro. **Esperado**: Carregar últimas 2h do range, paginação temporal regressiva em blocos de 2h.
- **"Last 5 minutes" (5min)**: Range de 5min < 2h → query direta funciona normalmente. **Esperado**: Sem mudança, query direta com `limit: 2000`.
- **Range customizado (36h)**: Abril 13 08:00 → Abril 14 20:00. **Esperado**: Primeira query 18:00–20:00 (Abril 14), depois 16:00–18:00, etc., até 08:00 (Abril 13).

## Expected Behavior

### Preservation Requirements

**Comportamentos Inalterados:**
- O gráfico (histograma) deve continuar calculando a agregação sobre o intervalo completo — já está corrigido e funciona independentemente
- Filtros `and`/`in` aplicados pelo usuário devem continuar sendo aplicados nas queries de documentos e contagem total
- Click-to-filter e brush-select no histograma devem continuar funcionando, reiniciando a paginação
- Exportação CSV/JSON deve continuar exportando os documentos atualmente carregados
- Navegação por teclado (setas, Enter, Escape) deve continuar funcionando
- Expansão de documentos (inline e sidebar) deve continuar funcionando
- Alternância entre datasets deve reiniciar a lista normalmente

**Escopo:**
Todos os inputs que NÃO envolvem a query de documentos com range > 2h devem ser completamente não afetados por esta correção. Isso inclui:
- Queries de agregação do gráfico (já corrigidas)
- Queries com range ≤ 2h (funcionam diretamente)
- Interações de UI (filtros, expansão, navegação, exportação)
- A camada de serviço (`list-http-request.js`, `get-total-records.js`) — já aceita `tsRange` e `limit`

## Hypothesized Root Cause

Com base na análise do código, as causas raiz são:

1. **`getListFilter()` é estático**: A função sempre retorna as últimas 2h do range (`end - MAX_LIST_RANGE_MS`), sem capacidade de mover a janela temporal para trás. Não há estado que rastreie a posição atual da janela.

2. **`loadMoreData()` usa offset**: A função atual usa `offset: currentOffset.value` para paginar, o que não funciona com paginação temporal — o offset é relativo à query original, não a um bloco temporal diferente.

3. **`PAGE_SIZE` é muito pequeno**: Com `PAGE_SIZE = 50`, o usuário precisa de muitos cliques para navegar volumes significativos. Com paginação temporal (blocos de 2h), `limit: 2000` é viável porque cada bloco é uma query independente sobre um range pequeno.

4. **`getTotalRecords` usa o filtro restrito**: A contagem total é chamada com `getListFilter()` (últimas 2h), mas deveria usar o range completo — a query de agregação `count: rows` é leve e funciona para qualquer intervalo.

5. **Ausência de estado de janela temporal**: Não existe `currentWindowEnd` para rastrear qual bloco temporal foi carregado por último, nem lógica para determinar quando todos os blocos foram carregados.

## Correctness Properties

Property 1: Bug Condition — Paginação Temporal para Ranges Grandes

_Para qualquer_ input onde o range temporal excede 2 horas (isBugCondition retorna true), a função `loadData` corrigida SHALL fatiar o range em blocos de 2h começando pelo mais recente, executando cada bloco como uma query independente com `limit: 2000` e todos os 22 campos, sem exceder os limites do ClickHouse.

**Validates: Requirements 2.1, 2.2, 2.5**

Property 2: Preservation — Comportamento para Ranges Pequenos e Interações Existentes

_Para qualquer_ input onde o range temporal NÃO excede 2 horas (isBugCondition retorna false), a função corrigida SHALL executar a query diretamente sobre o range completo com `limit: 2000`, preservando o comportamento existente para ranges pequenos. Adicionalmente, todas as interações de UI (filtros, brush-select, exportação, navegação por teclado, expansão de documentos) SHALL produzir exatamente o mesmo resultado que o código original.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

## Fix Implementation

### Changes Required

Assumindo que a análise de causa raiz está correta:

**Arquivo**: `src/views/RealTimeEvents/Blocks/tab-panel-block.vue`

**Mudanças Específicas**:

1. **`PAGE_SIZE`: 50 → 2000**: Aumentar o limite por query para aproveitar a janela temporal reduzida.

2. **Novo estado `currentWindowEnd`**: Adicionar `ref` para rastrear o fim da última janela temporal carregada. Inicializado com `tsRangeEnd` do filtro atual.

3. **`getListFilter()` parametrizado**: Modificar para aceitar `windowEnd` como parâmetro. Para ranges > 2h, retorna `{ tsRangeBegin: max(windowEnd - 2h, originalBegin), tsRangeEnd: windowEnd }`. Para ranges ≤ 2h, retorna o filtro original sem alteração.

4. **`loadData()` reescrita**: Na carga inicial, setar `currentWindowEnd = tsRangeEnd`. Executar loop de preenchimento: buscar blocos de 2h regressivamente até acumular pelo menos 2000 documentos ou esgotar o range. Cada iteração chama `getListFilter(currentWindowEnd)`, executa a query, concatena resultados, e move `currentWindowEnd` para trás. Chamar `getTotalRecords` com o range COMPLETO (não o filtro restrito). Calcular `hasMoreData` baseado em `currentWindowEnd > originalBegin`.

5. **`loadMoreData()` reescrita**: Mesma lógica de loop de preenchimento: buscar blocos de 2h regressivamente a partir de `currentWindowEnd` até acumular mais 2000 documentos ou esgotar o range. Concatenar resultados aos existentes. Atualizar `hasMoreData = currentWindowEnd > originalBegin`.

   **Exemplo**: Se as últimas 2h têm 300 docs, o load inicial automaticamente busca o bloco anterior (20:00–22:00, 800 docs), depois o anterior (18:00–20:00, 1500 docs) — total 2600 docs. Para. O usuário vê 2600 docs sem precisar clicar "Carregar mais".

6. **Texto do botão "Carregar mais"**: Mudar de "Load more" / "X of Y records" para "Carregar mais" / "Exibindo X de N documentos". Ocultar quando `currentWindowEnd <= originalBegin`.

7. **`getTotalRecords` com range completo**: Na `loadData()`, passar o filtro original (range completo) para `getTotalRecords` ao invés de `getListFilter()`.

## Testing Strategy

### Validation Approach

A estratégia de testes segue duas fases: primeiro, surfar contraexemplos que demonstram o bug no código não corrigido, depois verificar que a correção funciona e preserva o comportamento existente.

### Exploratory Bug Condition Checking

**Objetivo**: Surfar contraexemplos que demonstram o bug ANTES de implementar a correção. Confirmar ou refutar a análise de causa raiz.

**Plano de Teste**: Escrever testes que simulam chamadas a `loadData()` e `loadMoreData()` com ranges temporais > 2h e verificar o comportamento das queries geradas. Executar no código NÃO corrigido para observar falhas.

**Casos de Teste**:
1. **Range de 24h (Today)**: Simular `loadData()` com range de 24h — no código atual, `getListFilter()` retorna apenas as últimas 2h e `loadMoreData()` usa offset (falha no código não corrigido)
2. **Range de 72h (Last 3 days)**: Simular `loadData()` com range de 72h — mesma limitação (falha no código não corrigido)
3. **Load More com offset**: Simular `loadMoreData()` após carga inicial — usa `offset` ao invés de mover janela temporal (falha no código não corrigido)
4. **getTotalRecords com range restrito**: Verificar que `getTotalRecords` é chamado com range restrito ao invés do completo (falha no código não corrigido)

**Contraexemplos Esperados**:
- `getListFilter()` sempre retorna as últimas 2h, sem capacidade de mover para trás
- `loadMoreData()` usa `offset` que não funciona com paginação temporal
- `getTotalRecords` recebe o filtro restrito ao invés do range completo

### Fix Checking

**Objetivo**: Verificar que para todos os inputs onde a bug condition é verdadeira, a função corrigida produz o comportamento esperado.

**Pseudocódigo:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := loadData_fixed(input)
  ASSERT result.firstQuery.tsRange.end == input.tsRangeEnd
  ASSERT result.firstQuery.tsRange.begin == max(input.tsRangeEnd - 2h, input.tsRangeBegin)
  ASSERT result.firstQuery.limit == 2000
  ASSERT result.totalRecords.tsRange == input.fullRange  // range completo
  ASSERT result.hasMoreData == (currentWindowEnd > input.tsRangeBegin)
END FOR
```

### Preservation Checking

**Objetivo**: Verificar que para todos os inputs onde a bug condition NÃO é verdadeira, a função corrigida produz o mesmo resultado que a função original.

**Pseudocódigo:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT loadData_original(input).queryParams == loadData_fixed(input).queryParams
  ASSERT loadMoreData_original(input).behavior == loadMoreData_fixed(input).behavior
END FOR
```

**Abordagem de Teste**: Testes baseados em propriedades são recomendados para preservation checking porque:
- Geram muitos casos de teste automaticamente sobre o domínio de inputs
- Capturam edge cases que testes manuais podem perder
- Fornecem garantias fortes de que o comportamento é inalterado para inputs não-buggy

**Plano de Teste**: Observar comportamento no código NÃO corrigido para ranges ≤ 2h, filtros, e interações de UI, depois escrever testes que capturam esse comportamento.

**Casos de Teste**:
1. **Range ≤ 2h Preservation**: Verificar que `getListFilter()` retorna o filtro original sem modificação para ranges ≤ 2h
2. **Filtros Preservation**: Verificar que filtros `and`/`in` são preservados nas queries de documentos
3. **Brush-select Preservation**: Verificar que brush-select reinicia a paginação e aplica o novo range
4. **Exportação Preservation**: Verificar que exportação CSV/JSON continua funcionando com os documentos carregados

### Unit Tests

- Testar `getListFilter()` com ranges variados (5min, 1h, 2h, 24h, 72h) e posições de janela diferentes
- Testar cálculo de `currentWindowEnd` após múltiplos "Carregar mais"
- Testar condição de parada: `currentWindowEnd <= originalBegin`
- Testar clamping: quando `currentWindowEnd - 2h < originalBegin`, usar `originalBegin` como início do bloco
- Testar que `PAGE_SIZE` é 2000

### Property-Based Tests

- Gerar ranges temporais aleatórios e verificar que cada bloco temporal tem no máximo 2h
- Gerar sequências de "Carregar mais" e verificar que os blocos cobrem todo o range sem sobreposição
- Gerar ranges ≤ 2h e verificar que o comportamento é idêntico ao original (preservation)
- Gerar combinações de filtros + ranges e verificar que filtros são preservados em cada bloco

### Integration Tests

- Testar fluxo completo: selecionar "Today" → carregar documentos → "Carregar mais" × N → verificar cobertura do range
- Testar alternância de dataset com range grande → verificar reinício da paginação temporal
- Testar brush-select durante paginação temporal → verificar reinício com novo range
- Testar que o texto "Exibindo X de N documentos" atualiza corretamente após cada "Carregar mais"
