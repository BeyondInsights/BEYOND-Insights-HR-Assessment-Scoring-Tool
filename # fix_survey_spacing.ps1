# fix_survey_spacing.ps1

# Create QuestionWrapper component
$wrapperContent = @'
export default function QuestionWrapper({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mb-10 ${className}`}>
      {children}
    </div>
  );
}
'@
Set-Content -Path "beyond-survey\components\QuestionWrapper.tsx" -Value $wrapperContent
Write-Host "Created QuestionWrapper component" -ForegroundColor Green

# Fix OptionButton component
$optionContent = @'
export default function OptionButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        min-h-[64px] px-4 py-3 rounded-lg border-2 text-left transition-all w-full
        ${selected 
          ? 'bg-blue-50 border-blue-500' 
          : 'bg-white border-gray-300 hover:border-gray-400'}
      `}
    >
      <span className="text-sm md:text-base">{label}</span>
    </button>
  );
}
'@
Set-Content -Path "beyond-survey\components\OptionButton.tsx" -Value $optionContent
Write-Host "Updated OptionButton component" -ForegroundColor Green

# Add import to survey files
$surveyFiles = @(
    "beyond-survey\app\survey\firmographics\page.tsx",
    "beyond-survey\app\survey\general-benefits\page.tsx", 
    "beyond-survey\app\survey\current-support\page.tsx"
)

foreach ($file in $surveyFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Add QuestionWrapper import after other component imports
        if ($content -notmatch "QuestionWrapper") {
            $content = $content -replace '(import.*?Footer.*?\n)', "`$1import QuestionWrapper from `"@/components/QuestionWrapper`";`n"
        }
        
        # Fix all grid heights to be consistent
        $content = $content -replace 'grid grid-cols-(\d+) (?:md:)?grid-cols-(\d+) gap-3\s*(?:auto-rows-\[\d+px\])?', 'grid grid-cols-$1 md:grid-cols-$2 gap-3 auto-rows-[64px]'
        $content = $content -replace 'grid grid-cols-1 gap-3(?:\s+auto-rows-\[\d+px\])?', 'grid grid-cols-1 gap-3 auto-rows-[64px]'
        
        Set-Content $file $content -NoNewline
        Write-Host "Fixed: $file" -ForegroundColor Green
    }
}

Write-Host "`nAll files updated! Now wrap each question in <QuestionWrapper> tags for consistent spacing." -ForegroundColor Yellow