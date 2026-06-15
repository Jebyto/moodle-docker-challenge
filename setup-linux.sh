#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

ADMIN_PASSWORD=""
SITE_FULLNAME=""
SITE_SHORTNAME=""
ADMIN_EMAIL=""

usage() {
    cat <<'USAGE'
Usage:
  ./setup-linux.sh \
    --adminpass "sua-senha-admin" \
    --fullname "Nome completo do site" \
    --shortname "Nome curto" \
    --adminemail "seu-email@example.com"

Required arguments:
  --adminpass    Senha desejada para o administrador inicial do Moodle.
  --fullname     Nome completo desejado para o site Moodle.
  --shortname    Nome curto desejado para o site Moodle.
  --adminemail   E-mail desejado para o administrador inicial.

Before running this script, create and review .env:
  cp .env.example .env

Mock data loaded by the seed can be changed before setup in:
  plugins/local/seeddata/data/users.json
  plugins/local/seeddata/data/courses.json
USAGE
}

while [ "$#" -gt 0 ]; do
    case "$1" in
        --adminpass)
            if [ "$#" -lt 2 ] || [[ "$2" == --* ]]; then
                echo "Missing value for --adminpass." >&2
                usage
                exit 1
            fi
            ADMIN_PASSWORD="${2:-}"
            shift 2
            ;;
        --adminpass=*)
            ADMIN_PASSWORD="${1#*=}"
            shift
            ;;
        --fullname)
            if [ "$#" -lt 2 ] || [[ "$2" == --* ]]; then
                echo "Missing value for --fullname." >&2
                usage
                exit 1
            fi
            SITE_FULLNAME="${2:-}"
            shift 2
            ;;
        --fullname=*)
            SITE_FULLNAME="${1#*=}"
            shift
            ;;
        --shortname)
            if [ "$#" -lt 2 ] || [[ "$2" == --* ]]; then
                echo "Missing value for --shortname." >&2
                usage
                exit 1
            fi
            SITE_SHORTNAME="${2:-}"
            shift 2
            ;;
        --shortname=*)
            SITE_SHORTNAME="${1#*=}"
            shift
            ;;
        --adminemail)
            if [ "$#" -lt 2 ] || [[ "$2" == --* ]]; then
                echo "Missing value for --adminemail." >&2
                usage
                exit 1
            fi
            ADMIN_EMAIL="${2:-}"
            shift 2
            ;;
        --adminemail=*)
            ADMIN_EMAIL="${1#*=}"
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown argument: $1" >&2
            usage
            exit 1
            ;;
    esac
done

if [ -z "$ADMIN_PASSWORD" ] || [ -z "$SITE_FULLNAME" ] || [ -z "$SITE_SHORTNAME" ] || [ -z "$ADMIN_EMAIL" ]; then
    echo "Missing required setup arguments." >&2
    usage
    exit 1
fi

moodle_exec() {
    docker compose exec -T -u www-data -w /var/www/moodle moodle "$@"
}

find_moodle_script() {
    local path="$1"

    if moodle_exec test -f "$path"; then
        printf '%s\n' "$path"
        return 0
    fi

    if moodle_exec test -f "public/$path"; then
        printf '%s\n' "public/$path"
        return 0
    fi

    echo "Could not find Moodle script: $path" >&2
    return 1
}

is_moodle_installed() {
    local phpcode
    phpcode='
$host = getenv("MOODLE_DB_HOST") ?: "mysql";
$port = (int) (getenv("MOODLE_DB_PORT") ?: 3306);
$user = getenv("MOODLE_DB_USER") ?: "moodle";
$pass = getenv("MOODLE_DB_PASSWORD") ?: "";
$dbname = getenv("MOODLE_DB_NAME") ?: "moodle";
$prefix = getenv("MOODLE_DB_PREFIX") ?: "mdl_";

$mysqli = @new mysqli($host, $user, $pass, $dbname, $port);
if ($mysqli->connect_errno) {
    exit(1);
}

$table = $mysqli->real_escape_string($prefix . "config");
$result = $mysqli->query("SHOW TABLES LIKE '"'"'" . $table . "'"'"'");

exit(($result && $result->num_rows > 0) ? 0 : 1);
'

    moodle_exec php -r "$phpcode"
}

if [ ! -f .env ]; then
    echo "Missing .env file. Create it from .env.example and review its values before running setup." >&2
    echo "Example: cp .env.example .env" >&2
    exit 1
fi

echo "Building and starting Docker containers..."
docker compose up --build -d

echo "Restarting Moodle container to apply mounted plugins..."
docker compose restart moodle

INSTALL_SCRIPT="$(find_moodle_script admin/cli/install_database.php)"
UPGRADE_SCRIPT="$(find_moodle_script admin/cli/upgrade.php)"
SEED_SCRIPT="$(find_moodle_script local/seeddata/cli/seed.php)"

if is_moodle_installed; then
    echo "Moodle database already installed. Skipping initial database installation."
else
    echo "Installing Moodle database..."
    moodle_exec php "$INSTALL_SCRIPT" \
        --agree-license \
        --adminpass="$ADMIN_PASSWORD" \
        --fullname="$SITE_FULLNAME" \
        --shortname="$SITE_SHORTNAME" \
        --adminemail="$ADMIN_EMAIL"
fi

echo "Installing or upgrading Moodle plugins..."
moodle_exec php "$UPGRADE_SCRIPT" --non-interactive

echo "Running seed data import..."
moodle_exec php "$SEED_SCRIPT"

echo "Setup finished. Open Moodle at http://localhost:8080"
echo "Admin user: admin"
echo "Admin password: $ADMIN_PASSWORD"
