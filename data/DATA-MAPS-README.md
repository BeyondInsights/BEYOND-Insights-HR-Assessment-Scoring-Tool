# Survey Data Maps - Documentation

## Overview
This directory contains the master data maps for the Best Companies for Working with Cancer: Employer Index survey. These maps define every survey item, its section, route, and response type.

## Map Files Structure

### 📄 instrument-items-company-profile.ts
**Route:** `/survey/firmographics`  
**Sections:** S1-S9a, CLASSIFICATION (C1-C7)  
**Purpose:** Company demographic information, respondent profile, industry classification

### 📄 instrument-items-general-current.ts
**Routes:** `/survey/general-benefits`, `/survey/current-support`  
**Sections:** CB1-CB3d (General Benefits), CS/OR1-OR6 (Current Support)  
**Purpose:** Current benefits offerings and organizational readiness for supporting employees with serious medical conditions

### 📄 instrument-items-dimensions-1-5.ts
**Route:** `/survey/dimensions/[1-5]`  
**Sections:** D1-D5  
**Purpose:** First 5 support dimensions (Leave, Financial Protection, Manager Training, Navigation, Workplace Accommodations)

### 📄 instrument-items-dimensions-6-10.ts
**Route:** `/survey/dimensions/[6-10]`  
**Sections:** D6-D10  
**Purpose:** Support dimensions 6-10 (Psychological Safety, Communications, Return to Work, Peer Support, Leadership)

### 📄 instrument-items-dimensions-11-13.ts
**Route:** `/survey/dimensions/[11-13]`  
**Sections:** D11-D13  
**Purpose:** Final 3 support dimensions (Career Development, Measurement, Privacy & Ethics)

### 📄 instrument-items-advanced-assessments.ts
**Routes:** `/survey/cross-dimensional-assessment`, `/survey/employee-impact-assessment`  
**Sections:** CD1a-CD2 (Cross-Dimensional), EI1-EI5 (Employee Impact)  
**Purpose:** Cross-cutting analysis and impact measurement

## Special Cases & Design Decisions

### 🔀 Wildcard Routes (Shared Items)
**Five items intentionally use wildcard routes** `/survey/dimensions/*` because they appear conditionally across multiple dimension sections:

#### MULTI_COUNTRY Items (4 items)
- `D_AA.question` - "Are the support options your organization currently offers...?"
- `D_AA.1` - "Only available in select locations"
- `D_AA.2` - "Vary across locations"
- `D_AA.3` - "Generally consistent across all locations"

**Usage:** These items appear in each dimension (D1-D13) when the respondent indicates their organization operates in multiple countries. They assess whether support offerings are consistent globally.

#### OPEN_ENDED Item (1 item)
- `D_B.checkbox` - "[ ] No other benefits..."

**Usage:** This checkbox appears across multiple dimensions as a "none of the above" option.

**⚠️ Important:** When validating routes, these 5 items should be whitelisted as acceptable wildcards. They are NOT route errors.

### 📊 Type Designations

#### D13 Uses likert-5 Scale
**Section D13** (Privacy & Ethics) deliberately uses `likert-5` scale while other dimensions use `likert-4`. This is intentional - D13 includes an "Unsure/Not applicable" option to account for privacy-related items where organizations may not have visibility.

#### Standard Type Distribution
- **Dimensions (D1-D13):** Primarily `likert-4` (except D13)
- **General Benefits (CB):** Primarily `multi-select`
- **Firmographics (S/CLASS):** Primarily `select` with some `text`
- **Current Support (CS):** Mixed `multi-select`, `select`, `text`
- **Impact Assessment (EI):** Mixed `likert-5`, `select`, `multi-select`

## Coverage Analysis Files

The following CSV files document data quality and coverage:

### coverage_app_vs_survey.csv
Complete mapping of survey items to map entries with confidence scores

### missing_from_maps.csv
Survey items with low-confidence matches (<0.62) - may need review

### orphans_in_maps.csv
Map items without clear survey counterparts - these are often:
- Instruction text items
- Conditional logic markers
- Display guidance
- Legacy items from earlier versions

### route_issues.csv
Items with potentially incorrect routes - **EXCEPT** the 5 wildcard items documented above

### type_distribution_by_section.csv
Summary of response types per section for validation

## Item ID Conventions

- **D[1-13].a[n]** - Dimension items (e.g., D1.a2, D3.a14)
- **CB[1-3].[n]** - General benefits items
- **S[1-9].[n]** - Firmographics/screening items
- **CLASS.[n]** - Classification items
- **EI[1-5].[n]** - Employee impact items
- **CD[1-2].[n]** - Cross-dimensional items
- **AU[1-2].[n]** - Authorization items
- **D_AA.[n]** - Multi-country shared items
- **D_B.[n]** - Open-ended shared items

## Maintenance Notes

### When Adding New Items
1. Place in appropriate map file based on route
2. Use consistent ID conventions
3. Set correct type (likert-4, likert-5, select, multi-select, text)
4. Ensure route matches section pattern

### When Modifying Routes
1. Update route in item definition
2. Verify section alignment still makes sense
3. Check if item should remain in current map file
4. Update this README if adding new route patterns

### When Analyzing Coverage
1. Note that "orphans" may be legitimate instruction/display items
2. Low-confidence matches often indicate minor wording variations
3. The 5 wildcard items are intentional - not errors
4. D13 likert-5 scale is intentional - not an error

## Version History

**Current Version:** Cleaned and consolidated maps  
**Status:** All 6 map files validated and aligned with survey structure  
**Items:** 356 real survey items (408 total including instructions/metadata)
