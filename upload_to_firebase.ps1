$apiKey = "AIzaSyAdjrp1PwT1T32jYlW8MATsUHTLzCgDCWM"
$projectId = "ramones-373c4"

function ConvertTo-FirestoreValue($val) {
    if ($val -is [string]) {
        return @{ stringValue = $val }
    }
    elseif ($val -is [double] -or $val -is [float] -or $val -is [decimal]) {
        return @{ doubleValue = $val }
    }
    elseif ($val -is [int]) {
        return @{ integerValue = "$val" }
    }
    elseif ($val -is [array]) {
        $values = @()
        foreach ($item in $val) {
            $values += ConvertTo-FirestoreValue $item
        }
        return @{ arrayValue = @{ values = $values } }
    }
    elseif ($val -is [hashtable] -or $val -is [System.Collections.Specialized.OrderedDictionary]) {
        $fields = @{}
        foreach ($key in $val.Keys) {
            $fields[$key] = ConvertTo-FirestoreValue $val[$key]
        }
        return @{ mapValue = @{ fields = $fields } }
    }
    elseif ($val -is [PSCustomObject]) {
        $fields = @{}
        $val.PSObject.Properties | ForEach-Object {
            $fields[$_.Name] = ConvertTo-FirestoreValue $_.Value
        }
        return @{ mapValue = @{ fields = $fields } }
    }
    else {
        return @{ stringValue = "$val" }
    }
}

# Ler os produtos do script.js
$scriptContent = Get-Content -Path ".\script.js" -Raw -Encoding UTF8

# Extrair o array defaultProducts
if ($scriptContent -match 'const defaultProducts = (\[.*?\]);') {
    $productsJson = $Matches[1]
} else {
    Write-Host "ERRO: Nao foi possivel encontrar defaultProducts no script.js" -ForegroundColor Red
    exit 1
}

$products = $productsJson | ConvertFrom-Json

Write-Host "Encontrados $($products.Count) produtos para upload:" -ForegroundColor Cyan
foreach ($p in $products) {
    Write-Host "  - $($p.name) ($($p.cat)) - R$ $($p.price)" -ForegroundColor Gray
}

# Converter para formato Firestore
$firestoreProducts = @()
foreach ($p in $products) {
    $firestoreProducts += ConvertTo-FirestoreValue $p
}

$body = @{
    fields = @{
        products = @{
            arrayValue = @{
                values = $firestoreProducts
            }
        }
    }
} | ConvertTo-Json -Depth 30 -Compress

$url = "https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents/loja/catalogo?key=$apiKey"

Write-Host "`nEnviando para o Firestore..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $url -Method Patch -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) -ContentType "application/json; charset=utf-8"
    Write-Host "`nSUCESSO! Catalogo enviado para o Firebase Firestore!" -ForegroundColor Green
    Write-Host "Documento: loja/catalogo" -ForegroundColor Green
    Write-Host "Total de produtos: $($products.Count)" -ForegroundColor Green
} catch {
    $errorMsg = $_.Exception.Message
    $statusCode = $_.Exception.Response.StatusCode
    Write-Host "`nERRO ao enviar para o Firestore:" -ForegroundColor Red
    Write-Host "Status: $statusCode" -ForegroundColor Red
    Write-Host "Mensagem: $errorMsg" -ForegroundColor Red
    
    if ($statusCode -eq "Forbidden" -or $statusCode -eq "Unauthorized" -or $errorMsg -match "PERMISSION_DENIED") {
        Write-Host "`n>> As regras do Firestore estao bloqueando a escrita." -ForegroundColor Yellow
        Write-Host ">> Atualize as regras em: https://console.firebase.google.com/project/$projectId/firestore/rules" -ForegroundColor Yellow
        Write-Host '>> Regras sugeridas:' -ForegroundColor Yellow
        Write-Host 'rules_version = "2";' -ForegroundColor Cyan
        Write-Host 'service cloud.firestore {' -ForegroundColor Cyan
        Write-Host '  match /databases/{database}/documents {' -ForegroundColor Cyan
        Write-Host '    match /{document=**} {' -ForegroundColor Cyan
        Write-Host '      allow read: if true;' -ForegroundColor Cyan
        Write-Host '      allow write: if true;' -ForegroundColor Cyan
        Write-Host '    }' -ForegroundColor Cyan
        Write-Host '  }' -ForegroundColor Cyan
        Write-Host '}' -ForegroundColor Cyan
    }
}
