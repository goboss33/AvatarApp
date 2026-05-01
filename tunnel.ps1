param(
    [switch]$Start,
    [switch]$Stop,
    [switch]$Check
)

$VpsHost = "31.220.92.70"
$VpsUser = "root"
$LocalPort = 5432

function Test-Tunnel {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", $LocalPort)
        $tcp.Close()
        return $true
    } catch {
        return $false
    }
}

function Start-Tunnel {
    if (Test-Tunnel) {
        Write-Host "[OK] Tunnel SSH deja actif sur le port $LocalPort" -ForegroundColor Green
        return
    }

    Write-Host "[...] Connexion SSH en cours..." -ForegroundColor Cyan
    Write-Host "[i] Entrez votre mot de passe ci-dessous" -ForegroundColor Yellow
    Write-Host ""

    $sshArgs = "-N", "-L", "${LocalPort}:localhost:${LocalPort}", "-o", "LogLevel=ERROR", "${VpsUser}@${VpsHost}"
    
    $tunnelProcess = Start-Process -FilePath "ssh" -ArgumentList $sshArgs -PassThru -NoNewWindow

    Write-Host "[...] Attente de la connexion..." -ForegroundColor Cyan
    $maxWait = 15
    $connected = $false

    for ($i = 0; $i -lt $maxWait; $i++) {
        Start-Sleep -Seconds 1
        if (Test-Tunnel) {
            $connected = $true
            break
        }
    }

    if ($connected) {
        Write-Host "[OK] Tunnel SSH connecte avec succes" -ForegroundColor Green
        Write-Host "[i] Vous pouvez maintenant lancer: npm run dev" -ForegroundColor Gray
    } else {
        Write-Host "[!] Echec de connexion. Verifiez votre mot de passe et reessayez." -ForegroundColor Red
    }
}

function Stop-Tunnel {
    Write-Host "[...] Arret du tunnel SSH..." -ForegroundColor Cyan
    Get-Process ssh -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*$VpsHost*" -or $_.CommandLine -like "*-L*" } | Stop-Process -Force
    Write-Host "[OK] Tunnel arrete" -ForegroundColor Green
}

if ($Start) {
    Start-Tunnel
} elseif ($Stop) {
    Stop-Tunnel
} elseif ($Check) {
    if (Test-Tunnel) {
        Write-Host "[OK] Tunnel est actif" -ForegroundColor Green
    } else {
        Write-Host "[!] Tunnel N'EST PAS actif" -ForegroundColor Red
        Write-Host "[i] Executez: .\tunnel.ps1 -Start" -ForegroundColor Gray
    }
} else {
    Start-Tunnel
}
