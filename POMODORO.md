# Pomodoro

Documentação funcional e técnica dos plugins Moodle `local_pomodoro` e `block_pomodoro`.

Este arquivo complementa o [README principal](README.md). Ele explica como o Pomodoro funciona dentro do projeto, quais decisões técnicas foram tomadas e quais elementos aparecem para o usuário.

## Visão geral

O Pomodoro foi implementado como dois plugins Moodle que trabalham juntos:

| Plugin | Papel |
| --- | --- |
| `local_pomodoro` | Controla a experiência global: carrega JavaScript/CSS, renderiza botão e painel flutuante, oferece a página fullscreen e mantém o estado no navegador |
| `block_pomodoro` | Fornece um ponto de entrada em páginas do Moodle, com resumo do timer, configuração rápida e link para a tela cheia |

A decisão de separar em dois plugins evita que o bloco precise assumir responsabilidades globais. O bloco é apenas uma porta de entrada; o plugin local mantém o comportamento compartilhado entre páginas.

## Como instalar e acessar

Depois de subir o ambiente, execute o upgrade do Moodle para registrar os plugins:

```bash
docker compose exec -u www-data -w /var/www/moodle moodle \
  php public/admin/cli/upgrade.php --non-interactive
```

Para usar o bloco:

1. Acesse o Moodle com um usuário que possa editar blocos.
2. Ative o modo de edição no painel ou em uma página de curso.
3. Adicione o bloco `Pomodoro`.

Para abrir a tela cheia diretamente:

```text
http://localhost:8080/local/pomodoro/index.php
```

## Elementos da interface

| Elemento | Significado |
| --- | --- |
| Bloco Pomodoro | Card adicionável no Moodle para iniciar o timer, alterar tempos e abrir a tela cheia |
| Floating button | Botão flutuante global exibido durante uma sessão ativa |
| Floating time | Tempo restante mostrado dentro do botão flutuante |
| Floating phase | Fase atual exibida no botão flutuante, como foco ou pausa |
| Floating cycle | Ciclo atual exibido no botão flutuante |
| Floating panel | Painel expandido aberto a partir do botão flutuante |
| Panel time | Tempo principal exibido no painel |
| Panel inline time | Variação compacta do tempo usada dentro do painel |
| Panel phase | Fase atual exibida no painel |
| Panel cycle | Ciclo atual exibido no painel |
| Fullscreen | Página dedicada do Pomodoro com timer em destaque |
| Range outputs | Textos ao lado dos controles de tempo, como `25min`, `5min` ou `4` |

O mesmo estado alimenta todas as interfaces. Se o usuário inicia pelo bloco, pode acompanhar pelo botão flutuante ou pela página fullscreen.

## Valores importantes

Os valores padrão ficam em `plugins/local/pomodoro/amd/src/default_settings.js`.

| Configuração | Padrão | Limite |
| --- | --- | --- |
| Foco | `25min` | De `30s` a `30min` nos controles de duração |
| Descanso curto | `5min` | De `30s` a `30min` nos controles de duração |
| Descanso longo | `15min` | De `30s` a `30min` nos controles de duração |
| Ciclos antes do descanso longo | `4` | De `1` a `10` |

Internamente, as durações são normalizadas em passos de `30` segundos. Isso evita valores quebrados ou difíceis de controlar pela interface.

## Estados do timer

O estado principal fica em `pomodoro_state` no `localStorage`.

| Campo | Função |
| --- | --- |
| `status` | Situação geral: `idle`, `running` ou `paused` |
| `mode` | Fase atual: `focus`, `short_break` ou `long_break` |
| `startedAt` | Horário em que o ciclo atual começou |
| `endsAt` | Horário em que o ciclo atual deve terminar |
| `pausedRemainingSeconds` | Tempo restante salvo quando o timer está pausado |
| `currentCycle` | Número do ciclo atual |
| `cycleId` | Identificador único do ciclo, usado para evitar notificação duplicada |

