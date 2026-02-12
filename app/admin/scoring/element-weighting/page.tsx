
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import dynamic from 'next/dynamic'

const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(sbUrl, sbKey)

// Load v6.1 final weights (Dimension -> [{e,w,eq,s}])
import EW_JSON from './weights_v6_1.json'

type EwRow = { e: string; w: number; eq: number; s: number }
type EwByDim = Record<string, EwRow[]>

const EW: EwByDim = EW_JSON as any

// ---------- Dimension metadata (v6.1) ----------
const DIM_ORDER = [4, 8, 3, 2, 13, 6, 1, 5, 7, 9, 10, 11, 12] as const

const DIM_WEIGHT: Record<number, number> = { 4:14, 8:13, 3:12, 2:11, 13:10, 6:8, 1:7, 5:7, 7:4, 9:4, 10:4, 11:3, 12:3 }

const DIM_NAME: Record<number, string> = {
  1:'Medical Leave & Flexibility', 2:'Insurance & Financial Protection', 3:'Manager Preparedness & Capability',
  4:'Cancer Support Resources', 5:'Workplace Accommodations', 6:'Culture & Psychological Safety',
  7:'Career Continuity & Advancement', 8:'Work Continuation & Resumption', 9:'Executive Commitment & Resources',
  10:'Caregiver & Family Support', 11:'Prevention & Wellness', 12:'Continuous Improvement', 13:'Communication & Awareness'
}

// CV R² + alpha + n used + element count (from v6.1 docs)
const DIM_MODEL: Record<number, { cvR2: number; alpha: number; n: number; elems: number }> = {
  1:{cvR2:-0.131,alpha:0.30,n:41,elems:13},
  2:{cvR2: 0.022,alpha:0.40,n:36,elems:17},
  3:{cvR2: 0.167,alpha:0.50,n:38,elems:10},
  4:{cvR2: 0.413,alpha:0.50,n:40,elems:10},
  5:{cvR2: 0.453,alpha:0.50,n:39,elems:11},
  6:{cvR2: 0.361,alpha:0.50,n:38,elems:12},
  7:{cvR2: 0.330,alpha:0.50,n:34,elems:9},
  8:{cvR2: 0.530,alpha:0.50,n:38,elems:12},
  9:{cvR2: 0.136,alpha:0.50,n:34,elems:12},
  10:{cvR2:0.025,alpha:0.40,n:40,elems:20},
  11:{cvR2:0.376,alpha:0.50,n:40,elems:13},
  12:{cvR2:0.131,alpha:0.50,n:40,elems:9},
  13:{cvR2:0.644,alpha:0.50,n:40,elems:11},
}

// Some legacy exports include a duplicate micro-break element; keep both as-is in EW.
// D10 exclusion (from your scoring)
const D10_EXCLUDE = [
  'Concierge services to coordinate caregiving logistics (e.g., scheduling, transportation, home care)'
].map(s => s.toLowerCase().trim())

// ---------- scoring helpers ----------
const PTS = { OFFER:5, PLAN:3, ASSESS:2, NOT:0 } as const

function normalizeElementText(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/\u2019/g,"'")      // smart apostrophe
    .replace(/\u2013|\u2014/g,'-') // dashes
    .replace(/\s+/g,' ')
    .trim()
}

function statusToPoints(v: any): { points: number | null; unsure: boolean } {
  if (typeof v === 'number') {
    if (v === 4) return { points: PTS.OFFER, unsure:false }
    if (v === 3) return { points: PTS.PLAN, unsure:false }
    if (v === 2) return { points: PTS.ASSESS, unsure:false }
    if (v === 1) return { points: PTS.NOT, unsure:false }
    if (v === 5) return { points: null, unsure:true }
    return { points: null, unsure:false }
  }
  const s = String(v || '').toLowerCase()
  if (!s) return { points: null, unsure:false }
  if (s.includes('unsure') || s.includes('unknown')) return { points: null, unsure:true }
  if (s.includes('not able')) return { points: PTS.NOT, unsure:false }
  // order matters: planning/assessing BEFORE offer/provide/use
  if (s.includes('planning') || s.includes('development')) return { points: PTS.PLAN, unsure:false }
  if (s.includes('assessing') || s.includes('feasibility')) return { points: PTS.ASSESS, unsure:false }
  if (s.includes('currently') || s.includes('offer') || s.includes('provide')) return { points: PTS.OFFER, unsure:false }
  // if it’s some other filled string, treat as NOT (legacy)
  return { points: PTS.NOT, unsure:false }
}

