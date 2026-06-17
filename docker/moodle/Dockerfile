# syntax=docker/dockerfile:1

# ------------------------------------------------------------------------------------------------------------
# Usa multi-stage build para baixar o código oficial do Moodle para garantir a integridade e a versão correta
# ------------------------------------------------------------------------------------------------------------

# ------------------------------------------------------------------------------------
# Stage 1: Baixa o código oficial do Moodle na versão definida por MOODLE_VERSION
# ------------------------------------------------------------------------------------

FROM alpine:3.21  AS moodle-source

ARG MOODLE_VERSION=v5.2.1

RUN apk add --no-cache \
    ca-certificates \
    git

# Baixa o código oficial do Moodle e depois remove .git para não copiar metadados do Git para a imagem final.
RUN mkdir -p /src \
    && git clone --depth 1 --branch "${MOODLE_VERSION}" https://github.com/moodle/moodle.git /src/moodle \
    && rm -rf /src/moodle/.git

# ------------------------------------------------------------------------------------
# Stage 2: Ferramentas de build JavaScript do Moodle
#
# Mantem Node/Grunt fora da imagem final. Este target e usado sob demanda pelo Compose
# para gerar os arquivos minificados de plugins em amd/build.
# ------------------------------------------------------------------------------------

FROM node:22-bookworm AS moodle-js-builder

ARG MOODLE_VERSION=v5.2.1

ENV MOODLE_DIR=/var/www/moodle

COPY --from=moodle-source /src/moodle ${MOODLE_DIR}

WORKDIR ${MOODLE_DIR}

RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# ------------------------------------------------------------------------------------
# Stage 3: Imagem final com PHP e Apache configurados para a versão do Moodle
# ------------------------------------------------------------------------------------

FROM php:8.3-apache-bookworm

ARG MOODLE_VERSION=v5.2.1

LABEL org.opencontainers.image.authors="José Carlos"
LABEL org.opencontainers.image.title="Moodle Docker Challenge"
LABEL org.opencontainers.image.description="Docker image para desafio técnico com Moodle"
LABEL org.opencontainers.image.version="${MOODLE_VERSION}"

# Contrato de caminhos internos da imagem.
ENV MOODLE_DIR=/var/www/moodle \
    MOODLE_DATA_DIR=/var/www/moodledata \
    MOODLE_CUSTOM_PLUGINS_DIR=/opt/moodle-custom-plugins \
    MOODLE_CUSTOM_PLUGIN_PATHS="local blocks"

# ------------------------------------------------------------------------------------
# Instala dependências do sistema e extensões PHP exigidas/recomendadas
#
# - Usa --no-install-recommends para evitar pacotes desnecessários.
# - Limpa /var/lib/apt/lists que são arquivos temporários ao baixar os pacotes, para reduzir tamanho da imagem.
# - Usa -j"$(nproc)" para instalar em paralelo dependendo dos núcleos da CPU.
#
# Extensões importantes para Moodle:
# - mysqli / pdo_mysql: conexão com MySQL
# - intl: internacionalização
# - mbstring: strings multibyte
# - gd: imagens
# - zip: compactação
# - curl: chamadas HTTP
# - soap: web services
# - opcache: performance
# ------------------------------------------------------------------------------------


RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        libcurl4-openssl-dev \
        libfreetype6-dev \
        libicu-dev \
        libjpeg62-turbo-dev \
        libonig-dev \
        libpng-dev \
        libwebp-dev \
        libxml2-dev \
        libzip-dev \
        unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j"$(nproc)" \
        curl \
        exif \
        gd \
        intl \
        mbstring \
        mysqli \
        opcache \
        pdo_mysql \
        soap \
        zip \
    && rm -rf /var/lib/apt/lists/*

# ------------------------------------------------------------------------------------
# Configurações PHP recomendadas para Moodle
#
# max_input_vars >= 5000 é requisito do Moodle.
# zend.exception_ignore_args=On é recomendado por segurança, impede o vazamento acidental de credenciais.
# OPcache melhora performance e costuma aparecer nos checks do Moodle.
# ------------------------------------------------------------------------------------


RUN { \
        echo "max_input_vars=5000"; \
        echo "memory_limit=256M"; \
        echo "upload_max_filesize=64M"; \
        echo "post_max_size=64M"; \
        echo "max_execution_time=300"; \
        echo "zend.exception_ignore_args=On"; \
        echo "opcache.enable=1"; \
        echo "opcache.enable_cli=1"; \
        echo "opcache.memory_consumption=128"; \
        echo "opcache.max_accelerated_files=10000"; \
        echo "opcache.revalidate_freq=60"; \
    } > /usr/local/etc/php/conf.d/moodle.ini

# ------------------------------------------------------------------------------------
# Configuração do Apache
#
# - Desde Moodle 5.1, o servidor web deve apontar para a pasta public/.
# - Isso evita expor arquivos internos do Moodle pela web.
# - Ativa módulos essenciais: cache (expires), segurança (headers) e URLs amigáveis (rewrite).
# - Altera o DocumentRoot padrão para apontar para a pasta pública do Moodle.
# - Protege o diretório desativando a listagem direta de arquivos (-Indexes).
# ------------------------------------------------------------------------------------

RUN a2enmod \
        dir \
        expires \
        headers \
        rewrite \
    && sed -ri "s#/var/www/html#${MOODLE_DIR}/public#g" /etc/apache2/sites-available/000-default.conf

COPY docker/moodle/apache/moodle.conf /etc/apache2/conf-available/moodle.conf
COPY docker/moodle/apache/servername.conf /etc/apache2/conf-available/servername.conf

RUN a2enconf servername \
    && a2enconf moodle

# ------------------------------------------------------------------------------------
# Copia Composer e o código do Moodle do Stage 1 para a imagem final
#
# TO-DO: Em produção, seria melhor manter o código como read-only.
# ------------------------------------------------------------------------------------

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
COPY --from=moodle-source --chown=www-data:www-data /src/moodle ${MOODLE_DIR}

WORKDIR ${MOODLE_DIR}

RUN export COMPOSER_ALLOW_SUPERUSER=1 COMPOSER_ROOT_VERSION="${MOODLE_VERSION#v}" \
    && composer install --no-dev --no-interaction --prefer-dist --classmap-authoritative \
    && composer clear-cache

# ------------------------------------------------------------------------------------
# Entrypoint
#
# - Prepara um ponto unico para plugins customizados via bind mount.
# - O Compose futuro pode montar, por exemplo:
#   ./plugins:/opt/moodle-custom-plugins:ro
# - A estrutura do bind mount deve espelhar os caminhos de plugin do Moodle:
#   ./plugins/local/meuplugin  -> /var/www/moodle/public/local/meuplugin
#   ./plugins/blocks/meubloco  -> /var/www/moodle/public/blocks/meubloco
# - A copia gerenciada evita montar por cima de diretorios core inteiros e evita
#   problemas de resolucao de caminho real em plugins carregados por symlink.
# ------------------------------------------------------------------------------------

COPY docker/moodle/entrypoint.sh /usr/local/bin/moodle-entrypoint

RUN chmod +x /usr/local/bin/moodle-entrypoint

# ------------------------------------------------------------------------------------
# Cria moodledata e o ponto de montagem para plugins customizados
# 
# no docker-compose, moodledata e persistido por volume, e plugins entram por bind mount.
# ------------------------------------------------------------------------------------

RUN mkdir -p ${MOODLE_DATA_DIR} ${MOODLE_CUSTOM_PLUGINS_DIR} \
    && chown -R www-data:www-data ${MOODLE_DIR} ${MOODLE_DATA_DIR} \
    && chown root:www-data ${MOODLE_CUSTOM_PLUGINS_DIR} \
    && chmod -R 755 ${MOODLE_DIR} \
    && chmod -R 770 ${MOODLE_DATA_DIR} \
    && chmod 755 ${MOODLE_CUSTOM_PLUGINS_DIR}

# Validação: falha se extensões essenciais não existirem.
RUN set -eux; \
    for ext in curl exif gd intl mbstring mysqli pdo_mysql soap sodium zip; do \
        php -m | grep -i "^${ext}$"; \
    done; \
    php -m | grep -i "Zend OPcache"

EXPOSE 80

VOLUME ["/var/www/moodledata"]

# Healthcheck simples para saber se o Apache responde.
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -fsS http://localhost/ || exit 1

# Inicializa o Apache em primeiro plano (foreground) para manter o container ativo e direcionar os logs.
ENTRYPOINT ["/usr/local/bin/moodle-entrypoint"]
CMD ["apache2-foreground"]
