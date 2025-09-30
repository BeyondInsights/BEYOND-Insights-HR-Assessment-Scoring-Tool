# Read the current file
$content = Get-Content .\app\survey\general-benefits\page.tsx -Raw

# 1. First, remove all font-semibold from buttons
$content = $content -replace 'font-semibold', ''

# 2. Fix the guidelines text - replace with full version
$oldGuidelines = '(?s)\{step === 1 && \([^}]+\)\}'
$newGuidelines = @"
        {step === 1 && (
          <div className="bg-blue-50 border-l-4 border-blue-600 p-6 space-y-4">
            <h3 className="text-lg font-bold text-blue-900 mb-4">
              GUIDELINES FOR MULTI-COUNTRY ORGANIZATIONS
            </h3>
            
            <p>
              We recognize the complexity of reporting on programs that vary across countries. 
              To keep this survey manageable while capturing meaningful differences, we've 
              structured questions in two ways:
            </p>
            
            <div className="space-y-3">
              <div>
                <p className="font-bold text-blue-900 mb-2">
                  Why we distinguish between US and other markets for select questions:
                </p>
                <p>
                  Healthcare and leave policies function fundamentally differently across countries. 
                  In the US, employers typically provide primary healthcare coverage and paid leave, 
                  while other countries often have robust national healthcare and statutory leave 
                  requirements. To fairly evaluate your organization's commitment to going above and 
                  beyond, we need to understand what you provide relative to these different baselines.
                </p>
              </div>

              <div>
                <p className="font-bold text-blue-900 mb-2">Most questions ask for your global approach</p>
                <p>
                  These cover universal areas like manager training, navigation services, or communication 
                  methods that can be standardized across markets.
                </p>
              </div>

              <div>
                <p className="font-bold text-blue-900 mb-2">Select questions distinguish between US and other markets</p>
                <p className="mb-2">
                  These appear only where healthcare systems or legal requirements create meaningful 
                  differences that affect how your programs are evaluated:
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>Medical leave policies (FMLA vs. statutory sick leave)</li>
                  <li>Disability insurance (employer-provided vs. government)</li>
                  <li>Health insurance continuation during leave</li>
                  <li>Job protection beyond legal requirements</li>
                </ul>
              </div>

              <div>
                <p className="font-bold text-blue-900 mb-2">For these questions, please report:</p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li><strong>US operations:</strong> All US-based employees</li>
                  <li><strong>Other markets:</strong> Your most common approach outside the US</li>
                </ul>
              </div>

              <div>
                <p className="font-bold text-blue-900 mb-2">How to respond when programs vary:</p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>Report on benefits available to 80%+ of employees in each category</li>
                  <li>If you have a global standard policy, report that standard</li>
                  <li>For "beyond legal requirements" questions, calculate based on what you provide above the minimum in each market</li>
                </ul>
              </div>
            </div>
          </div>
        )}
"@

$content = $content -replace $oldGuidelines, $newGuidelines

# 3. Change CB1_SPECIAL to CB1_NAVIGATION (correct name from doc)
$content = $content -replace 'CB1_SPECIAL', 'CB1_NAVIGATION'
$content = $content -replace 'cb1_special', 'cb1_navigation'

# Save the file
Set-Content .\app\survey\general-benefits\page.tsx $content

Write-Host "Fixed General Benefits page:" -ForegroundColor Green
Write-Host "- Removed font-semibold from all responses" -ForegroundColor Green
Write-Host "- Added full multi-country guidelines text" -ForegroundColor Green
Write-Host "- Renamed CB1_SPECIAL to CB1_NAVIGATION" -ForegroundColor Green