function getGeoMultiplier(dimData: any): number {
  const geo = dimData?.[`d${dimData?.__dim}aa`] || dimData?.[`d${dimData?.__dim}aa`] || dimData?.geo || dimData?.d1aa
  const s = String(geo || '').toLowerCase()
  if (s.includes('select locations')) return 0.75
  if (s.includes('varies')) return 0.90
  return 1.0
}

// follow-up: leave as in your scoring page (simplified placeholder); if needed we can plug exact follow-up later
function blendFollowUp(base: number, followUp: number | null): number {
  if (followUp === null || followUp === undefined) return base
  return Math.round(base * 0.85 + followUp * 0.15)
}

// ---------- Types ----------
type DimScore = { eq: number; wt: number; tot: number; unsure: number; match: number; miss: number }

type CompanyRow = {
  company_name?: string
  survey_id?: string
  app_id?: string
  dimension1_data?: any
  [k: string]: any
}

type CompanyResult = {
  name: string
  id: string
  isPanel: boolean
  complete: boolean
  compositeEq: number
  compositeWt: number
  dims: Record<number, DimScore>
  matchRate: number
}

// ---------- UI: simple chart placeholder (optional)
const ProgressCircle = dynamic(() => import('@/components/ProgressCircle').catch(() => () => null as any), { ssr:false })

export default function ElementWeightingAdminPage() {
  const [tab, setTab] = useState<'exec'|'stats'|'weights'|'scoring'>('exec')
  const [rows, setRows] = useState<CompanyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [openDim, setOpenDim] = useState<number | null>(null)

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('assessments')
        .select('company_name,survey_id,app_id,firmographics_data,general_benefits_data,current_support_data,dimension1_data,dimension2_data,dimension3_data,dimension4_data,dimension5_data,dimension6_data,dimension7_data,dimension8_data,dimension9_data,dimension10_data,dimension11_data,dimension12_data,dimension13_data')
        .order('company_name')
      if (!error && data) setRows(data as any)
      setLoading(false)
    })()
  }, [])

  const results = useMemo(() => {
    const scored = rows
      .filter(r => {
        const id = (r.app_id || r.survey_id || '')
        return id && !id.toUpperCase().startsWith('TEST')
      })
      .map(scoreCompany)
      .filter(r => r.complete)

    const companies = scored.filter(c => !c.isPanel).sort((a,b)=> b.compositeWt - a.compositeWt)
    const benchmark = buildBenchmark(scored)

    return { companies, benchmark }
  }, [rows])

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-500">Loading…</p></div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/BI_LOGO_FINAL.png" alt="Beyond Insights" className="h-9" />
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Element Weighting</h1>
              <p className="text-xs text-slate-500">Executive overview, methodology, weights, and scoring impact</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/scoring" className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition">Aggregate Scoring</Link>
            <Link href="/admin" className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition">Dashboard</Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-6 flex gap-1">
          <TabButton label="Executive Overview" active={tab==='exec'} onClick={()=>setTab('exec')} />
          <TabButton label="Statistical Overview" active={tab==='stats'} onClick={()=>setTab('stats')} />
          <TabButton label="Element Weights" active={tab==='weights'} onClick={()=>setTab('weights')} />
          <TabButton label="Scoring Impact" active={tab==='scoring'} onClick={()=>setTab('scoring')} />
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {tab === 'exec' && <ExecutiveOverview />}
        {tab === 'stats' && <StatisticalOverview />}
        {tab === 'weights' && <WeightsTab openDim={openDim} setOpenDim={setOpenDim} />}
        {tab === 'scoring' && <ScoringImpact companies={results.companies} benchmark={results.benchmark} />}
      </div>
    </div>
  )
}

function TabButton({label, active, onClick}:{label:string; active:boolean; onClick:()=>void}) {
  return (
    <button onClick={onClick} className={`px-5 py-3 text-sm font-medium border-b-2 transition ${active?'border-slate-900 text-slate-900':'border-transparent text-slate-500 hover:text-slate-700'}`}>
      {label}
    </button>
  )
}