Estados possíveis:

| Estado | Comportamento |
| --- | --- |
| `idle` | Nenhuma sessão ativa. A UI mostra o tempo de foco configurado |
| `running` | O timer está contando até `endsAt` |
| `paused` | A contagem está parada e o tempo restante fica salvo em `pausedRemainingSeconds` |

Modos possíveis:

| Modo | Quando aparece |
| --- | --- |
| `focus` | Período de foco |
| `short_break` | Descanso curto entre ciclos |
| `long_break` | Descanso longo após a quantidade configurada de ciclos |

## Como o tempo é calculado

A referência principal do timer é `endsAt`.

Quando uma sessão começa, o código calcula:

```text
endsAt = Date.now() + duracaoEmSegundos * 1000
```

Depois, o tempo restante é recalculado a partir do relógio atual:

```text
tempoRestante = endsAt - Date.now()
```

Essa decisão é importante porque o timer continua coerente mesmo se:

- o usuário troca de página;
- o navegador atrasa um `setInterval`;
- a aba fica em segundo plano;
- a interface é reconstruída depois de um reload.

O sistema não depende de uma variável em memória decrementando a cada segundo. O `tick` apenas recalcula o tempo e redesenha as regiões visíveis.

## Início, pausa, retomada e cancelamento

O fluxo principal fica em `plugins/local/pomodoro/amd/src/timer.js`.

| Ação | O que acontece |
| --- | --- |
| Iniciar | Salva as configurações, cria um estado `running`, define `mode: focus`, calcula `endsAt` e renderiza a UI |
| Pausar | Calcula o tempo restante, troca `status` para `paused`, limpa `endsAt` e salva `pausedRemainingSeconds` |
| Retomar | Usa `pausedRemainingSeconds` para calcular um novo `endsAt` e volta para `running` |
| Cancelar | Restaura o estado padrão, voltando para `idle`, `focus` e ciclo `1` |

A pausa não deixa o tempo continuar correndo. Por isso o `endsAt` é limpo enquanto o timer está pausado.

## Ciclos

Quando o tempo chega a zero, `completeCycle` confirma que:

1. o timer está em `running`;
2. o tempo realmente acabou;
3. a aba atual pode liderar os efeitos colaterais.

Depois disso, ele notifica o usuário, calcula o próximo ciclo e salva o novo estado.

Regra de avanço:

| Situação atual | Próxima fase |
| --- | --- |
| `focus` antes do limite de ciclos | `short_break` |
| `focus` no limite de ciclos | `long_break` |
| `short_break` | `focus` com `currentCycle + 1` |
| `long_break` | `focus` com `currentCycle = 1` |

## Sincronização entre abas

O Pomodoro pode estar aberto em várias abas do Moodle. Para manter tudo alinhado, o projeto usa recursos nativos do navegador:

| Recurso | Uso |
| --- | --- |
| `localStorage` | Guarda estado, configurações, liderança e última notificação |
| `sessionStorage` | Guarda o identificador da aba atual |
| Evento `storage` | Avisa outras abas quando estado ou configurações mudam |

Quando uma aba altera `pomodoro_state` ou `pomodoro_settings`, as outras abas recebem o evento `storage` e renderizam novamente.

## Por que existe uma aba líder

Sem liderança, várias abas poderiam perceber o fim do ciclo ao mesmo tempo e repetir ações como:

- tocar som;
- abrir alerta do Moodle;
- mostrar notificação do navegador;
- avançar para o próximo ciclo.

Para evitar isso, `tabs.js` cria uma liderança simples:

1. cada aba ganha um `tabId`;
2. a aba líder grava esse `tabId` em `pomodoro_active_tab`;
3. a liderança é atualizada periodicamente por heartbeat;
4. se o heartbeat expira, outra aba pode assumir.

O heartbeat roda a cada `2000ms`. A liderança expira após `6000ms`. Assim, se a aba líder for fechada ou travar, outra aba assume em poucos segundos.

