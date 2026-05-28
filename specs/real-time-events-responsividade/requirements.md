# Requirements: Real Time Events — Responsividade (Gráfico + Filter Bar)

## Overview

Tornar a página **Real Time Events V2** (rota `/real-time-events/v2/:tab?`, arquivos sob [src/views/RealTimeEventsV2/](src/views/RealTimeEventsV2/)) operável, legível e acessível em todas as faixas de viewport entre 320px e ≥1440px, com foco em dois pontos críticos:

1. **Gráfico de eventos** ([event-chart.vue](src/views/RealTimeEventsV2/Blocks/components/event-chart.vue)) — altura adaptativa, densidade de ticks, suporte a touch para brush-to-zoom e tooltip, densidade do header.
2. **Filter bar** ([filter-bar.vue](src/views/RealTimeEventsV2/Blocks/components/filter-bar.vue)) — layout adaptativo de Dataset + AQL input + time range + refresh, chips de filtro acessíveis em scroll horizontal, overlays teleportados (saved searches, query history) que não estourem o viewport.

Esta spec define **contratos testáveis por breakpoint**, edge cases (touch, iOS Safari, reduced motion), comportamentos de overlays teleportados, ergonomia de alvos de toque e regras de não-regressão.

**Não confundir com refactor amplo:** mantém-se C3 como lib de gráfico, `@media` CSS como mecanismo de responsividade, e a estrutura atual de componentes. Out of scope detalhado na seção dedicada.

## Personas

- **Operador de plataforma (SRE/DevOps)**: monitora tráfego em tempo real do laptop e, em incidentes, do celular ou tablet. Precisa identificar picos no gráfico e filtrar rapidamente em qualquer device, inclusive com uma mão segurando o telefone.
- **Engenheiro de aplicação**: investiga eventos por endpoint/IP/status em desktop, ocasionalmente em tablet. Filtros aplicados precisam permanecer rastreáveis sem cortar texto crítico.
- **Customer Success / suporte técnico**: acessa de dispositivos variados para inspecionar comportamento de um cliente; raramente edita filtros, frequentemente lê o gráfico.
- **Usuário de tecnologia assistiva**: navega com teclado ou screen reader; depende de `aria-label`, ordem de tab e foco visível para usar a filter bar e os controles do gráfico.

## Breakpoint Contract (referência usada nos critérios)

| Token       | Faixa             | Devices típicos                          |
|-------------|-------------------|------------------------------------------|
| `mobile-s`  | `< 375px`         | iPhone SE 1ª gen, telefones antigos      |
| `mobile`    | `375px – 639px`   | iPhone 12/13/14, Android padrão          |
| `tablet`    | `640px – 1023px`  | iPad portrait, tablets pequenos, foldables aberto |
| `desktop`   | `1024px – 1439px` | Laptops 13–14", iPad landscape           |
| `xl`        | `≥ 1440px`        | Monitores externos, MacBook 16" Retina   |

> Os tokens são **o contrato** referenciado pelos critérios EARS. Os valores em px não devem mudar sem revisar esta spec. Implementação pode usar `@media` CSS, `window.matchMedia` ou container queries — mas os limites devem permanecer.

---

## User Stories & Acceptance Criteria

### 1. Visibilidade e legibilidade do gráfico em viewports estreitos

**User Story:** Como **operador de plataforma**, **quero** ver o gráfico de eventos mantido visível e legível em telas mobile, **para que** eu consiga identificar picos de tráfego durante um incidente sem precisar zoom manual ou rotação de tela.

**Acceptance Criteria:**

