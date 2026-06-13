#!/bin/sh
set -eu

# Defaults alinhados ao contrato da imagem; podem ser sobrescritos pelo Compose.
MOODLE_DIR="${MOODLE_DIR:-/var/www/moodle}"
MOODLE_DATA_DIR="${MOODLE_DATA_DIR:-/var/www/moodledata}"
MOODLE_CUSTOM_PLUGINS_DIR="${MOODLE_CUSTOM_PLUGINS_DIR:-/opt/moodle-custom-plugins}"
MOODLE_CUSTOM_PLUGIN_PATHS="${MOODLE_CUSTOM_PLUGIN_PATHS:-local blocks}"

# Restringe nomes ao formato aceito pelo Moodle e evita caminhos inesperados.
is_valid_moodle_plugin_name() {
    name="$1"

    case "$name" in
        ""|[!abcdefghijklmnopqrstuvwxyz]*|*[!abcdefghijklmnopqrstuvwxyz0123456789_]*|*__*|*_)
            return 1
            ;;
    esac

    return 0
}

install_custom_plugins() {
    if [ ! -d "$MOODLE_CUSTOM_PLUGINS_DIR" ]; then
        echo "Custom plugins directory not found: $MOODLE_CUSTOM_PLUGINS_DIR"
        return 0
    fi

    for plugin_path in $MOODLE_CUSTOM_PLUGIN_PATHS; do
        source_root="${MOODLE_CUSTOM_PLUGINS_DIR}/${plugin_path}"
        target_root="${MOODLE_DIR}/public/${plugin_path}"

        [ -d "$source_root" ] || continue

        mkdir -p "$target_root"

        # Cada subdiretorio em local/, blocks/, etc. representa um plugin.
        for plugin_dir in "$source_root"/*; do
            [ -d "$plugin_dir" ] || continue

            plugin_name="$(basename "$plugin_dir")"

            if ! is_valid_moodle_plugin_name "$plugin_name"; then
                echo "Ignoring custom Moodle plugin with invalid directory name: ${plugin_path}/${plugin_name}" >&2
                continue
            fi

            target_dir="${target_root}/${plugin_name}"
            marker_file="${target_dir}/.moodle-custom-plugin-managed"

            # Apenas substitui plugins instalados por este entrypoint.
            if [ -d "$target_dir" ] && [ -f "$marker_file" ]; then
                rm -rf "$target_dir"
            elif [ -e "$target_dir" ]; then
                echo "Target already exists and is not managed by this container, skipping: ${target_dir}" >&2
                continue
            fi

            cp -a "$plugin_dir" "$target_dir"
            touch "$marker_file"
            chown -R www-data:www-data "$target_dir"

            echo "Installed custom Moodle plugin: ${plugin_path}/${plugin_name}"
        done
    done
}

# Prepara o volume persistente e aplica plugins montados no startup do container.
mkdir -p "$MOODLE_DATA_DIR" "$MOODLE_CUSTOM_PLUGINS_DIR"
chown -R www-data:www-data "$MOODLE_DATA_DIR"
install_custom_plugins

# Entrega o PID 1 ao comando final, normalmente apache2-foreground.
exec "$@"
