# List of survey files to fix
$surveyPages = @(
  ".\app\survey\firmographics\page.tsx",
  ".\app\survey\general-benefits\page.tsx",
  ".\app\survey\current-support\page.tsx",
  ".\app\survey\dimensions\page.tsx"
)

foreach ($file in $surveyPages) {
  if (Test-Path $file) {
    Write-Host "Patching $file ..."

    # 1. Backup
    Copy-Item $file "$file.bak" -Force

    # 2. Ensure OTHER_TEXT exists right after BTN_TEXT
    $content = Get-Content $file -Raw
    $content = $content -replace 'const BTN_TEXT = "text-left text-sm md:text-base";.*',
'const BTN_TEXT = "text-left text-sm md:text-base";`r`nconst OTHER_TEXT = "text-left text-sm md:text-base font-normal";'
    Set-Content $file $content

    # 3. Make all PlainTile "Other" use OTHER_TEXT instead of BTN_TEXT
    $content = Get-Content $file -Raw
    $content = $content -replace 'PlainTile([^}]*)className=\{BTN_TEXT\}', 'PlainTile$1className={OTHER_TEXT}'
    Set-Content $file $content

  } else {
    Write-Host "Skipping $file (not found)"
  }
}

Write-Host "All survey files patched. Backups created as .bak"
