# Fix Dashboard Completion Tracking
$content = Get-Content ".\app\dashboard\page.tsx" -Raw

# Add state for dimension progress
$content = $content.Replace("const [sectionProgress, setSectionProgress] = useState({", "const [dimensionProgress, setDimensionProgress] = useState(new Array(13).fill(0))
  const [sectionProgress, setSectionProgress] = useState({")

# Update the useEffect to check completion flags
$oldCheck = "setSectionProgress({"
$newCheck = "// Check completion flags
    const firmComplete = localStorage.getItem('firmographics_complete') === 'true'
    const genComplete = localStorage.getItem('general_benefits_complete') === 'true'  
    const curComplete = localStorage.getItem('current_support_complete') === 'true'
    
    // Check dimension completions
    const dimProgress = []
    for (let i = 1; i <= 13; i++) {
      const complete = localStorage.getItem(`dimension${i}_complete`) === 'true'
      dimProgress.push(complete ? 100 : 0)
    }
    setDimensionProgress(dimProgress)
    
    setSectionProgress({"

$content = $content.Replace($oldCheck, $newCheck)

# Use completion flags if they exist
$content = $content.Replace("firmographics: percentComplete(firmo, firmRequired),", "firmographics: firmComplete ? 100 : percentComplete(firmo, firmRequired),")
$content = $content.Replace("general:       percentComplete(general, genRequired),", "general: genComplete ? 100 : percentComplete(general, genRequired),")
$content = $content.Replace("current:       percentComplete(current, curRequired),", "current: curComplete ? 100 : percentComplete(current, curRequired),")

# Update dimension progress circles
$content = $content.Replace("<ProgressCircle completion={0} />", "<ProgressCircle completion={dimensionProgress[idx] || 0} />")

# Update dimension text
$content = $content.Replace("allCoreDone ? 'Click to begin' : 'Available after completing all 3 sections'", "dimensionProgress[idx] === 100 ? 'Completed' : allCoreDone ? 'Click to begin' : 'Available after completing all 3 sections'")

Set-Content ".\app\dashboard\page.tsx" $content -Encoding UTF8
Write-Host "Dashboard updated successfully!" -ForegroundColor Green
