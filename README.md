# Moodle Docker Challenge

Ambiente Docker para Moodle, criado como parte do desafio técnico para disponibilizar uma instalação local e containerizada voltada a gerenciamento acadêmico básico.

O desafio pede uma solução com Moodle, MySQL, persistência de dados, carga inicial de alunos e disciplinas, versionamento Git e ao menos uma customização no Moodle. Esta branch implementa a orquestração local com Docker Compose e deixa registrados os próximos pontos necessários para completar o escopo.

## Status da branch

Implementado nesta branch:

- Dockerfile próprio para a imagem do Moodle.
- Build multi-stage para baixar o código oficial do Moodle.
- Moodle fixado na versão `v5.2.1`.
- Base final em `php:8.3-apache-bookworm`.
- Instalação de dependências de sistema e extensões PHP necessárias para o Moodle.
- Configurações PHP recomendadas, como `max_input_vars`, limites de upload, tempo de execução e OPcache.
- Apache configurado para servir o Moodle a partir de `/var/www/moodle/public`, como requerido pelas versões atuais do Moodle.
- Configurações Apache separadas em arquivos próprios:
  - `docker/moodle/apache/moodle.conf`
  - `docker/moodle/apache/servername.conf`
- Instalação das dependências PHP do Moodle com Composer em modo de produção.
- Definição de volume para `/var/www/moodledata`.
- Healthcheck HTTP simples para verificar resposta do Apache.
- Estrutura prevista para plugins customizados em `/opt/moodle-custom-plugins`.
- Entrypoint para preparar o diretório de dados e organizar plugins customizados no início do container.
- Docker Compose com serviços separados para Moodle e MySQL.
- MySQL 8.4 configurado com `utf8mb4` e volume persistente.
- Healthcheck do MySQL usado pelo `depends_on` do Moodle.
- Variáveis de ambiente documentadas em `.env.example`.
- Configuração do Moodle carregada por `config/config.php`.

Ainda não está implementado ou versionado nesta branch:

- Script de carga inicial das disciplinas e alunos.
- Customização Moodle por plugin ou página.

## Estrutura atual

```text
.
├── .env.example
├── config/
│   └── config.php
├── docker-compose.yml
├── docker/
│   └── moodle/
│       ├── Dockerfile
│       ├── entrypoint.sh
│       └── apache/
│           ├── moodle.conf
│           └── servername.conf
├── plugins/
│   ├── blocks/
│   │   └── .gitkeep
│   └── local/
│       └── .gitkeep
└── README.md
```

## Como executar

Crie o arquivo `.env` a partir do modelo e suba os containers:

```sh
cp .env.example .env
docker compose up --build
```

Depois disso, o Moodle deverá ficar acessível em `http://localhost:8080`, considerando o valor padrão de `MOODLE_PORT`.

## Decisões técnicas

### Moodle oficial

A imagem baixa o código diretamente do repositório oficial do Moodle atualmente em `v5.2.1`. O Compose repassa esse valor como argumento de build, permitindo trocar a versão pelo `.env`. O diretório `.git` é removido antes de copiar o código para a imagem final para evitar metadados desnecessários.

### Build multi-stage

O primeiro estágio usa Alpine apenas para obter o código-fonte do Moodle. O segundo estágio usa `php:8.3-apache-bookworm`, mantendo a imagem final focada em executar a aplicação.

### Apache apontando para `public/`

O Apache é configurado para usar `/var/www/moodle/public` como raiz pública. Essa decisão evita expor arquivos internos do Moodle e acompanha o modelo das versões recentes da aplicação.

### Configurações Apache externas

As configurações do Apache foram separadas do Dockerfile para melhorar legibilidade e manutenção:

- `moodle.conf` define regras do diretório público do Moodle.
- `servername.conf` define `ServerName localhost`, evitando avisos do Apache em ambiente local.

### Extensões PHP

Foram instaladas extensões importantes para o funcionamento do Moodle com MySQL e recursos comuns da plataforma, incluindo `mysqli`, `pdo_mysql`, `intl`, `mbstring`, `gd`, `zip`, `curl`, `soap` e `opcache`.

### Dados persistentes

O Compose declara volumes para o banco e para o `moodledata`:

- `mysql_data` armazena os dados do MySQL.
- `moodledata` armazena arquivos enviados, caches e dados gerados pelo Moodle.

O Dockerfile também declara `/var/www/moodledata` como volume, mantendo a imagem preparada para execução fora do Compose.

### Variáveis de ambiente

O arquivo `.env.example` funciona como modelo de configuração. O Compose usa o arquivo `.env` real para interpolar valores como versão do Moodle, porta local, credenciais do MySQL e parâmetros do Moodle. O `.env` fica fora do versionamento.

As variáveis são passadas explicitamente para cada serviço com `environment`, evitando que o container do Moodle receba credenciais administrativas do MySQL que não precisa usar. As variáveis `MYSQL_DATABASE`, `MYSQL_USER` e `MYSQL_PASSWORD` também alimentam `MOODLE_DB_NAME`, `MOODLE_DB_USER` e `MOODLE_DB_PASSWORD`, mantendo banco criado e configuração do Moodle sincronizados.

### MySQL

O serviço MySQL usa a imagem `mysql:8.4`, banco persistente e collation `utf8mb4_unicode_ci`, adequada para o Moodle. O healthcheck com `mysqladmin ping` permite que o Moodle aguarde o banco ficar pronto antes de iniciar.

### Configuração do Moodle

O arquivo `config/config.php` é montado em `/var/www/moodle/config.php` como somente leitura. Ele lê as configurações a partir das variáveis de ambiente do container, mantendo senhas e parâmetros fora do código da imagem.

### Plugins customizados

O Dockerfile define variáveis para uma futura estratégia de plugins customizados:

```text
MOODLE_CUSTOM_PLUGINS_DIR=/opt/moodle-custom-plugins
MOODLE_CUSTOM_PLUGIN_PATHS="local blocks"
```

A intenção é permitir que plugins dos tipos `local` e `blocks` sejam fornecidos por bind mount e aplicados durante a inicialização do container.

O `entrypoint.sh` foi adicionado como apoio a essa organização: ele prepara os diretórios necessários e copia plugins customizados para os caminhos esperados pelo Moodle quando o container inicia.

## Relação com o desafio

Para concluir o desafio técnico, ainda faltam:

- Automatizar a instalação/configuração inicial do Moodle.
- Criar a carga de 10 disciplinas e 10 alunos por disciplina.
- Implementar uma customização Moodle simples, como plugin `local`, plugin `block` ou página customizada.
