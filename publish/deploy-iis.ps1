<#
  Публикация прототипов ATM на Windows Server через IIS.

  ЗАПУСКАТЬ НА СЕРВЕРЕ, в PowerShell от имени Администратора.
  Предварительно скопировать на сервер папку publish (index.html, ux.html, ui.html).

  Пример:
    .\deploy-iis.ps1 -Source C:\deploy\publish -SiteName atm-demo -Port 8080
    .\deploy-iis.ps1 -Source C:\deploy\publish -SiteName atm-demo -HostName demo.example.kz
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory)][string]$Source,          # папка с index.html, ux.html, ui.html
  [string]$SiteName = 'atm-demo',
  [string]$Path     = 'C:\inetpub\atm-demo',
  [int]   $Port     = 8080,
  [string]$HostName = '',                          # домен, если есть
  [switch]$OpenFirewall
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path (Join-Path $Source 'index.html'))) {
  throw "В папке '$Source' нет index.html. Укажите папку publish."
}

# --- 1. IIS со статикой и дефолтным документом -------------------------------
Write-Host '[1/5] Проверка ролей IIS...' -ForegroundColor Cyan
$features = @('Web-Server','Web-Static-Content','Web-Default-Doc')
foreach ($f in $features) {
  $st = Get-WindowsFeature -Name $f
  if (-not $st.Installed) {
    Write-Host "      установка $f" -ForegroundColor Yellow
    Install-WindowsFeature -Name $f -IncludeManagementTools | Out-Null
  }
}
Import-Module WebAdministration

# --- 2. Файлы ----------------------------------------------------------------
Write-Host '[2/5] Копирование файлов...' -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $Path | Out-Null
Copy-Item -Path (Join-Path $Source '*') -Destination $Path -Recurse -Force

# IIS_IUSRS нужен только на чтение — записи здесь быть не должно
$acl = Get-Acl $Path
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
  'IIS_IUSRS','ReadAndExecute','ContainerInherit,ObjectInherit','None','Allow')
$acl.SetAccessRule($rule)
Set-Acl $Path $acl

# --- 3. Сайт -----------------------------------------------------------------
Write-Host '[3/5] Настройка сайта IIS...' -ForegroundColor Cyan
if (Get-Website -Name $SiteName -ErrorAction SilentlyContinue) {
  Remove-Website -Name $SiteName
}
if ($HostName) {
  New-Website -Name $SiteName -PhysicalPath $Path -Port 80 -HostHeader $HostName -Force | Out-Null
  $url = "http://$HostName/"
} else {
  New-Website -Name $SiteName -PhysicalPath $Path -Port $Port -Force | Out-Null
  $url = "http://<адрес-сервера>:$Port/"
}

# --- 4. Кодировка и кеш ------------------------------------------------------
# Файлы в UTF-8 и объявляют charset в <meta>, но заголовок ставим явно,
# иначе часть браузеров в интранете покажет кириллицу «кракозябрами».
Write-Host '[4/5] MIME и заголовки...' -ForegroundColor Cyan
Set-WebConfigurationProperty -PSPath "IIS:\Sites\$SiteName" `
  -Filter 'system.webServer/staticContent' -Name 'clientCache' `
  -Value @{cacheControlMode='UseMaxAge'; cacheControlMaxAge='00:05:00'}

$web = Join-Path $Path 'web.config'
@'
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <staticContent>
      <remove fileExtension=".html" />
      <mimeMap fileExtension=".html" mimeType="text/html; charset=utf-8" />
    </staticContent>
    <defaultDocument>
      <files><clear /><add value="index.html" /></files>
    </defaultDocument>
    <httpProtocol>
      <customHeaders>
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="X-Frame-Options" value="SAMEORIGIN" />
        <add name="X-Robots-Tag" value="noindex, nofollow" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>
'@ | Set-Content -Path $web -Encoding utf8

# --- 5. Брандмауэр -----------------------------------------------------------
if ($OpenFirewall) {
  Write-Host '[5/5] Правило брандмауэра...' -ForegroundColor Cyan
  $p = if ($HostName) { 80 } else { $Port }
  $ruleName = "ATM demo $p"
  try { Get-NetFirewallRule -DisplayName $ruleName -ErrorAction Stop | Out-Null }
  catch {
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound `
      -Protocol TCP -LocalPort $p -Action Allow | Out-Null
  }
} else {
  Write-Host '[5/5] Брандмауэр не трогаем (нет -OpenFirewall)' -ForegroundColor DarkGray
}

Write-Host ''
Write-Host "Готово. Сайт доступен: $url" -ForegroundColor Green
Write-Host ''
Write-Host 'Дальше:' -ForegroundColor Cyan
Write-Host '  * Материалы предварительные — ограничьте доступ (см. README-PUBLISH.md).'
Write-Host '  * Для внешнего показа выпустите TLS-сертификат: win-acme (https://www.win-acme.com).'
