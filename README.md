# Moodle Docker Challenge

<p align="center">
  <img alt="Moodle" src="https://img.shields.io/badge/Moodle-5.2.1-f98012?logo=moodle&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Compose-2496ed?logo=docker&logoColor=white">
  <img alt="PHP" src="https://img.shields.io/badge/PHP-8.3-777bb4?logo=php&logoColor=white">
  <img alt="MySQL" src="https://img.shields.io/badge/MySQL-8.4-4479a1?logo=mysql&logoColor=white">
  <img alt="Apache" src="https://img.shields.io/badge/Apache-HTTPD-d22128?logo=apache&logoColor=white">
</p>

Ambiente Moodle totalmente containerizado para gerenciamento acadêmico básico, com Moodle, MySQL, persistência de dados e carga inicial automatizada de alunos, disciplinas e matrículas.

Este projeto foi desenvolvido para um desafio técnico de Desenvolvedor Moodle Júnior, priorizando execução local simples, boa organização Docker, uso de variáveis de ambiente e uma customização Moodle por plugin local.

## Sumário

- [O que é o Moodle?](#o-que-e-o-moodle)
- [Sobre o desafio técnico](#sobre-o-desafio-tecnico)
- [Stack e arquitetura](#stack-e-arquitetura)
- [Pré-requisitos](#pre-requisitos)
- [Como executar](#como-executar)
- [Carga inicial de dados](#carga-inicial-de-dados)
- [Plugin local `seeddata`](#plugin-local-seeddata)
- [Variáveis de ambiente](#variaveis-de-ambiente)
- [Comandos úteis](#comandos-uteis)
- [Decisões técnicas](#decisoes-tecnicas)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Licença](#licenca)

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
| Customização Moodle | Plugin local `local_seeddata` |
| Documentação | README com execução, decisões e suposições |

<a id="stack-e-arquitetura"></a>

## Stack e arquitetura

| Camada | Tecnologia | Observação |
| --- | --- | --- |
| LMS | Moodle `v5.2.1` | Código baixado do repositório oficial durante o build |
| Runtime | PHP `8.3` + Apache | Imagem final `php:8.3-apache-bookworm` |
| Banco | MySQL `8.4` | Configurado com `utf8mb4_unicode_ci` |
| Orquestração | Docker Compose | Serviços separados para `moodle` e `mysql` |
| Customização | Plugin `local_seeddata` | Executa carga inicial via CLI do Moodle |
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

Instale o banco inicial do Moodle:

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
| Parar containers | `docker compose down` |
| Remover containers e volumes | `docker compose down -v` |

> Atenção: `docker compose down -v` remove também os volumes persistentes, incluindo banco MySQL e dados do Moodle.

<a id="decisoes-tecnicas"></a>

## Decisões técnicas

### Moodle em versão fixa

A imagem usa `v5.2.1` do Moodle, definida como argumento de build no Dockerfile. Fixar a versão torna o ambiente mais previsível e facilita a avaliação do desafio.

### Build multi-stage

O primeiro estágio baixa o código oficial do Moodle. O segundo estágio monta a imagem final com PHP, Apache, extensões necessárias e dependências Composer em modo de produção.

### Apache apontando para `public/`

O Apache serve o Moodle a partir de `/var/www/moodle/public`, evitando expor arquivos internos da aplicação e acompanhando a estrutura das versões recentes do Moodle.

### Configuração fora da imagem

O `config/config.php` é montado no container e lê as configurações a partir de variáveis de ambiente. Com isso, credenciais e parâmetros locais não ficam acoplados à imagem Docker.

### Volumes persistentes

O Compose declara dois volumes principais:

- **`mysql_data`**: dados do banco MySQL.
- **`moodledata`**: arquivos, caches e dados gerados pelo Moodle.

### Plugin customizado por bind mount

O diretório `./plugins` é montado em `/opt/moodle-custom-plugins`. No startup, o entrypoint copia plugins válidos para dentro de `/var/www/moodle/public`, preservando a estrutura esperada pelo Moodle.

### Carga inicial via APIs do Moodle

A carga inicial foi implementada como plugin local e usa APIs internas do Moodle, em vez de inserir registros diretamente por SQL. Essa decisão reduz acoplamento com tabelas internas e deixa a solução mais alinhada ao funcionamento da plataforma.

<a id="estrutura-do-projeto"></a>

## Estrutura do projeto

```text
.
├── .env.example
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
│   └── local/
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

O Moodle é software livre distribuído sob a [GNU General Public License](https://www.gnu.org/licenses/gpl-3.0.html), e o plugin local `local_seeddata` segue o cabeçalho padrão GPL usado em plugins Moodle.
