# Moodle Docker Challenge

Ambiente Docker para Moodle, criado como parte do desafio técnico para disponibilizar uma instalação local e containerizada voltada a gerenciamento acadêmico básico.

O desafio pede uma solução com Moodle, MySQL, persistência de dados, carga inicial de alunos e disciplinas, versionamento Git e ao menos uma customização no Moodle. Esta branch implementa a base da imagem Docker do Moodle e deixa registrados os próximos pontos necessários para completar o escopo.

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

Ainda não está implementado ou versionado nesta branch:

- Configuração funcional do `docker-compose.yml`.
- Container MySQL.
- Arquivo `.env.example` preenchido com variáveis do ambiente.
- Script de carga inicial das disciplinas e alunos.
- Customização Moodle por plugin ou página.
- Arquivo `docker/moodle/entrypoint.sh`, apesar de o Dockerfile já estar preparado para copiá-lo.

## Estrutura atual

```text
.
├── docker-compose.yml
├── docker/
│   └── moodle/
│       ├── Dockerfile
│       └── apache/
│           ├── moodle.conf
│           └── servername.conf
└── README.md
```

## Como executar

No estado atual desta branch, a execução completa do ambiente ainda não está disponível. O `docker-compose.yml` permanece sem a definição dos serviços e o Dockerfile depende de `docker/moodle/entrypoint.sh`, que ainda não está versionado nesta branch.

Quando esses pontos forem concluídos, o fluxo esperado será:

```sh
cp .env.example .env
docker compose up --build
```

Depois disso, o Moodle deverá ficar acessível pelo navegador na porta definida pelo Compose.

## Decisões técnicas

### Moodle oficial

A imagem baixa o código diretamente do repositório oficial do Moodle usando a tag definida por `MOODLE_VERSION`, atualmente `v5.2.1`. O diretório `.git` é removido antes de copiar o código para a imagem final para evitar metadados desnecessários.

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

O Dockerfile declara `/var/www/moodledata` como volume. Esse diretório é usado pelo Moodle para armazenar arquivos enviados, caches e dados gerados pela aplicação.

### Plugins customizados

O Dockerfile define variáveis para uma futura estratégia de plugins customizados:

```text
MOODLE_CUSTOM_PLUGINS_DIR=/opt/moodle-custom-plugins
MOODLE_CUSTOM_PLUGIN_PATHS="local blocks"
```

A intenção é permitir que plugins dos tipos `local` e `blocks` sejam fornecidos por bind mount e aplicados durante a inicialização do container.

## Relação com o desafio

Para concluir o desafio técnico, ainda faltam:

- Orquestrar Moodle e MySQL com Docker Compose.
- Persistir dados do Moodle e do banco via volumes.
- Automatizar a instalação/configuração inicial do Moodle.
- Criar a carga de 10 disciplinas e 10 alunos por disciplina.
- Implementar uma customização Moodle simples, como plugin `local`, plugin `block` ou página customizada.