// ---------- Tab 1: Executive overview ----------
function ExecutiveOverview() {
  return (
    <div className="space-y-6">
      <Card title="What element weighting is—and what it is not" subtitle="Executive overview for HR leaders and company executives">
        <p className="text-sm text-slate-700 leading-relaxed">
          Element weighting is a <span className="font-semibold">calibration layer</span> inside each dimension. The Index framework—13 dimensions,
          the response scale (Not Offered / Assessing / Planning / Offered), and the dimension weights—remains unchanged. Weighting modestly
          increases differentiation by giving slightly more influence to elements that consistently distinguish stronger programs.
        </p>
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <MiniKpi title="What stays fixed" bullets={[
            '13 dimensions and their weights',
            '0 / 2 / 3 / 5 scoring scale',
            'Geo and follow-up blends (where applicable)',
          ]}/>
          <MiniKpi title="What changes" bullets={[
            'Within a dimension, elements contribute unequally',
            'Differences are modest by design',
            'Capped to avoid dominance (20%)',
          ]}/>
          <MiniKpi title="Why it matters" bullets={[
            'Separates “table stakes” from differentiators',
            'Improves prioritization and narrative',
            'Keeps rankings stable (calibration, not rewrite)',
          ]}/>
        </div>
      </Card>

      <Card title="How to read the outputs">
        <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-700">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="font-semibold text-slate-900">Element Weights tab</p>
            <p className="mt-1">Shows Equal vs Adjusted weight, the delta, and stability for each element—by dimension.</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="font-semibold text-slate-900">Scoring Impact tab</p>
            <p className="mt-1">Shows company scores under Equal vs Element-Weighted scoring, including benchmark comparison.</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ---------- Tab 2: Statistical overview ----------
function StatisticalOverview() {
  return (
    <div className="space-y-6">
      <Card title="Method summary (v6.1)">
        <ol className="text-sm text-slate-700 space-y-2 list-decimal ml-5">
          <li><span className="font-semibold">Encode elements on the full ordinal scale</span> (0/2/3/5). Treat Unsure as missing for fitting.</li>
          <li><span className="font-semibold">Exclude high-Unsure companies for estimation</span> (must have ≥60% observed elements within that dimension).</li>
          <li><span className="font-semibold">Predict “outside-dimension strength”</span>: outcome is the average score across the other 12 dimensions (leave-one-dimension-out).</li>
          <li><span className="font-semibold">Fit ridge regression</span> (stable under correlated predictors).</li>
          <li><span className="font-semibold">Use permutation importance</span> (non-negative) rather than raw coefficients.</li>
          <li><span className="font-semibold">Bootstrap stability</span> (200 resamples), attenuate weights by stability^1.5.</li>
          <li><span className="font-semibold">Adaptive shrinkage</span> toward equal weights based on CV R² per dimension.</li>
          <li><span className="font-semibold">Hard cap</span>: no element exceeds 20% of its dimension.</li>
        </ol>
      </Card>

      <Card title="Dimension model diagnostics">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-slate-500">Dim</th>
                <th className="px-3 py-2 text-left font-medium text-slate-500">Name</th>
                <th className="px-3 py-2 text-center font-medium text-slate-500">Elements</th>
                <th className="px-3 py-2 text-center font-medium text-slate-500">CV R²</th>
                <th className="px-3 py-2 text-center font-medium text-slate-500">α</th>
                <th className="px-3 py-2 text-center font-medium text-slate-500">n</th>
                <th className="px-3 py-2 text-center font-medium text-slate-500">Dim Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DIM_ORDER.map(d => {
                const m = DIM_MODEL[d]
                return (
                  <tr key={d} className={m.cvR2 < 0 ? 'bg-amber-50/40' : ''}>
                    <td className="px-3 py-2 font-medium text-slate-700">D{d}</td>
                    <td className="px-3 py-2 text-slate-600">{DIM_NAME[d]}</td>
                    <td className="px-3 py-2 text-center">{m.elems}</td>
                    <td className={`px-3 py-2 text-center ${m.cvR2 < 0 ? 'text-amber-700 font-semibold' : m.cvR2 > 0.30 ? 'text-emerald-700 font-semibold' : 'text-slate-600'}`}>
                      {m.cvR2.toFixed(3)}
                    </td>
                    <td className="px-3 py-2 text-center">{m.alpha.toFixed(2)}</td>
                    <td className="px-3 py-2 text-center">{m.n}</td>
                    <td className="px-3 py-2 text-center">{DIM_WEIGHT[d]}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ---------- Tab 3: Element weights ----------
function WeightsTab({openDim,setOpenDim}:{openDim:number|null; setOpenDim:(d:number|null)=>void}) {
  return (
    <div className="space-y-6">
      <Card title="Element weights by dimension" subtitle="Equal vs adjusted, with stability">
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white overflow-hidden">
          {DIM_ORDER.map(d => {
            const rows = (EW[String(d)] || []) as EwRow[]
            const m = DIM_MODEL[d]
            const open = openDim === d
            return (
              <div key={d}>
                <button onClick={()=>setOpenDim(open?null:d)} className="w-full px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition text-left">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="w-7 h-7 rounded-full bg-slate-800 text-white text-xs font-semibold flex items-center justify-center">{d}</span>
                    <span className="text-sm font-medium text-slate-800">{DIM_NAME[d]}</span>
                    <span className="text-xs text-slate-400">{rows.length} elements</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${m.cvR2<0?'bg-amber-100 text-amber-700':m.cvR2>0.3?'bg-emerald-100 text-emerald-700':'bg-slate-100 text-slate-600'}`}>CV R² {m.cvR2.toFixed(3)}</span>
                    <span className="text-xs text-slate-400">α {m.alpha.toFixed(2)}</span>
                  </div>
                  <svg className={`w-4 h-4 text-slate-400 transition ${open?'rotate-180':''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {open && (
                  <div className="px-6 pb-5">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-slate-500 w-10">#</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-500">Element</th>
                            <th className="px-3 py-2 text-center font-medium text-slate-500 w-20">Equal</th>
                            <th className="px-3 py-2 text-center font-medium text-slate-500 w-20">Adjusted</th>
                            <th className="px-3 py-2 text-center font-medium text-slate-500 w-20">Δ</th>
                            <th className="px-3 py-2 text-center font-medium text-slate-500 w-28">Stability</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rows.map((r, idx) => {
                            const delta = r.w - r.eq
                            const capped = r.w >= 0.1995
                            return (
                              <tr key={idx} className={capped ? 'bg-purple-50/40' : ''}>
                                <td className="px-3 py-2 text-slate-400">{idx+1}</td>
                                <td className="px-3 py-2 text-slate-700">{r.e}</td>
                                <td className="px-3 py-2 text-center text-slate-500">{(r.eq*100).toFixed(1)}%</td>
                                <td className={`px-3 py-2 text-center font-semibold ${capped?'text-purple-700':'text-slate-700'}`}>{(r.w*100).toFixed(1)}%</td>
                                <td className="px-3 py-2 text-center">
                                  <span className={delta>=0?'text-emerald-700':'text-amber-700'}>
                                    {delta>=0?'+':''}{(delta*100).toFixed(1)}
                                  </span>
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-2 justify-center">
                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full" style={{width:`${Math.round(r.s*100)}%`, backgroundColor: r.s>=0.7?'#059669':r.s>=0.5?'#d97706':'#dc2626'}} />
                                    </div>
                                    <span className="text-slate-500">{Math.round(r.s*100)}%</span>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

// ---------- Tab 4: scoring impact ----------
function ScoringImpact({companies, benchmark}:{companies:CompanyResult[]; benchmark:CompanyResult | null}) {
  if (!benchmark) return <p className="text-slate-500 text-sm">No completed assessments found.</p>
  return (
    <div className="space-y-6">
      <Card title="Equal-weight vs element-weighted scoring" subtitle="Benchmark + companies as headers; the only difference is within-dimension element weighting">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="sticky left-0 bg-slate-50 z-10 px-4 py-2 text-left font-medium text-slate-500 min-w-[210px]">Metric</th>
                <th className="px-3 py-2 text-center font-medium text-slate-600 min-w-[90px] border-l border-slate-200 bg-slate-100">Benchmark</th>
                {companies.map(c => (
                  <th key={c.id} className="px-3 py-2 text-center font-medium text-slate-600 min-w-[110px]">
                    <div className="truncate max-w-[110px]" title={c.name}>{c.name}</div>
                    <div className="text-[10px] text-slate-400">match {Math.round(c.matchRate*100)}%</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <SectionRow label="Composite Score" cols={2+companies.length} />
              <Row label="Equal" bench={benchmark.compositeEq} vals={companies.map(c=>c.compositeEq)} />
              <Row label="Weighted" bench={benchmark.compositeWt} vals={companies.map(c=>c.compositeWt)} highlight />
              <DeltaRow label="Δ" bench={benchmark.compositeWt-benchmark.compositeEq} vals={companies.map(c=>c.compositeWt-c.compositeEq)} />

              {DIM_ORDER.map(d => (
                <React.Fragment key={d}>
                  <SectionRow label={`D${d}: ${DIM_NAME[d]} (${DIM_WEIGHT[d]}%)`} cols={2+companies.length} />
                  <Row label="Equal" bench={benchmark.dims[d]?.eq ?? 0} vals={companies.map(c=>c.dims[d]?.eq ?? 0)} indent />
                  <Row label="Weighted" bench={benchmark.dims[d]?.wt ?? 0} vals={companies.map(c=>c.dims[d]?.wt ?? 0)} indent highlight />
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function SectionRow({label, cols}:{label:string; cols:number}) {
  return <tr className="bg-slate-800 text-white"><td colSpan={cols} className="px-4 py-2 font-semibold text-xs uppercase tracking-wider">{label}</td></tr>
}
function Row({label, bench, vals, indent, highlight}:{label:string; bench:number; vals:number[]; indent?:boolean; highlight?:boolean}) {
  return (
    <tr className={`border-b border-slate-100 ${highlight?'bg-emerald-50/30':''}`}>
      <td className={`sticky left-0 z-10 px-4 py-2 ${highlight?'bg-emerald-50/30':'bg-white'} text-slate-600 ${indent?'pl-8':''}`}>{label}</td>
      <td className={`px-3 py-2 text-center font-semibold border-l border-slate-200 ${highlight?'bg-emerald-50/50 text-emerald-700':'bg-slate-50 text-slate-700'}`}>{bench}</td>
      {vals.map((v,i)=><td key={i} className={`px-3 py-2 text-center ${highlight?'text-emerald-700 font-semibold':'text-slate-600'}`}>{v}</td>)}
    </tr>
  )
}
function DeltaRow({label, bench, vals}:{label:string; bench:number; vals:number[]}) {
  const fmt=(x:number)=> (x>=0?'+':'')+x
  return (
    <tr className="border-b border-slate-200">
      <td className="sticky left-0 bg-white z-10 px-4 py-2 text-slate-500">{label}</td>
      <td className="px-3 py-2 text-center text-slate-500 border-l border-slate-200 bg-slate-50">{fmt(bench)}</td>
      {vals.map((v,i)=><td key={i} className="px-3 py-2 text-center"><span className={v>=0?'text-emerald-700':'text-amber-700'}>{fmt(v)}</span></td>)}
    </tr>
  )
}

// ---------- shared UI ----------
function Card({title, subtitle, children}:{title:string; subtitle?:string; children:React.ReactNode}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-8 py-5 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      <div className="px-8 py-6">{children}</div>
    </div>
  )
}

function MiniKpi({title, bullets}:{title:string; bullets:string[]}) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <ul className="mt-2 text-sm text-slate-700 list-disc ml-5 space-y-1">
        {bullets.map((b,i)=><li key={i}>{b}</li>)}
      </ul>
    </div>
  )
}

// ---------- scoring core ----------
function buildWeightLookup(dim: number): Map<string, EwRow> {
  const rows = (EW[String(dim)] || []) as EwRow[]
  const m = new Map<string, EwRow>()
  for (const r of rows) m.set(normalizeElementText(r.e), r)
  return m
}

function scoreDimension(dim: number, a: CompanyRow): DimScore {
  const dimKey = `dimension${dim}_data`
  const dimData = (a as any)[dimKey]
  const r: DimScore = { eq:0, wt:0, tot:0, unsure:0, match:0, miss:0 }

  if (!dimData) return r
  const grid = dimData?.[`d${dim}a`]
  if (!grid || typeof grid !== 'object') return r

  const lookup = buildWeightLookup(dim)

  let earnedPts = 0
  let eqDen = 0
  let wtNum = 0
  let wtDen = 0

  for (const [k, v] of Object.entries(grid as any)) {
    const kNorm = normalizeElementText(String(k))
    if (dim === 10 && D10_EXCLUDE.includes(kNorm)) continue

    r.tot += 1
    const { points, unsure } = statusToPoints(v)
    if (unsure) {
      r.unsure += 1
      eqDen += PTS.OFFER
    } else if (points !== null) {
      earnedPts += points
      eqDen += PTS.OFFER

      const row = lookup.get(kNorm)
      if (row) r.match += 1
      else r.miss += 1

      const w = row?.w ?? (1 / r.tot)
      wtNum += (points / PTS.OFFER) * w
      wtDen += w
    }
  }

  // include unsure weights in weighted denominator so "unknown" reduces the weighted share (consistent with your earlier approach)
  for (const [k, v] of Object.entries(grid as any)) {
    const kNorm = normalizeElementText(String(k))
    if (dim === 10 && D10_EXCLUDE.includes(kNorm)) continue
    const { unsure } = statusToPoints(v)
    if (unsure) {
      const row = lookup.get(kNorm)
      const w = row?.w ?? (1 / r.tot)
      wtDen += w
    }
  }

  const eqRaw = eqDen > 0 ? Math.round((earnedPts / eqDen) * 100) : 0
  const wtRaw = wtDen > 0 ? Math.round((wtNum / wtDen) * 100) : eqRaw

  // Geo multiplier (if your dimData contains a geo field; if not, default to 1)
  const geo = 1.0 // keep consistent with existing admin scoring unless geo is explicitly in dimData
  const eqA = Math.round(eqRaw * geo)
  const wtA = Math.round(wtRaw * geo)

  // Follow-up blend (dims 1,3,12,13) – placeholder; wire in exact follow-up later if needed
  if ([1,3,12,13].includes(dim)) {
    r.eq = eqA
    r.wt = wtA
  } else {
    r.eq = eqA
    r.wt = wtA
  }

  return r
}

function scoreCompany(a: CompanyRow): CompanyResult {
  const id = (a.app_id || a.survey_id || '')
  const isPanel = id.startsWith('PANEL-')

  const dims: Record<number, DimScore> = {}
  let complete = true
  let totMatch = 0, totDen = 0

  for (let d=1; d<=13; d++) {
    dims[d] = scoreDimension(d, a)
    if (dims[d].tot === 0) complete = false
    totMatch += dims[d].match
    totDen += Math.max(1, dims[d].tot)
  }

  const matchRate = totDen > 0 ? (totMatch / totDen) : 0

  // composite = weighted dimension scores (90%) + maturity (5%) + breadth (5%) – placeholder maturity/breadth as 0 here
  const totDimW = Object.values(DIM_WEIGHT).reduce((s,v)=>s+v,0)
  let eqWD=0, wtWD=0
  for (let d=1; d<=13; d++) {
    const dw = (DIM_WEIGHT[d] / totDimW)
    eqWD += dims[d].eq * dw
    wtWD += dims[d].wt * dw
  }
  const compositeEq = complete ? Math.round(eqWD) : 0
  const compositeWt = complete ? Math.round(wtWD) : 0

  return {
    name: a.company_name || id || 'Unknown',
    id,
    isPanel,
    complete,
    compositeEq,
    compositeWt,
    dims,
    matchRate
  }
}

function buildBenchmark(all: CompanyResult[]): CompanyResult | null {
  if (!all.length) return null
  const bench: CompanyResult = {
    name:'Benchmark',
    id:'BENCH',
    isPanel:false,
    complete:true,
    compositeEq:0,
    compositeWt:0,
    dims:{} as any,
    matchRate:1
  }
  bench.compositeEq = Math.round(all.reduce((s,c)=>s+c.compositeEq,0)/all.length)
  bench.compositeWt = Math.round(all.reduce((s,c)=>s+c.compositeWt,0)/all.length)
  for (let d=1; d<=13; d++) {
    const ds = all.map(c=>c.dims[d]).filter(x=>x && x.tot>0)
    const eq = ds.length ? Math.round(ds.reduce((s,x)=>s+x.eq,0)/ds.length) : 0
    const wt = ds.length ? Math.round(ds.reduce((s,x)=>s+x.wt,0)/ds.length) : 0
    bench.dims[d] = { eq, wt, tot:0, unsure:0, match:0, miss:0 }
  }
  return bench
}
