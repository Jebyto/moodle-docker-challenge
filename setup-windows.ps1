param(
    [Parameter(Mandatory = $true, HelpMessage = 'Senha desejada para o administrador inicial do Moodle.')]
    [ValidateNotNullOrEmpty()]
    [string]$AdminPassword,

    [Parameter(Mandatory = $true, HelpMessage = 'Nome completo desejado para o site Moodle.')]
    [ValidateNotNullOrEmpty()]
    [string]$Fullname,

    [Parameter(Mandatory = $true, HelpMessage = 'Nome curto desejado para o site Moodle.')]
    [ValidateNotNullOrEmpty()]
    [string]$Shortname,

    [Parameter(Mandatory = $true, HelpMessage = 'E-mail desejado para o administrador inicial.')]
    [ValidateNotNullOrEmpty()]
    [string]$AdminEmail
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

function Invoke-Compose {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)

    & docker compose @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "docker compose $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
    }
}

function Invoke-Moodle {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)

    & docker compose exec -T -u www-data -w /var/www/moodle moodle @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Moodle command '$($Arguments -join ' ')' failed with exit code $LASTEXITCODE"
    }
}

function Test-MoodleFile {
    param([string]$Path)

    & docker compose exec -T -u www-data -w /var/www/moodle moodle test -f $Path
    return $LASTEXITCODE -eq 0
}

function Get-MoodleScript {
    param([string]$Path)

    if (Test-MoodleFile $Path) {
        return $Path
    }

    $PublicPath = "public/$Path"
    if (Test-MoodleFile $PublicPath) {
        return $PublicPath
    }

    throw "Could not find Moodle script: $Path"
}

function Test-MoodleInstalled {
    $PhpCode = @'
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
$result = $mysqli->query("SHOW TABLES LIKE '" . $table . "'");

exit(($result && $result->num_rows > 0) ? 0 : 1);
'@

    & docker compose exec -T -u www-data -w /var/www/moodle moodle php -r $PhpCode
    return $LASTEXITCODE -eq 0
}

if (-not (Test-Path '.env')) {
    throw 'Missing .env file. Create it from .env.example and review its values before running setup. Example: Copy-Item .env.example .env'
}

Write-Host 'Building and starting Docker containers...'
Invoke-Compose up --build -d

Write-Host 'Restarting Moodle container to apply mounted plugins...'
Invoke-Compose restart moodle

$InstallScript = Get-MoodleScript 'admin/cli/install_database.php'
$UpgradeScript = Get-MoodleScript 'admin/cli/upgrade.php'
$SeedScript = Get-MoodleScript 'local/seeddata/cli/seed.php'

if (Test-MoodleInstalled) {
    Write-Host 'Moodle database already installed. Skipping initial database installation.'
} else {
    Write-Host 'Installing Moodle database...'
    Invoke-Moodle php $InstallScript `
        --agree-license `
        "--adminpass=$AdminPassword" `
        "--fullname=$Fullname" `
        "--shortname=$Shortname" `
        "--adminemail=$AdminEmail"
}

Write-Host 'Installing or upgrading Moodle plugins...'
Invoke-Moodle php $UpgradeScript --non-interactive

Write-Host 'Running seed data import...'
Invoke-Moodle php $SeedScript

Write-Host 'Setup finished. Open Moodle at http://localhost:8080'
Write-Host 'Admin user: admin'
Write-Host "Admin password: $AdminPassword"
