# Paths to all survey page files
$surveyPages = @(
  ".\app\survey\firmographics\page.tsx",
  ".\app\survey\general-benefits\page.tsx",
  ".\app\survey\current-support\page.tsx"
)

foreach ($file in $surveyPages) {
  Write-Host "Patching $file ..."

  # 1. Backup
  Copy-Item $file "$file.bak" -Force

  # 2. Ensure OTHER_TEXT constant exists right after BTN_TEXT
  (Get-Content $file) -replace 'const BTN_TEXT = "text-left text-sm md:text-base";.*',
  'const BTN_TEXT = "text-left text-sm md:text-base";`nconst OTHER_TEXT = "text-left text-sm md:text-base font-normal";' |
    Set-Content $file

  # 3. Make all PlainTile "Other" use OTHER_TEXT instead of BTN_TEXT
  (Get-Content $file) -replace 'PlainTile([^}]*)className=\{BTN_TEXT\}', 'PlainTile$1className={OTHER_TEXT}' |
    Set-Content $file
}

Write-Host "All survey files patched. Backups created as .bak"
