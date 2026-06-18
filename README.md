# Moodle Docker Challenge

<p align="center">
  <img alt="Moodle" src="https://img.shields.io/badge/Moodle-5.2.1-f98012?logo=moodle&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Compose-2496ed?logo=docker&logoColor=white">
  <img alt="PHP" src="https://img.shields.io/badge/PHP-8.3-777bb4?logo=php&logoColor=white">
  <img alt="MySQL" src="https://img.shields.io/badge/MySQL-8.4-4479a1?logo=mysql&logoColor=white">
  <img alt="Apache" src="https://img.shields.io/badge/Apache-HTTPD-d22128?logo=apache&logoColor=white">
</p>

Ambiente Moodle totalmente containerizado para gerenciamento acadêmico básico, com Moodle, MySQL, persistência de dados e carga inicial automatizada de alunos, disciplinas e matrículas.

Este projeto foi desenvolvido para um desafio técnico de Desenvolvedor Moodle Júnior, priorizando execução local simples, boa organização Docker, uso de variáveis de ambiente e customizações Moodle por plugins `local` e `block`.

O README funciona como a porta de entrada do projeto: primeiro mostra como executar, depois explica o escopo, as decisões técnicas e onde encontrar documentação mais detalhada.

## Sumário

- [O que é o Moodle?](#o-que-e-o-moodle)
- [Sobre o desafio técnico](#sobre-o-desafio-tecnico)
- [Stack e arquitetura](#stack-e-arquitetura)
- [Pré-requisitos](#pre-requisitos)
- [Início rápido](#inicio-rapido)
- [Como executar](#como-executar)
- [Carga inicial de dados](#carga-inicial-de-dados)
- [Plugin local `seeddata`](#plugin-local-seeddata)
- [Plugins Pomodoro](#plugins-pomodoro)
- [Build JavaScript dos plugins](#build-javascript-dos-plugins)
- [Variáveis de ambiente](#variaveis-de-ambiente)
- [Comandos úteis](#comandos-uteis)
- [Decisões técnicas](#decisoes-tecnicas)
- [Escopo e suposições](#escopo-e-suposicoes)
- [Solução de problemas](#solucao-de-problemas)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Licença](#licenca)

## Documentação complementar

| Documento | Quando ler |
| --- | --- |
| [POMODORO.md](POMODORO.md) | Detalhes funcionais e técnicos dos plugins `local_pomodoro` e `block_pomodoro` |

<a id="o-que-e-o-moodle"></a>

## O que é o Moodle?

O [Moodle](https://docs.moodle.org/502/en/About_Moodle) é um LMS, ou Learning Management System, usado para criar ambientes virtuais de aprendizagem. Ele oferece recursos para administração de cursos, usuários, atividades, avaliações, conteúdos e extensões por plugins.

Neste projeto, o Moodle é usado como base para simular um ambiente acadêmico local, com cursos e alunos criados automaticamente.

<a id="sobre-o-desafio-tecnico"></a>

## Sobre o desafio técnico

O desafio propõe a construção de um ambiente Moodle local e funcional usando Docker. Os pontos principais do escopo são:

| Requisito | Implementação neste projeto |
| --- | --- |
| Moodle containerizado | Imagem própria baseada em `php:8.3-apache-bookworm` |
| Banco relacional | Serviço `mysql:8.4` no Docker Compose |
| Persistência de dados | Volumes Docker para MySQL e `moodledata` |
| Carga inicial | Plugin local com script CLI idempotente |
| 10 disciplinas | Definidas em `plugins/local/seeddata/data/courses.json` |
| 10 alunos | Definidos em `plugins/local/seeddata/data/users.json` |
| Matrículas | Todos os alunos são matriculados em todos os cursos |
| Customização Moodle | Plugins `local_seeddata`, `local_pomodoro` e `block_pomodoro` |
| Documentação | README com execução, decisões e suposições |

O repositório entrega:

- ambiente Moodle local com Docker Compose;
- banco MySQL persistido por volume;
- scripts automatizados de setup para Linux e Windows;
- plugin `local_seeddata` para carga inicial idempotente;
- plugins Pomodoro com bloco, botão flutuante global, tela cheia e JavaScript AMD;
- serviço utilitário para compilar os AMD dos plugins sem levar Node.js para a imagem final.

<a id="stack-e-arquitetura"></a>

## Stack e arquitetura

| Camada | Tecnologia | Observação |
| --- | --- | --- |
| LMS | Moodle `v5.2.1` | Código baixado do repositório oficial durante o build |
| Runtime | PHP `8.3` + Apache | Imagem final `php:8.3-apache-bookworm` |
| Banco | MySQL `8.4` | Configurado com os valores no .env |
| Orquestração | Docker Compose | Serviços separados para `moodle` e `mysql` |
| Customização | Plugins Moodle | Seed acadêmico e Pomodoro global com bloco de entrada |
| Build JS | Node.js `22` + Grunt | Serviço utilitário acionado apenas quando `amd/src` muda |
| Configuração | `.env` + `config/config.php` | Senhas e URLs ficam fora da imagem |

Fluxo simplificado:

```text
Navegador
   |
   v
localhost:8080
   |
   v
Container moodle
   |-- Apache -> /var/www/moodle/public
   |-- config.php -> variáveis de ambiente
   |-- local_seeddata -> cria usuários, cursos e matrículas
   |
   v
Container mysql
   |
   v
Volume mysql_data
```

<a id="pre-requisitos"></a>

## Pré-requisitos

Antes de executar, garanta que sua máquina tenha:

- **Docker** instalado.
- **Docker Compose** disponível pelo comando `docker compose`.
- **Git** para clonar o repositório.
- **Bash** no Linux/macOS ou **PowerShell** no Windows, caso use os scripts automatizados.

<a id="inicio-rapido"></a>

## Início rápido

Para subir o ambiente com o fluxo recomendado, clone o repositório, copie o arquivo de ambiente e execute o setup da sua plataforma.

Linux/macOS:

```bash
git clone <url-do-repositorio>
cd moodle-docker-challenge
cp .env.example .env

./setup-linux.sh \
  --adminpass "sua-senha-admin" \
  --fullname "Moodle Docker Challenge" \
  --shortname "Moodle Challenge" \
  --adminemail "admin@example.com"
```

Windows PowerShell:

```powershell
git clone <url-do-repositorio>
cd moodle-docker-challenge
Copy-Item .env.example .env

.\setup-windows.ps1 `
  -AdminPassword "sua-senha-admin" `
  -Fullname "Moodle Docker Challenge" `
  -Shortname "Moodle Challenge" `
  -AdminEmail "admin@example.com"
```

Depois do setup, acesse:

```text
http://localhost:8080
```

<a id="como-executar"></a>

## Como executar

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd moodle-docker-challenge
```

### 2. Criar o arquivo de ambiente

```bash
cp .env.example .env
```

Revise o `.env` antes de subir o ambiente. Os valores padrão já funcionam para execução local em `http://localhost:8080`.

### 3. Revisar os dados mockados

Antes de instalar o Moodle, você pode alterar os dados de demonstração que serão carregados pelo seed:

| Arquivo | Conteúdo |
| --- | --- |
| `plugins/local/seeddata/data/users.json` | Alunos criados na carga inicial |
| `plugins/local/seeddata/data/courses.json` | Disciplinas criadas na carga inicial |

Se quiser usar outros nomes, e-mails, usernames, cursos ou siglas, edite esses arquivos antes de executar o setup.

### 4. Setup automatizado

O caminho recomendado é usar o script de setup. Ele sobe os containers, instala o banco inicial do Moodle, registra plugins e executa a carga de dados.

Substitua os valores dos argumentos pelos dados desejados para a instalação local:

- **`adminpass` / `AdminPassword`**: senha do usuário administrador do Moodle.
- **`fullname` / `Fullname`**: nome completo do site.
- **`shortname` / `Shortname`**: nome curto do site.
- **`adminemail` / `AdminEmail`**: e-mail do usuário administrador.

No Linux:

```bash
./setup-linux.sh \
  --adminpass "sua-senha-admin" \
  --fullname "Nome completo do site" \
  --shortname "Nome curto" \
  --adminemail "seu-email@example.com"
```

No Windows PowerShell:

```powershell
.\setup-windows.ps1 `
  -AdminPassword "sua-senha-admin" `
  -Fullname "Nome completo do site" `
  -Shortname "Nome curto" `
  -AdminEmail "seu-email@example.com"
```

Ao final, acesse:

```text
http://localhost:8080
```

Credenciais administrativas criadas:

| Campo | Valor |
| --- | --- |
| Usuário | `admin` |
| Senha | Valor informado em `--adminpass` ou `-AdminPassword` |

### Setup manual

Se preferir executar cada etapa manualmente:

```bash
docker compose up --build -d
```

Reinicie o container do Moodle para aplicar os plugins montados em `./plugins`:

```bash
docker compose restart moodle
```

Instale o banco inicial do Moodle com o comando abaixo, ou se preferir faça pela web ao subir o container:

```bash
docker compose exec -u www-data -w /var/www/moodle moodle \
  php public/admin/cli/install_database.php \
  --agree-license \
  --adminpass="sua-senha-admin" \
  --fullname="Nome completo do site" \
  --shortname="Nome curto" \
  --adminemail="seu-email@example.com"
```

Instale ou atualize plugins:

```bash
docker compose exec -u www-data -w /var/www/moodle moodle \
  php public/admin/cli/upgrade.php --non-interactive
```

Execute a carga inicial:

```bash
docker compose exec -u www-data -w /var/www/moodle moodle \
  php public/local/seeddata/cli/seed.php
```

<a id="carga-inicial-de-dados"></a>

## Carga inicial de dados

O projeto inclui uma carga inicial com dados acadêmicos de demonstração.

| Dado | Quantidade | Origem |
| --- | --- | --- |
| Alunos | 10 | `plugins/local/seeddata/data/users.json` |
| Disciplinas | 10 | `plugins/local/seeddata/data/courses.json` |
| Categoria | 1 | Criada como `Seed Courses` |
| Matrículas | 100 | 10 alunos em 10 disciplinas |

Os alunos são criados com autenticação manual e senha inicial:

```text
ChangeMe123!
```

O seed é idempotente: se for executado novamente, ele reaproveita usuários, cursos, categoria e matrículas existentes, evitando duplicação.

Para rodar apenas o seed em um Moodle já instalado:

```bash
docker compose exec -u www-data -w /var/www/moodle moodle \
  php public/local/seeddata/cli/seed.php
```

<a id="plugin-local-seeddata"></a>

## Plugin local `seeddata`

A customização do Moodle foi implementada como um plugin local chamado `local_seeddata`.

Responsabilidades do plugin:

- **Ler dados JSON** de alunos e cursos.
- **Criar usuários** usando APIs internas do Moodle.
- **Criar cursos** dentro da categoria `Seed Courses`.
- **Matricular alunos** nos cursos com o papel `student`.
- **Evitar duplicidade** ao ser executado mais de uma vez.

Arquivos principais:

| Arquivo | Responsabilidade |
| --- | --- |
| `plugins/local/seeddata/cli/seed.php` | Entrada CLI do seed |
| `plugins/local/seeddata/classes/seeder/seed_runner.php` | Orquestra o processo completo |
| `plugins/local/seeddata/classes/seeder/user_seeder.php` | Criação e reaproveitamento de usuários |
| `plugins/local/seeddata/classes/seeder/course_seeder.php` | Criação e reaproveitamento de cursos |
| `plugins/local/seeddata/classes/seeder/enrolment_seeder.php` | Matrículas nos cursos |
| `plugins/local/seeddata/classes/data/json_loader.php` | Leitura dos arquivos JSON |

<a id="plugins-pomodoro"></a>

## Plugins Pomodoro

O Pomodoro é dividido em dois plugins para separar responsabilidades:

| Plugin | Responsabilidade |
| --- | --- |
| `block_pomodoro` | Ponto de entrada no dashboard ou curso, com edição rápida de tempos, botão de início, resumo e link para tela cheia |
| `local_pomodoro` | Comportamento global, botão flutuante, painel, página em tela cheia, estado no navegador e notificações |

Leia [POMODORO.md](POMODORO.md) para entender a lógica do timer, os estados, a liderança entre abas, a sincronização por `localStorage` e o significado dos elementos visuais.

Funcionalidades do MVP:

- **Tempos configuráveis** com minutos e segundos para foco, descanso curto e descanso longo no block, painel flutuante e tela cheia.
- **Estado no navegador** com `localStorage`, sem persistência no banco.
- **Botão flutuante global** exibido enquanto a sessão está ativa em páginas logadas do Moodle.
- **Painel expansível** com tempo restante, fase atual, ciclo, pausa, retomada, edição de tempos e cancelamento.
- **Página em tela cheia** em `/local/pomodoro/index.php`.
- **Ciclo automático** seguindo foco, descanso curto e descanso longo.
- **Alerta visual e sonoro** ao concluir cada ciclo, com controle para evitar notificações duplicadas em várias abas.

Chaves usadas no `localStorage`:

| Chave | Conteúdo |
| --- | --- |
| `pomodoro_settings` | Minutos, segundos e ciclos configurados |
| `pomodoro_state` | Status, modo, `endsAt`, pausa, ciclo atual e identificador do ciclo |
| `pomodoro_last_notification` | Último ciclo já notificado |
| `pomodoro_active_tab` | Aba líder responsável por notificar e avançar ciclos |

Arquivos principais:

| Arquivo | Responsabilidade |
| --- | --- |
| `plugins/blocks/pomodoro/block_pomodoro.php` | Classe principal do block de entrada |
| `plugins/blocks/pomodoro/templates/timer.mustache` | Resumo rápido e botões do bloco |
| `plugins/local/pomodoro/lib.php` | Carregamento global do JS/CSS e link na navegação |
| `plugins/local/pomodoro/index.php` | Página Pomodoro em tela cheia |
| `plugins/local/pomodoro/amd/src/timer.js` | Código-fonte AMD do timer global |
| `plugins/local/pomodoro/amd/src/time.js` | Cálculo de tempo restante, ciclos e estado temporal |
| `plugins/local/pomodoro/amd/src/settings.js` | Normalização, leitura e escrita das configurações |
| `plugins/local/pomodoro/amd/src/tabs.js` | Liderança entre abas para evitar notificações duplicadas |
| `plugins/local/pomodoro/amd/src/ui.js` | Registro de regiões e atualização visual da interface |
| `plugins/local/pomodoro/amd/build/timer.min.js` | AMD carregado pelo Moodle |
| `plugins/local/pomodoro/styles.css` | Estilos do botão flutuante, painel e tela cheia |

### Como configurar o Pomodoro no Moodle

Depois de subir o ambiente, reinicie o Moodle para copiar o plugin montado e execute o upgrade:

```bash
docker compose restart moodle
docker compose exec -u www-data -w /var/www/moodle moodle \
  php public/admin/cli/upgrade.php --non-interactive
```

Em seguida, adicione o bloco pela interface:

1. Acesse o Moodle como administrador ou usuário com permissão para editar blocos.
2. Ative o modo de edição no Painel ou em uma página de curso.
3. Use a opção de adicionar bloco.
4. Selecione `Pomodoro`.
5. Inicie o timer pelo bloco exibido na página.

Depois do upgrade, o plugin local carrega o JavaScript nas páginas logadas. O bloco continua sendo útil como ponto de entrada no dashboard ou curso, mas o timer ativo acompanha o estudante enquanto ele navega pelo Moodle.

Também é possível abrir a tela cheia diretamente:

```text
http://localhost:8080/local/pomodoro/index.php
```

<a id="build-javascript-dos-plugins"></a>

## Build JavaScript dos plugins

O Moodle carrega os arquivos JavaScript minificados em `amd/build`. Os arquivos em `amd/src` são o código-fonte editável, e o Grunt gera os artefatos finais que devem ser versionados junto com o plugin.

Neste projeto, Node.js e Grunt ficam em um target separado do Dockerfile, chamado `moodle-js-builder`. A imagem final do Moodle não recebe Node, npm nem dependências de build.

Na primeira execução, ou quando o Dockerfile mudar, prepare a imagem do builder:

```bash
docker compose --profile tools build moodle-js
```

Depois, execute o Grunt somente quando alterar arquivos em `amd/src`:

```bash
docker compose --profile tools run --rm moodle-js
```

O comando procura todos os plugins customizados com `amd/src` dentro de `./plugins`, escrevendo os arquivos gerados em cada respectivo `amd/build`:

```text
plugins/<tipo>/<plugin>/amd/build/
```

Depois do build, inclua no commit tanto o source quanto os arquivos minificados:

```text
plugins/<tipo>/<plugin>/amd/src/*.js
plugins/<tipo>/<plugin>/amd/build/*.min.js
plugins/<tipo>/<plugin>/amd/build/*.min.js.map
```

Em Linux, o serviço usa `MOODLE_JS_UID` e `MOODLE_JS_GID` para devolver a posse dos arquivos gerados ao usuário local. Se seu usuário tiver outro UID/GID, ajuste no `.env`:

```dotenv
MOODLE_JS_UID=1000
MOODLE_JS_GID=1000
```

<a id="variaveis-de-ambiente"></a>

## Variáveis de ambiente

O arquivo `.env.example` documenta as variáveis necessárias para o ambiente local.

<details>
  <summary><b>Ver variáveis principais</b></summary>

```dotenv
COMPOSE_PROJECT_NAME=moodle_docker_challenge

# Docker
MOODLE_PORT=8080

# MySQL
MYSQL_ROOT_PASSWORD=change_me_root_password
MYSQL_DATABASE=moodle
MYSQL_USER=moodle
MYSQL_PASSWORD=change_me_moodle_password

# Moodle
MOODLE_WWWROOT=http://localhost:8080
MOODLE_DATA_DIR=/var/www/moodledata
MOODLE_DB_TYPE=mysqli
MOODLE_DB_HOST=mysql
MOODLE_DB_PORT=3306
MOODLE_DB_PREFIX=mdl_
MOODLE_DB_COLLATION=utf8mb4_unicode_ci
MOODLE_ADMIN_DIR=admin

# Plugins customizados
MOODLE_CUSTOM_PLUGIN_PATHS=local blocks

# Build JavaScript dos plugins
MOODLE_JS_UID=1000
MOODLE_JS_GID=1000
```

</details>

<a id="comandos-uteis"></a>

## Comandos úteis

| Ação | Comando |
| --- | --- |
| Subir containers | `docker compose up --build -d` |
| Ver logs do Moodle | `docker compose logs -f moodle` |
| Ver logs do MySQL | `docker compose logs -f mysql` |
| Reiniciar Moodle | `docker compose restart moodle` |
| Executar upgrade do Moodle | `docker compose exec -u www-data -w /var/www/moodle moodle php public/admin/cli/upgrade.php --non-interactive` |
| Executar seed | `docker compose exec -u www-data -w /var/www/moodle moodle php public/local/seeddata/cli/seed.php` |
| Preparar builder JS | `docker compose --profile tools build moodle-js` |
| Build JS dos plugins | `docker compose --profile tools run --rm moodle-js` |
| Limpar cache do Moodle | `docker compose exec -u www-data -w /var/www/moodle moodle php public/admin/cli/purge_caches.php` |
| Parar containers | `docker compose down` |
| Remover containers e volumes | `docker compose down -v` |

> Atenção: `docker compose down -v` remove também os volumes persistentes, incluindo banco MySQL e dados do Moodle.

<a id="decisoes-tecnicas"></a>

## Decisões técnicas

### Moodle em versão fixa

A imagem usa `v5.2.1` do Moodle, definida como argumento de build no Dockerfile. Fixar a versão torna o ambiente mais previsível e facilita a avaliação do desafio.

### Build multi-stage

O primeiro estágio baixa o código oficial do Moodle. O target `moodle-js-builder` prepara Node.js 22 e dependências npm do Moodle para compilar JavaScript sob demanda. A imagem final monta apenas PHP, Apache, extensões necessárias e dependências Composer em modo de produção.

### Build JavaScript sob demanda

O Grunt não roda no startup do Moodle. Ele é acionado manualmente pelo serviço `moodle-js` quando houver mudança em `amd/src`, gerando os arquivos de `amd/build` que o Moodle serve no navegador.

### Apache apontando para `public/`

O Apache serve o Moodle a partir de `/var/www/moodle/public`, evitando expor arquivos internos da aplicação e acompanhando a estrutura das versões recentes do Moodle.

### Configuração fora da imagem

O `config/config.php` é montado no container e lê as configurações a partir de variáveis de ambiente. Com isso, credenciais e parâmetros locais não ficam acoplados à imagem Docker.

### Volumes persistentes

O Compose declara dois volumes principais:

- **`mysql_data`**: dados do banco MySQL.
- **`moodledata`**: arquivos, caches e dados gerados pelo Moodle.

### Plugin customizado por bind mount

O diretório `./plugins` é montado em `/opt/moodle-custom-plugins`. No startup, o entrypoint.sh copia plugins válidos para dentro de `/var/www/moodle/public`, preservando a estrutura esperada pelo Moodle.

### Carga inicial via APIs do Moodle

A carga inicial foi implementada como plugin local e usa APIs internas do Moodle, em vez de inserir registros diretamente por SQL. Essa decisão reduz acoplamento com tabelas internas e deixa a solução mais alinhada ao funcionamento da plataforma.

### Pomodoro global sem banco

O `local_pomodoro` mantém configurações e estado em `localStorage`, sem migrations ou tabelas próprias. O estado usa `endsAt` como fonte de verdade; ao trocar de página, o JavaScript recalcula o tempo restante e recria o botão flutuante.

Para evitar notificações duplicadas em várias abas, cada aba gera um identificador próprio. A chave `pomodoro_active_tab` define a aba líder, e `pomodoro_last_notification` registra o último ciclo já notificado.

<a id="escopo-e-suposicoes"></a>

## Escopo e suposições

- O ambiente foi pensado para execução local e avaliação técnica, não para produção.
- A instalação inicial do Moodle é feita por CLI, com senha e e-mail de administrador informados no setup.
- A carga acadêmica é demonstrativa: os alunos usam autenticação manual e senha inicial `ChangeMe123!`.
- O seed reaproveita usuários, cursos e matrículas já existentes para permitir reexecução sem duplicar dados.
- Os plugins customizados são mantidos em `./plugins` e copiados para o Moodle pelo entrypoint do container.
- Alterações em plugins PHP exigem `upgrade.php` quando houver mudança de versão ou instalação inicial.
- Alterações em `amd/src` exigem build com Grunt para atualizar `amd/build`, que é o código carregado pelo Moodle.
- O Pomodoro é um MVP pessoal e client-side: estado e configurações ficam no navegador do usuário, não no banco.

<a id="solucao-de-problemas"></a>

## Solução de problemas

| Problema | Verificação sugerida |
| --- | --- |
| Moodle não abre em `localhost:8080` | Confirme `docker compose ps`, logs do serviço `moodle` e se `MOODLE_PORT` não está em uso |
| Instalação não conclui | Verifique se o MySQL está saudável e se as credenciais do `.env` batem com o `docker-compose.yml` |
| Plugins não aparecem | Rode `docker compose restart moodle` e depois `php public/admin/cli/upgrade.php --non-interactive` dentro do container |
| Mudança AMD não aparece no navegador | Execute `docker compose --profile tools run --rm moodle-js` e limpe o cache do Moodle |
| Bloco Pomodoro não aparece | Ative o modo de edição, dentro do Moodle, na página desejada e adicione o bloco `Pomodoro` pela interface |
| Timer mostra estado antigo | Verifique o `localStorage` do navegador ou cancele a sessão pelo painel/tela cheia |

Para limpar o cache do Moodle caso a mudança não apareca:

```bash
docker compose exec -u www-data -w /var/www/moodle moodle \
  php public/admin/cli/purge_caches.php
```

<a id="estrutura-do-projeto"></a>

## Estrutura do projeto

```text
.
├── .env.example
├── POMODORO.md
├── config/
│   └── config.php
├── docker/
│   └── moodle/
│       ├── Dockerfile
│       ├── entrypoint.sh
│       └── apache/
│           ├── moodle.conf
│           └── servername.conf
├── docker-compose.yml
├── plugins/
│   ├── blocks/
│   │   └── pomodoro/
│   │       ├── db/
│   │       │   └── access.php
│   │       ├── lang/
│   │       │   ├── en/
│   │       │   │   └── block_pomodoro.php
│   │       │   └── pt_br/
│   │       │       └── block_pomodoro.php
│   │       ├── templates/
│   │       │   └── timer.mustache
│   │       ├── block_pomodoro.php
│   │       ├── styles.css
│   │       └── version.php
│   └── local/
│       ├── pomodoro/
│       │   ├── amd/
│       │   │   ├── build/
│       │   │   │   ├── animations.min.js
│       │   │   │   ├── constants.min.js
│       │   │   │   ├── default_settings.min.js
│       │   │   │   ├── notifications.min.js
│       │   │   │   ├── settings.min.js
│       │   │   │   ├── storage.min.js
│       │   │   │   ├── tabs.min.js
│       │   │   │   ├── time.min.js
│       │   │   │   ├── timer.min.js
│       │   │   │   └── ui.min.js
│       │   │   └── src/
│       │   │       ├── animations.js
│       │   │       ├── constants.js
│       │   │       ├── default_settings.js
│       │   │       ├── notifications.js
│       │   │       ├── settings.js
│       │   │       ├── storage.js
│       │   │       ├── tabs.js
│       │   │       ├── time.js
│       │   │       ├── timer.js
│       │   │       └── ui.js
│       │   ├── lang/
│       │   │   ├── en/
│       │   │   │   └── local_pomodoro.php
│       │   │   └── pt_br/
│       │   │       └── local_pomodoro.php
│       │   ├── templates/
│       │   │   ├── floating.mustache
│       │   │   └── fullscreen.mustache
│       │   ├── index.php
│       │   ├── lib.php
│       │   ├── styles.css
│       │   └── version.php
│       └── seeddata/
│           ├── classes/
│           │   ├── data/
│           │   │   └── json_loader.php
│           │   └── seeder/
│           │       ├── course_seeder.php
│           │       ├── enrolment_seeder.php
│           │       ├── seed_runner.php
│           │       └── user_seeder.php
│           ├── cli/
│           │   └── seed.php
│           ├── data/
│           │   ├── courses.json
│           │   └── users.json
│           ├── lang/
│           │   └── en/
│           │       └── local_seeddata.php
│           └── version.php
├── setup-linux.sh
├── setup-windows.ps1
└── README.md
```

<a id="licenca"></a>

## Licença

O Moodle é software livre distribuído sob a [GNU General Public License](https://www.gnu.org/licenses/gpl-3.0.html), e os plugins customizados seguem o cabeçalho padrão GPL usado em plugins Moodle.
