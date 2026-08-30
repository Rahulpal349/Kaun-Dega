<#
.SYNOPSIS
Scans the Spring Boot backend codebase for common development artifacts that shouldn't be in production.

.DESCRIPTION
This script searches all .java files in src/main/java for:
- System.out.println
- printStackTrace
- TODO / FIXME comments
- H2 database imports or references
#>

$searchPath = ".\src\main\java"
$extensions = "*.java"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Spring Boot Production Code Scanner" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

function Find-Pattern {
    param(
        [string]$Pattern,
        [string]$Description
    )
    Write-Host "`nScanning for $Description ('$Pattern')..." -ForegroundColor Yellow
    $results = Get-ChildItem -Path $searchPath -Recurse -Filter $extensions | Select-String -Pattern $Pattern -CaseSensitive:$false
    
    if ($results) {
        Write-Host "⚠️ Found $($results.Count) occurrences:" -ForegroundColor Red
        $results | ForEach-Object {
            Write-Host "  $($_.Filename):$($_.LineNumber) -> $($_.Line.Trim())"
        }
    } else {
        Write-Host "✅ Clean! No occurrences found." -ForegroundColor Green
    }
}

Find-Pattern -Pattern "System\.out\.print" -Description "Console Prints"
Find-Pattern -Pattern "\.printStackTrace\(\)" -Description "Stack Traces"
Find-Pattern -Pattern "TODO|FIXME" -Description "TODOs and FIXMEs"
Find-Pattern -Pattern "import.*mock" -Description "Mock Data Imports"
Find-Pattern -Pattern "org\.h2" -Description "H2 Database References"

Write-Host "`nScan Complete!" -ForegroundColor Cyan
