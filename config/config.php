<?php

unset($CFG);
global $CFG;
$CFG = new stdClass();

function moodle_docker_env_value(string $name, string $default = ''): string
{
    $value = getenv($name);

    // Defaults permitem validar o arquivo fora do container sem quebrar o boot local.
    return ($value === false || $value === '') ? $default : $value;
}

function moodle_docker_env_bool(string $name): bool
{
    $value = strtolower(moodle_docker_env_value($name, 'false'));

    return in_array($value, ['1', 'true', 'yes', 'on'], true);
}

$CFG->dbtype = moodle_docker_env_value('MOODLE_DB_TYPE', 'mysqli');
$CFG->dblibrary = 'native';
$CFG->dbhost = moodle_docker_env_value('MOODLE_DB_HOST', 'mysql');
// Esses valores sao derivados das variaveis MYSQL_* no Compose.
$CFG->dbname = moodle_docker_env_value('MOODLE_DB_NAME', 'moodle');
$CFG->dbuser = moodle_docker_env_value('MOODLE_DB_USER', 'moodle');
$CFG->dbpass = moodle_docker_env_value('MOODLE_DB_PASSWORD', 'change_me_moodle_password');
$CFG->prefix = moodle_docker_env_value('MOODLE_DB_PREFIX', 'mdl_');
$CFG->dboptions = [
    'dbpersist' => 0,
    'dbport' => moodle_docker_env_value('MOODLE_DB_PORT', '3306'),
    'dbsocket' => moodle_docker_env_value('MOODLE_DB_SOCKET'),
    'dbcollation' => moodle_docker_env_value('MOODLE_DB_COLLATION', 'utf8mb4_unicode_ci'),
];

$CFG->wwwroot = moodle_docker_env_value('MOODLE_WWWROOT', 'http://localhost:8080');
$CFG->dataroot = moodle_docker_env_value('MOODLE_DATA_DIR', '/var/www/moodledata');
$CFG->admin = moodle_docker_env_value('MOODLE_ADMIN_DIR', 'admin');

$CFG->directorypermissions = 02770;
$CFG->sslproxy = moodle_docker_env_bool('MOODLE_SSL_PROXY');
$CFG->reverseproxy = moodle_docker_env_bool('MOODLE_REVERSE_PROXY');

// Necessario porque o Apache usa FallbackResource para a pasta public/.
$CFG->routerconfigured = true;

require_once(__DIR__ . '/lib/setup.php');