## Chaves de armazenamento

As chaves ficam em `plugins/local/pomodoro/amd/src/constants.js`.

| Chave | Conteúdo |
| --- | --- |
| `pomodoro_settings` | Tempos configurados e ciclos antes da pausa longa |
| `pomodoro_state` | Estado atual do timer |
| `pomodoro_last_notification` | Último ciclo que já notificou o usuário |
| `pomodoro_active_tab` | Aba líder atual |
| `pomodoro_tab_id` | Identificador da aba na sessão do navegador |

## Notificações

Ao concluir um ciclo, o plugin tenta avisar o usuário de três formas:

| Canal | Implementação |
| --- | --- |
| Alerta visual Moodle | `core/notification` |
| Notificação do navegador | API `Notification`, se o usuário permitir |
| Som curto | `AudioContext`, quando o navegador permite áudio |

O aviso é best-effort: se o navegador bloquear som ou notificação, o timer continua funcionando.

## Mapa dos módulos AMD

| Módulo | Responsabilidade |
| --- | --- |
| `timer.js` | Orquestra inicialização, tick, renderização, início, pausa, retomada e cancelamento |
| `time.js` | Calcula tempo restante, cria estado de ciclo e decide o próximo ciclo |
| `settings.js` | Normaliza, lê, salva e escreve configurações nos formulários |
| `storage.js` | Encapsula leitura e escrita segura no `localStorage` |
| `tabs.js` | Controla `tabId`, liderança e heartbeat entre abas |
| `notifications.js` | Dispara alerta Moodle, notificação do navegador e som |
| `ui.js` | Registra regiões visuais e atualiza bloco, painel, botão e fullscreen |
| `animations.js` | Alterna classes CSS para abrir, fechar e exibir elementos |
| `default_settings.js` | Define estado inicial, padrões e limites |
| `constants.js` | Centraliza chaves de storage, classes e tempos técnicos |

## Build JavaScript

O Moodle carrega os arquivos minificados de `amd/build`, não os arquivos de `amd/src`.

Para apenas usar o projeto, não é necessário rodar o build JavaScript manualmente. Caso você queira modificar o JavaScript do Pomodoro, edite os arquivos em `plugins/local/pomodoro/amd/src` e gere novamente os artefatos de `amd/build` com:

```bash
docker compose --profile tools run --rm moodle-js
```

Depois do build, versione os arquivos fonte e os artefatos gerados:

```text
plugins/local/pomodoro/amd/src/*.js
plugins/local/pomodoro/amd/build/*.min.js
plugins/local/pomodoro/amd/build/*.min.js.map
```

Se o navegador continuar usando uma versão antiga, limpe o cache do Moodle:

```bash
docker compose exec -u www-data -w /var/www/moodle moodle \
  php public/admin/cli/purge_caches.php
```

## Checklist de teste manual

- Adicionar o bloco `Pomodoro` em uma página do Moodle.
- Iniciar uma sessão pelo bloco.
- Confirmar se o botão flutuante aparece durante a sessão.
- Abrir e fechar o painel flutuante.
- Pausar, retomar e cancelar a sessão.
- Abrir `/local/pomodoro/index.php`.
- Alterar tempos pelo bloco, painel e fullscreen.
- Abrir duas abas e verificar se estado e configurações sincronizam.
- Confirmar que o fim de ciclo notifica apenas uma vez.
- Validar troca de `focus` para `short_break` e `long_break`.

## Decisões e limites do MVP

- O estado fica no navegador, não no banco de dados.
- Não há histórico de sessões Pomodoro.
- Não há sincronização entre dispositivos diferentes.
- O timer é pessoal para o navegador atual.
- O HTML estrutural fica em Mustache; o JavaScript fica responsável por estado, eventos e renderização dinâmica.
- A liderança entre abas protege apenas efeitos colaterais, como notificações e avanço de ciclo.

Essas decisões mantêm o plugin simples, compatível com o escopo do desafio e fácil de evoluir depois.
