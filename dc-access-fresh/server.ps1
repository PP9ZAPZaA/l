# Data Center Access System - Local Static File Server
# Portable: always serves the folder this script lives in (no hardcoded paths)
# If the preferred port is busy, it automatically tries the next ones.

$root = $PSScriptRoot
$preferredPorts = @(8080, 8081, 8082, 8090, 8000, 5000)

$listener = $null
$port = $null

foreach ($tryPort in $preferredPorts) {
    $candidate = New-Object System.Net.HttpListener
    $candidate.Prefixes.Add("http://localhost:$tryPort/")
    try {
        $candidate.Start()
        $listener = $candidate
        $port = $tryPort
        break
    } catch {
        continue
    }
}

if (-not $listener) {
    Write-Host "======================================================" -ForegroundColor Red
    Write-Host " Could not start the server on any of these ports:" -ForegroundColor Red
    Write-Host " $($preferredPorts -join ', ')" -ForegroundColor Red
    Write-Host " Close other Command Prompt / PowerShell windows running" -ForegroundColor Red
    Write-Host " this same server, then try again." -ForegroundColor Red
    Write-Host "======================================================" -ForegroundColor Red
    pause
    exit
}

Write-Host "======================================================"
Write-Host " Data Center Access System - Local Server"
Write-Host " Serving folder: $root"
Write-Host " URL: http://localhost:$port/"
Write-Host "======================================================"
Start-Process "http://localhost:$port/"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $path = $request.Url.LocalPath
    if ($path -eq "/") { $path = "/index.html" }
    $localPath = Join-Path $root $path.TrimStart('/')

    if (Test-Path $localPath -PathType Leaf) {
        $content = [System.IO.File]::ReadAllBytes($localPath)
        if ($localPath.EndsWith(".html")) { $response.ContentType = "text/html; charset=utf-8" }
        elseif ($localPath.EndsWith(".css")) { $response.ContentType = "text/css" }
        elseif ($localPath.EndsWith(".js")) { $response.ContentType = "text/javascript" }

        $response.ContentLength64 = $content.Length
        $response.OutputStream.Write($content, 0, $content.Length)
    } else {
        $response.StatusCode = 404
    }
    $response.Close()
}