1.1 Em todos os breakpoints, o sistema deve renderizar a área plotável do gráfico (excluindo header e eixos) usando **escala proporcional ao viewport** via fórmula `height: clamp(200px, 28dvh, 320px)`. Piso `200px` preserva a altura atual de produção (zero regressão em laptops pequenos, mobile portrait e iPhone SE); teto `320px` evita o gráfico ocupar tela inteira em monitores 4K.
1.2 O sistema **não deve** aplicar media queries por breakpoint à altura do `.chart-container` — a fórmula `clamp` cobre todas as faixas continuamente, evitando saltos abruptos.
1.3 O sistema deve usar `dvh` (dynamic viewport height) em vez de `vh` na fórmula, para evitar saltos quando a barra de endereço do iOS Safari aparece/desaparece.
1.4 Em todos os breakpoints, o sistema deve calcular dinamicamente o número máximo de ticks no eixo X em função da largura disponível e da largura renderizada do rótulo mais longo, garantindo **gap mínimo de 8px** entre rótulos consecutivos. Fórmula de referência: `maxTicks = floor(containerWidth / (longestLabelWidth + 8))`.
1.5 Quando o número de ticks naturais do C3 exceder `maxTicks`, o sistema deve aplicar decimação (manter o primeiro e o último tick, distribuir o restante uniformemente) sem alterar o domínio do eixo.
1.6 Em qualquer breakpoint, o sistema **não deve** permitir que dois rótulos do eixo X se sobreponham visualmente nem que sejam rotacionados além de **0°** em `desktop`/`xl`. Em `mobile-s`/`mobile`/`tablet`, rotação de até **−45°** é permitida apenas se a decimação do critério 1.5 ainda não couber.
1.7 Quando a janela de tempo selecionada for `< 1 hora`, o sistema deve formatar ticks como `HH:mm` em todos os breakpoints.
1.8 Quando a janela for `≥ 1 dia`, o sistema deve formatar ticks como `MM/dd` em `mobile-s`/`mobile` e `MM/dd HH:mm` em `tablet`+.
1.9 Quando o viewport mudar de faixa de breakpoint, o sistema deve re-renderizar o gráfico via o `ResizeObserver` existente ([event-chart.vue:331-340](src/views/RealTimeEventsV2/Blocks/components/event-chart.vue#L331-L340)) com debounce ≤ **100ms** sem exigir reload da página.
1.10 Se a largura disponível for `< 320px`, então o sistema deve manter o gráfico funcional: sem erro de console, sem overflow horizontal da página, e com no mínimo 3 ticks visíveis no eixo X.
1.11 Em todos os breakpoints, o sistema deve preservar a paleta de cores, opacidade de área (`.c3-area` opacity 0.05) e stroke das linhas (1.5px) atuais sem regressão de contraste.
1.12 Os estados **loading** (`.chart-loading`), **error** (`.chart-empty` com `InlineMessage`) e **empty** (`.chart-empty` com "No events in selected time range") devem usar a **mesma fórmula `clamp(200px, 28dvh, 320px)`** do critério 1.1, evitando salto de layout entre estados.

---

### 2. Layout adaptativo da filter bar

**User Story:** Como **engenheiro de aplicação**, **quero** que a filter bar empilhe verticalmente em telas estreitas com Dataset selector, input AQL, time range e refresh organizados de forma previsível, **para que** eu continue identificando todos os filtros aplicados sem perder controles principais.

**Acceptance Criteria:**

2.1 Em `desktop` e `xl`, o sistema deve manter o layout horizontal atual em uma linha única: `[Dataset] [filter button] [AQL input com time range e refresh embutidos]`, conforme [filter-bar.vue:36-78](src/views/RealTimeEventsV2/Blocks/components/filter-bar.vue#L36-L78).
2.2 Em `tablet`, o sistema deve organizar a filter bar em **duas linhas** usando `flex-wrap` já existente em `.filter-bar__row`: linha 1 com Dataset + botão saved searches + input AQL; linha 2 com seletor de time range + botão Refresh alinhados à direita (`justify-content: flex-end`, mantendo consistência visual com a borda direita do desktop).
2.3 Em `mobile` e `mobile-s`, o sistema deve organizar a filter bar em **stack vertical** seguindo a ordem visual: (a) Dataset selector, (b) input AQL + botão saved searches lado a lado, (c) seletor de time range, (d) botão Refresh.
2.4 Em `mobile-s`, o sistema deve permitir que o Dataset selector ocupe `width: 100%` do container da filter bar (hoje é `clamp(7rem, 15vw, 10rem)` — esta spec **sobrescreve em mobile-s**).
2.5 Em `mobile` e `mobile-s`, o sistema deve manter altura interativa mínima de **44px** (alvo de toque WCAG 2.5.5) em: botão saved searches, botão Refresh, seletor de time range e seletor de Dataset.
2.6 Em todos os breakpoints, o sistema **não deve** permitir overflow horizontal da filter bar para fora do container da página (zero scroll-x na página inteira causado pela filter bar).
2.7 Quando o usuário rotacionar o dispositivo entre portrait e landscape dentro da mesma faixa de breakpoint, o sistema deve preservar o estado dos filtros aplicados sem re-render destrutivo (preservar input atual, scroll position, focused element quando possível).
2.8 Em `tablet` e abaixo, se o input AQL receber foco e o teclado virtual aparecer, então o sistema **não deve** rolar a página de forma que o input fique abaixo do teclado.
2.9 O sistema deve preservar a unificação de altura de **2rem** dos controles em `desktop` e `xl` ([filter-bar.vue:119-175](src/views/RealTimeEventsV2/Blocks/components/filter-bar.vue#L119-L175)). Em `tablet` e abaixo, a altura mínima passa a ser **2.75rem (44px)** para alvo de toque.

---

### 3. Comportamento dos chips de filtro

**User Story:** Como **operador de plataforma**, **quero** que os chips de filtros aplicados ("Remote Address not equals: 104.210...") fiquem acessíveis e legíveis em mobile, **para que** eu consiga revisar e remover filtros sem perder contexto.

**Acceptance Criteria:**

3.1 Em `mobile-s`, `mobile` e `tablet` (`viewport < 1024px`), o sistema deve renderizar `FilterTagsDisplay` em **scroll horizontal** dentro do seu container, com `overflow-x: auto` e `flex-wrap: nowrap`. Em `desktop` e `xl` (`viewport ≥ 1024px`), o sistema deve **preservar o comportamento atual** (`overflow: hidden`, sem scroll-x) — chips que excedam a largura ficam clipados silenciosamente, como hoje. Esta separação evita mudança visual em desktop.
3.2 Em `mobile-s`, `mobile` e `tablet`, quando houver overflow horizontal nos chips, o sistema deve depender do **scrollbar nativo do browser** como indicação de overflow. Não introduzir elemento visual adicional (fade/sombra/setas) — decisão de manter o componente enxuto, sem novos elementos DOM.
3.3 Cada chip individual deve preservar `${field} ${operator}: ${value}` (texto completo via `title`/tooltip nativo, conforme já implementado). Em `mobile-s` e `mobile`, o valor deve truncar com ellipsis após no máximo **18 caracteres**; em `tablet`, após **28 caracteres**; em `desktop`/`xl`, manter o `max-width: 20rem` atual.
3.4 Em todos os breakpoints, o botão "remover filtro" (`pi-times-circle`) de cada chip deve ter alvo de toque com área mínima de **24x24 CSS px**, mesmo que o ícone visual seja menor.
3.5 Cada chip e seu botão de remoção devem ter `aria-label` descritivo no formato `"Remove filter ${field} ${operator} ${value}"` (hoje **falta** aria-label — ver [filterTagsDisplay/index.vue:101-104](src/components/base/advanced-filter-system-v2/filterTagsDisplay/index.vue#L101-L104)).
3.6 Se o usuário arrastar/scrollar horizontalmente os chips em touch, então o gesto **não deve** propagar para scroll vertical da página (`touch-action` controlado).
3.7 Quando o usuário navegar pelos chips via teclado (Tab), o sistema deve garantir que o chip focado fique visível mesmo em scroll horizontal (`scrollIntoView({ block: 'nearest', inline: 'nearest' })` ou equivalente CSS).
3.8 Em `desktop` e `xl`, o sistema deve **preservar integralmente** o comportamento atual de `FilterTagsDisplay` (`flex: 1`, `overflow: hidden`, sem scroll-x). Esta decisão de não tocar em desktop é deliberada — evita qualquer regressão visual ou comportamental para usuários desktop em incidente, que são o caso de uso principal hoje.
3.9 Quando a quantidade de chips for `0`, o sistema **não deve** renderizar o container `FilterTagsDisplay` (já implementado via `v-if="filterData?.fields?.length"`).

---

### 4. Densidade do header do gráfico

**User Story:** Como **engenheiro de aplicação**, **quero** que os controles do gráfico (botão de colapso, contador de eventos, seletor de view, hint de zoom) se adaptem ao espaço disponível, **para que** eu não perca controles funcionais por sobreposição em mobile.

**Acceptance Criteria:**

4.1 Em `mobile-s` e `mobile`, o sistema deve ocultar o hint "Drag to zoom" (`.chart-header__hint`), preservando o comportamento atual em [event-chart.vue:908-910](src/views/RealTimeEventsV2/Blocks/components/event-chart.vue#L908-L910).
4.2 Em `mobile-s` e `mobile`, o sistema deve reduzir o seletor de view (`.chart-header__view-trigger`) para `min-width: 5rem` e `max-width: 7rem` com truncamento por ellipsis, ocultando o label "View" externo (`.chart-header__view-label`).
4.3 Em `mobile-s`, o sistema deve manter visível: botão de colapso, contador "N events" e seletor de view, sem sobreposição entre eles. Se necessário, o header pode quebrar em duas linhas via `flex-wrap: wrap` (já presente).
4.4 Em `tablet`, o sistema deve preservar o hint "Drag to zoom" e o seletor de view com label "View" completa.
4.5 Em todos os breakpoints, o botão de colapso (`.chart-header__collapse-btn`) deve ter área de toque mínima de **24x24 CSS px** (hoje `1.25rem × 1.25rem` = 20px — **violação atual**, esta spec corrige).
4.6 O botão seletor de view deve ter `aria-label="Change chart view"` (hoje **falta** — ver [event-chart.vue:467-479](src/views/RealTimeEventsV2/Blocks/components/event-chart.vue#L467-L479)).
4.7 Quando o gráfico estiver collapsed (`collapsed === true`), o sistema deve exibir o label "CHART" abreviado em vez do contador, em todos os breakpoints (comportamento atual preservado).
4.8 Em `mobile-s` e `mobile`, o contador (`.chart-header__total + .chart-header__label`) deve usar `font-size: 0.75rem` para o número e ocultar a palavra "events" se a largura disponível for `< 60px`.

---

### 5. Interações touch (brush-to-zoom e tooltip do gráfico)

**User Story:** Como **operador de plataforma**, **quero** usar zoom e tooltip do gráfico em tablet e mobile via touch, **para que** durante um incidente eu não fique limitado a usar o laptop.

**Acceptance Criteria:**

5.1 Em dispositivos com `pointer: coarse` (touch primário), o sistema deve responder a `touchstart`/`touchmove`/`touchend` (ou `pointerdown`/`pointermove`/`pointerup` unificados) para brush-to-zoom no gráfico, replicando o comportamento atual de mouse em [event-chart.vue:239-284](src/views/RealTimeEventsV2/Blocks/components/event-chart.vue#L239-L284) (hoje **só responde a mouse** — gap crítico).
5.2 Quando o usuário tocar o gráfico em touch, o sistema deve exibir o tooltip do C3 ancorado ao bar/ponto tocado, persistindo até novo toque fora do gráfico ou após **3 segundos** sem novo toque.
5.3 Em touch, o brush-to-zoom deve exigir movimento horizontal mínimo de **5%** da largura do gráfico (paridade com mouse, [event-chart.vue:271](src/views/RealTimeEventsV2/Blocks/components/event-chart.vue#L271)) para emitir `brush-select`.
5.4 Em touch, durante o brush-to-zoom, o sistema deve aplicar `touch-action: pan-y` ao container do gráfico para evitar conflito com scroll vertical da página.
5.5 Em dispositivos com `pointer: fine` (mouse), o sistema deve manter exatamente o comportamento atual (sem regressão).
5.6 Quando o usuário tocar fora do gráfico após um brush, o sistema deve esconder o tooltip e a `chart-selection` overlay.
5.7 Em qualquer breakpoint, o cursor `crosshair` ([event-chart.vue:777](src/views/RealTimeEventsV2/Blocks/components/event-chart.vue#L777)) só deve ser aplicado quando `pointer: fine` (evita override de cursor em touch puro).
5.8 O sistema **não deve** emitir `brush-select` em tap simples (sem movimento horizontal mínimo) — taps curtos devem ser tratados como hover/tooltip apenas.

---

### 6. Seletor de Time Range em mobile

**User Story:** Como **engenheiro de aplicação**, **quero** abrir e ajustar o range de tempo (Last 7 days, custom range) em mobile sem que o painel saia da tela ou fique inutilizável, **para que** eu consiga investigar eventos do celular.

**Acceptance Criteria:**

6.1 Em `mobile-s` e `mobile`, quando o usuário abrir o seletor de time range, o sistema deve exibir o painel com `max-width: calc(100vw - 1rem)` e `max-height: calc(100dvh - 4rem)` com scroll interno.
6.2 Em `mobile-s` e `mobile`, o painel de time range deve abrir alinhado pela borda direita do trigger se houver espaço; caso contrário, alinhar pela borda esquerda — sem que parte do painel fique fora do viewport.
6.3 Em `tablet` e acima, o sistema deve preservar o comportamento atual de abertura do painel (sem regressão).
6.4 Em qualquer breakpoint, o input de range customizado deve aceitar entrada via teclado (sem dependência exclusiva de date-picker visual) preservando `filterDateRangeMaxDays={365}` ([filter-bar.vue:71](src/views/RealTimeEventsV2/Blocks/components/filter-bar.vue#L71)).
6.5 Quando o usuário trocar de breakpoint enquanto o painel de time range estiver aberto, o sistema deve fechá-lo (evita painel órfão posicionado fora do trigger).
6.6 O sistema deve preservar a validação atual `isInvalidRange` (rejeitar "now to now") em todos os breakpoints.

---

### 7. Overlays e painéis teleportados (saved searches, query history, view dropdown)

**User Story:** Como **operador de plataforma**, **quero** que os painéis "Saved searches", "Query history" e o dropdown de View do gráfico funcionem em mobile sem estourar o viewport, **para que** eu consiga usar busca salva e trocar de view do celular.

**Acceptance Criteria:**

7.1 O painel "Saved searches" deve manter `width: 360px` em `tablet`+ e `width: calc(100vw - 1rem)` em `mobile`/`mobile-s` (hoje já tem `max-width: calc(100vw - 2rem)` — esta spec **reduz a margem em mobile** para 0.5rem cada lado).
7.2 O painel "Query history" deve usar `width: min(400px, calc(100vw - 1rem))` em todos os breakpoints (hoje 400px fixo pode estourar em viewports `< 432px`).
7.3 Em `mobile-s` e `mobile`, o dropdown "View" do gráfico ([event-chart.vue:480-516](src/views/RealTimeEventsV2/Blocks/components/event-chart.vue#L480-L516)) deve ser apresentado como **bottom-sheet** ancorado à borda inferior do viewport, com:
   - `position: fixed; bottom: 0; left: 0; right: 0`
   - `width: 100%` (ignorando a posição do trigger)
   - `max-height: 60dvh` com scroll vertical interno
   - Cantos superiores arredondados (`border-radius: 12px 12px 0 0`)
   - Backdrop escuro semitransparente atrás (`background: rgba(0,0,0,0.4)`) que captura tap-fora para fechar
   - Indicador visual de arraste (handle) no topo
   - Botão de fechar visível no canto superior direito do sheet
   **Restrição de implementação**: usar o mesmo `<Teleport to="body">` atual ([event-chart.vue:480](src/views/RealTimeEventsV2/Blocks/components/event-chart.vue#L480)) alternando estilo via `matchMedia('(max-width: 639px)')`. **Não introduzir nova dependência** (sem libs de bottom-sheet). Em `tablet`+, manter o popover teleportado atual com `updateViewPanelPosition`.
7.4 Em `tablet`+, o sistema deve recalcular posição do painel View via `updateViewPanelPosition` também em `orientationchange` e `visualViewport.resize` (hoje só `scroll` e `resize`). Quando o usuário rolar a página com o dropdown View aberto, o sistema deve manter o painel alinhado ao trigger ou fechá-lo se o trigger sair do viewport visível.
7.5 O Dataset Dropdown (PrimeVue, `appendTo="body"`) deve respeitar `max-width: calc(100vw - 1rem)` em todos os breakpoints; o painel teleportado **não deve** ultrapassar a borda direita do viewport em `mobile-s`.
7.6 Botões de ação dentro dos overlays (save, delete, clear history) devem ter `aria-label` descritivo (hoje **faltam** — ver `saved-searches-overlay.vue` e `query-history-overlay.vue`).
7.7 Em `mobile-s` e `mobile`, todos os overlays devem ter dismissal por: (a) tap fora, (b) tecla Esc (já implementado para o dropdown View), (c) botão de fechar visível dentro do overlay quando aplicável.

---

### 8. Refresh manual e auto-refresh

**User Story:** Como **operador de plataforma**, **quero** que o botão Refresh seja sempre alcançável e que o auto-refresh não interfira com minha edição no celular, **para que** eu mantenha controle do que estou vendo.

**Acceptance Criteria:**

8.1 Em todos os breakpoints, o botão Refresh deve ter área mínima de **44x44 CSS px** e `aria-label="Refresh data"`.
8.2 Em `mobile-s` e `mobile`, o botão Refresh pode exibir apenas o ícone (sem o label "Refresh") desde que mantenha o `aria-label`.
8.3 Quando uma requisição de dados estiver em curso (loading), o sistema deve indicar visualmente no botão Refresh (spinner ou disabled state) em todos os breakpoints.
8.4 Quando o usuário tiver foco no input AQL ou no Dataset selector em mobile, o auto-refresh tick (`onAutoRefreshTick`, [advanced-filter-system-v2/index.vue:193](src/components/base/advanced-filter-system-v2/index.vue#L193)) **não deve** disparar fetch que invalide o input em edição.
8.5 O sistema deve preservar o comportamento de relative ranges ("last N days", "now") ao auto-refresh em todos os breakpoints.
8.6 Quando `document.visibilityState === 'hidden'` (aba do browser oculta) em qualquer breakpoint, o sistema deve **pausar o auto-refresh tick**. Quando o evento `visibilitychange` disparar com `visibilityState === 'visible'`, o sistema deve retomar o auto-refresh e, se o último fetch tiver mais de **1 intervalo de refresh** de idade, disparar um fetch imediato (catch-up).
8.7 O sistema deve registrar o handler de `visibilitychange` no mount e remover no unmount/deactivated, sem vazamento de listener.

---

### 9. ResizableSplitter (handle entre painéis)

**User Story:** Como **engenheiro de aplicação**, **quero** que o divisor entre painéis seja confortável de usar em tablet com touch, **para que** eu consiga ajustar a área do gráfico vs lista de eventos.

**Acceptance Criteria:**

9.1 Em `tablet`, o sistema deve aumentar a área clicável do handle do `ResizableSplitter` para no mínimo **8px** de largura visual (hoje 6px — [ResizableSplitter.vue handle width 0.375rem](src/components/Splitter/ResizableSplitter.vue)).
9.2 Em `tablet`, o sistema deve preservar o suporte a touch já presente (`@touchstart.passive`).
9.3 Em `mobile-s` e `mobile` (viewport `< 640px`), o sistema deve **ocultar o handle e o painel de field-sidebar**. Alinhar a media query de [tab-panel-block.vue:663-673](src/views/RealTimeEventsV2/Blocks/tab-panel-block.vue#L663-L673) de `768px` para `640px` para usar o token `tablet` desta spec (decisão de padronização: tokens sempre prevalecem sobre magic numbers existentes).
9.4 Em `desktop` e `xl`, o sistema deve preservar comportamento atual sem regressão.

---

## Non-Functional Requirements

### 10. Performance

10.1 O sistema deve manter o tempo de re-render do gráfico em mudança de breakpoint ≤ **150ms** medido localmente (debounce ResizeObserver 80ms + redraw C3 via `chartInstance.resize()` em [event-chart.vue:203-214](src/views/RealTimeEventsV2/Blocks/components/event-chart.vue#L203-L214)).
10.2 O sistema **não deve** adicionar dependências runtime novas (sem `@vueuse/core`, sem libs de breakpoint) — toda lógica responsiva via CSS `@media`, `window.matchMedia` nativo ou container queries.
10.3 O sistema **deve** prevenir loops de `ResizeObserver` (erro `ResizeObserver loop completed with undelivered notifications`) durante qualquer mudança de viewport, splitter drag, transição de altura via media query ou colapso/expansão do gráfico. **Mitigação obrigatória**: o callback do observer deve estar envolvido em `requestAnimationFrame` **ou** usar flag de re-entrada (`isObserving`/`pendingResize`) que ignora notificações enquanto um redraw já estiver pendente. Validar via console em DevTools (Chrome, Safari, Firefox) com zero ocorrências do erro durante 30s de uso intensivo (drag splitter + abrir/fechar sidebar + rotação de device).
10.4 Em mobile com `prefers-reduced-motion: reduce`, o sistema deve omitir transições CSS de re-layout da filter bar e gráfico.
10.5 O sistema deve manter o `buildToken` ([event-chart.vue:159](src/views/RealTimeEventsV2/Blocks/components/event-chart.vue#L159)) para invalidar builds em-vôo durante mudanças rápidas de breakpoint.

10.6 **Zero memory leaks** — regra inviolável. Todo subscribe/listener/observer/timer introduzido por esta entrega deve ter cleanup simétrico garantido:
   - `window.addEventListener` / `document.addEventListener` → `removeEventListener` correspondente em `onBeforeUnmount` **e** `onDeactivated` (componente está sob `<keep-alive>`).
   - `setInterval`/`setTimeout` → `clearInterval`/`clearTimeout` em todos os caminhos de unmount/deactivated, com a ref zerada.
   - `ResizeObserver`/`MutationObserver`/`IntersectionObserver` → `disconnect()` + ref zerada.
   - `requestAnimationFrame` → `cancelAnimationFrame` no handle salvo.
   - `matchMedia(...)` → `mql.removeEventListener('change', handler)` simétrico.
   - Bottom-sheet do critério 7.3 (backdrop, dismiss handlers) → todos os listeners removidos ao fechar/unmount.
   - Handler de `visibilitychange` do critério 8.6 → removido em unmount/deactivated.

10.7 O sistema deve incluir, em qualquer arquivo tocado por esta entrega, **simetria explícita** entre o setup do listener/observer e o cleanup correspondente, no mesmo arquivo, com nome de handler idêntico (sem `bind` inline anônimo que impossibilita remoção).

10.8 Testes unitários (Vitest + @vue/test-utils) devem montar/desmontar o componente alvo em loop (≥ 10 ciclos) sem aumento monotônico no número de listeners registrados em `window` (`window.__listenerCount__` instrumentado no test setup ou snapshot via `getEventListeners` em E2E).

### 11. Acessibilidade (WCAG 2.1 AA)

11.1 Em todos os breakpoints, alvos de toque interativos (botões, chips clicáveis, controles do gráfico, handle do splitter quando visível) devem ter área mínima de **24x24 CSS px** (WCAG 2.5.8 Target Size — Minimum); em `mobile-s`/`mobile`/`tablet` o mínimo sobe para **44x44 CSS px** (WCAG 2.5.5 Target Size — Enhanced).
11.2 Em todos os breakpoints, o sistema deve preservar a ordem lógica de tabulação na filter bar: Dataset → botão saved searches → input AQL → time range → refresh → primeiro chip → próximo chip.
11.3 Quando o usuário usar teclado para navegar pelos chips em scroll horizontal, o sistema deve garantir que o chip focado fique visível.
11.4 O sistema deve manter contraste mínimo **4.5:1** para textos da filter bar e do gráfico em todos os breakpoints (sem regressão das cores atuais que dependem de `--text-color` e `--text-color-secondary`).
11.5 O sistema deve adicionar os `aria-label` faltantes (compilados na exploração):
   - Botão "saved searches" em [filter-bar.vue:56-62](src/views/RealTimeEventsV2/Blocks/components/filter-bar.vue#L56-L62) → `aria-label="Open saved searches"`.
   - Botão "View" do gráfico em [event-chart.vue:467-479](src/views/RealTimeEventsV2/Blocks/components/event-chart.vue#L467-L479) → `aria-label="Change chart view"`.
   - Botão remove em `FilterTagsDisplay` → `aria-label="Remove filter ${field} ${operator} ${value}"`.
   - Botões save/delete em `saved-searches-overlay.vue` → `aria-label="Save current search"`, `aria-label="Delete saved search"`.
   - Botão clear em `query-history-overlay.vue` → `aria-label="Clear query history"`.
11.6 O sistema deve preservar foco visível (`focus-visible`) em todos os controles interativos em mobile (não suprimir `:focus` por preferência estética).
11.7 Em screen reader, o gráfico deve expor pelo menos: total de eventos, range de tempo, e instrução de uso ("Use the brush selection to zoom into a time range"). Aceitável via `aria-describedby` ou texto visualmente oculto.

### 12. Compatibilidade de Browsers e Devices

12.1 O sistema deve funcionar sem regressão em: **iOS Safari 16+**, **Chrome Android 110+**, **Chrome desktop 120+**, **Firefox 120+**, **Safari macOS 16+**, **Edge 120+**.
12.2 Em **iOS Safari**, o sistema deve usar `100dvh` (dynamic viewport height) onde hoje há `100vh` ou tratar a barra dinâmica para evitar conteúdo cortado.
12.3 Em **iOS Safari**, o modo fullscreen ([tab-panel-block.vue:454](src/views/RealTimeEventsV2/Blocks/tab-panel-block.vue#L454)) deve preservar safe-area-inset (`env(safe-area-inset-top/bottom/left/right)`) nos padding.
12.4 Em **Android Chrome**, o teclado virtual ao focar o input AQL **não deve** disparar `ResizeObserver` que cause loop ou rebuild do gráfico.
12.5 O sistema deve evitar `position: fixed` para overlays que dependem de `dvh`/safe-area sem fallback — preferir `position: absolute` ancorado por JS (já feito para o View dropdown).

### 13. Observabilidade & QA

13.1 O sistema deve preservar os `data-testid` existentes sem renomear/remover. Lista mínima inviolável:
   - `event-chart` ([event-chart.vue:426](src/views/RealTimeEventsV2/Blocks/components/event-chart.vue#L426))
   - `event-chart-view` ([event-chart.vue:462](src/views/RealTimeEventsV2/Blocks/components/event-chart.vue#L462))
   - `dataset-selector-top` ([filter-bar.vue:51](src/views/RealTimeEventsV2/Blocks/components/filter-bar.vue#L51))
   - `session-toolbar`, `rte-tab-{id}`, `open-session-browser-button`, `share-current-view-button` ([TabsView.vue](src/views/RealTimeEventsV2/TabsView.vue))
   - `field-sidebar`
13.2 Onde novos elementos forem introduzidos (ex: wrapper de scroll de chips, overlay de time range, indicador de overflow lateral), o sistema deve incluir `data-testid` descritivo seguindo a convenção: `rte-<componente>-<elemento>`.
13.3 O sistema deve adicionar testes E2E (ou unit + Vue Test Utils) que verifiquem para cada breakpoint definido na seção 0:
   - Altura do `.chart-container` dentro da faixa esperada.
   - Layout esperado da filter bar (linha única, 2 linhas ou stack).
   - Scroll horizontal nos chips quando `n_chips × max_chip_width > container_width`.
13.4 O sistema **não deve** introduzir warnings/erros novos no console durante mudança de viewport em DevTools (validar Chrome + Safari).

---

## Out of Scope (não será alterado nesta entrega)

- Responsividade da **document list** (`discover-data-table.vue`) e do **detail sidebar** (`detail-sidebar-panel.vue`).
- Responsividade da **summary bar** de KPIs (`events-summary-bar.vue`: Avg Request Time, 4XX, 5XX) — mantém breakpoint 960px atual.
- Responsividade da **field sidebar** (`field-sidebar.vue`).
- Responsividade da **discover toolbar** (já tem breakpoints 900/1100px — manter).
- Introdução de **`useBreakpoints` composable global** ou dependência `@vueuse/core`.
- Refatoração da lib de gráfico (manter **C3**); migração para outra lib é decisão futura.
- Alterações em rotas, navegação V1↔V2, seleção de tabs ou `SessionTabHeader`.
- Dark mode / tema adicional além do já existente.
- Mudança em `filterDateRangeMaxDays` ou na lógica de relative ranges.
- Mudança em GraphQL playground integration.
- Internacionalização / RTL.

---

## Decisions Log (open questions resolved)

| # | Decisão | Reflexo nos critérios |
|---|---------|------------------------|
| D1 | Ticks calculados dinamicamente em função da largura disponível e do rótulo mais longo (gap ≥ 8px), com decimação preservando primeiro/último. Sem caps fixos. | 1.4, 1.5, 1.6 |
| D2 | Em `tablet`, linha 2 da filter bar (range + refresh) alinha à direita (`flex-end`), consistente com a borda direita do desktop. | 2.2 |
| D3 | Tooltip em touch usa tap-to-show com auto-dismiss em 3s. | 5.2 |
| D4 | Dropdown "View" em `mobile-s`/`mobile` vira **bottom-sheet** ancorado na borda inferior, sem nova dependência (reuso do `<Teleport to="body">` com `matchMedia`). Em `tablet`+, mantém popover atual. | 7.3, 7.4 |
| D5 | Sempre usar tokens de breakpoint desta spec. Field-sidebar passa a esconder em `< 640px` (era 768px). | 9.3 |
| D6 | `ResizeObserver` loop é **proibido**. Mitigação obrigatória via `requestAnimationFrame` wrap ou flag de re-entrada. Validar com 30s de uso intensivo (zero ocorrências). | 10.3 |
| D7 | Chips de filtro usam scroll-x apenas em **mobile/tablet** (`< 1024px`). Em desktop/xl preservar comportamento atual (`overflow: hidden`). Sem fade indicator em nenhum breakpoint. Decisão revisada após a fase de design para evitar mudanças visíveis em desktop. | 3.1, 3.2, 3.8 |
| D8 | Auto-refresh pausa em `visibilityState === 'hidden'` e faz catch-up no retorno se o tick estiver atrasado. | 8.6, 8.7 |
