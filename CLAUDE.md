# CLAUDE.md — BEYOND Insights HR Assessment Scoring Tool

## Project Overview

This is the "Best Companies for Working with Cancer" assessment tool, developed by BEYOND Insights LLC in collaboration with Cancer and Careers (a program of CEW Foundation). The application enables companies to complete a self-assessment measuring how well they support employees affected by cancer across 13 dimensions of workplace support.

The tool collects survey responses, scores them against a proprietary framework, and generates company-level reports. Results are also aggregated for benchmarking and for the annual "Best Companies" recognition program.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript (98%), JavaScript (2%)
- **Styling:** Tailwind CSS, PostCSS
- **Database:** Supabase (PostgreSQL) — stores survey responses for cross-device access
- **Deployment:** Vercel (primary), with Netlify functions as secondary/legacy
- **Testing:** Playwright (E2E)
- **Linting:** ESLint

## Project Structure
```
app/                  # Next.js App Router pages and layouts
components/           # Reusable React components (survey UI, dashboard, tiles)
lib/                  # Utility functions, Supabase client, scoring logic
data/                 # Assessment dimensions, questions, scoring weights
scripts/              # Build/maintenance scripts
tests/                # Playwright E2E tests
public/               # Static assets (logos, images)
netlify/functions/    # Legacy Netlify serverless functions
_archive/             # Archived/deprecated code
```

## Key Concepts

### Assessment Dimensions (13 total)
The survey evaluates companies across 13 dimensions of workplace cancer support. Each dimension contains multiple questions with weighted scoring. The scoring system produces both dimension-level and overall scores.

### Scoring Logic
- Located primarily in `lib/`
- Uses weighted scoring across dimensions
- Produces company-level scores and benchmarks
- Supports aggregate reporting for the "Best Companies" designation

### Admin Dashboard
- Monitors survey participation and completion rates
- Tracks company submissions
- Provides aggregate data views for Cancer and Careers staff

### Survey Flow
- Multi-page survey with progress tracking
- Supports save/resume via Supabase persistence
- Company registration and authentication
- Final submission triggers scoring

## Development
```bash
npm install
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build
npm run lint         # Run ESLint
```

## Deployment

- **Production:** Vercel (auto-deploys from main branch)
- **Live URL:** https://beyond-insights-hr-assessment-scori.vercel.app

## Important Notes

- The `.github/workflows/` directory contains CI/CD automation
- PowerShell scripts (`.ps1` files) in root are one-off fixes — not part of the regular build
- `backup_20250929_153333/` and `old2app/` are archived versions — do not modify
- Environment variables for Supabase connection are required (stored in Vercel)
- When editing survey questions or dimensions, ensure scoring weights in `data/` stay in sync with the scoring logic in `lib/`

## Coding Conventions

- Use TypeScript for all new code
- Follow existing component patterns in `components/`
- Keep survey dimension data in `data/` directory, not hardcoded in components
- Test changes against the live Supabase instance carefully — this is production data
- Commit messages should be descriptive of the change

## Owner

**BEYOND Insights LLC** — John (Managing Partner)
Client: **Cancer and Careers / CEW Foundation**
