import { barY, defineChart } from '@tanstack/charts'
import { Chart } from '@tanstack/charts/react'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import { Heading, Text } from 'daleui'
import { useMemo } from 'react'
import { BRAND } from '@/components/ResultChart'
import { koDate } from '@/lib/date'
import type { AdminSummary } from '@/server/admin'

// 인라인 스타일로는 못 하는 것(:focus-visible, :hover, 화면 너비별 규칙, 탭의 활성 표시)만 둔다.
// 탭의 활성 표시를 인라인으로 덧씌우면 React 가 지울 때 축약 속성의 색까지 지워 비활성 탭에 밑줄이 남는다.
export const ADMIN_CSS = `
.admin-panel { display: flex; flex-direction: column; border: 1px solid var(--colors-border-neutral); border-radius: var(--radii-lg); }
.admin-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--spacing-16); }
.admin-stat { padding: var(--spacing-20); gap: var(--spacing-8); }
.admin-stat-label { font-size: 0.875rem; font-weight: 500; color: var(--colors-fg-neutral-placeholder); }
.admin-stat-value { font-size: 2.25rem; font-weight: 700; line-height: 1.2; font-variant-numeric: tabular-nums; }
.admin-tab { display: inline-flex; align-items: center; min-height: 48px; padding: 0 var(--spacing-12); margin-bottom: -1px; border-bottom: 2px solid transparent; color: var(--colors-fg-neutral-placeholder); font-weight: 500; text-decoration: none; }
.admin-tab[aria-current='page'] { color: var(--colors-fg-brand); border-bottom-color: var(--colors-bg-solid-brand); font-weight: 600; }
.admin-tab:focus-visible, .admin-sort:focus-visible, .admin-expand:focus-visible, .admin-picker summary:focus-visible { outline: 2px solid var(--colors-border-brand-focus); outline-offset: 2px; border-radius: var(--radii-sm); }

/* 원본 응답 표. 칸 폭을 화면에 맞추고(table-layout: fixed) 긴 답은 줄바꿈해서 가로 스크롤이 생기지 않게 한다. */
.admin-table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 0.875rem; line-height: 1.5; }
.admin-table th, .admin-table td { padding: var(--spacing-8) var(--spacing-12); text-align: left; vertical-align: top; overflow-wrap: anywhere; border-bottom: 1px solid var(--colors-bg-neutral-hover); }
.admin-table th { font-weight: 600; color: var(--colors-fg-neutral-placeholder); border-bottom-color: var(--colors-border-neutral); }
.admin-table tbody tr:hover { background: var(--colors-bg-brand); }
.admin-table tr.admin-open, .admin-table tr.admin-detail { background: var(--colors-bg-brand); }
.admin-table tr.admin-open td { border-bottom: 0; }
.admin-table tr.admin-detail > td { padding: var(--spacing-8) var(--spacing-16) var(--spacing-20) 5.5rem; }
.admin-sort, .admin-expand { display: inline-flex; align-items: center; gap: var(--spacing-4); min-height: 32px; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: left; cursor: pointer; }
.admin-expand { font-weight: 600; color: var(--colors-fg-brand); font-variant-numeric: tabular-nums; }
.admin-expand svg { transition: transform 0.15s; }
.admin-expand[aria-expanded='true'] svg { transform: rotate(90deg); }
.admin-picker { position: relative; }
.admin-picker summary { display: inline-flex; align-items: center; min-height: 40px; padding: 0 var(--spacing-12); border: 1px solid var(--colors-border-neutral); border-radius: var(--radii-md); cursor: pointer; font-weight: 500; }
.admin-picker-panel { position: absolute; z-index: 1; top: calc(100% + var(--spacing-4)); left: 0; width: min(360px, calc(100vw - 48px)); max-height: 60vh; overflow-y: auto; padding: var(--spacing-12) var(--spacing-16); display: flex; flex-direction: column; gap: var(--spacing-12); background: var(--colors-app-bg); border: 1px solid var(--colors-border-neutral); border-radius: var(--radii-md); box-shadow: 0 8px 24px rgb(0 0 0 / 0.12); }
.admin-picker fieldset { margin: 0; padding: 0; border: 0; display: flex; flex-direction: column; gap: var(--spacing-8); }
.admin-picker legend { padding: 0 0 var(--spacing-4); font-size: 0.875rem; font-weight: 600; color: var(--colors-fg-brand); }

@media (max-width: 640px) {
  .admin-stats { gap: var(--spacing-8); }
  .admin-stat { padding: var(--spacing-12); gap: var(--spacing-4); }
  .admin-stat-label { font-size: 0.75rem; }
  .admin-stat-value { font-size: 1.5rem; }
  /* 휴대폰에서는 행을 카드처럼 쌓고, 머리글은 정렬 버튼 줄로 남긴다 */
  .admin-table, .admin-table tbody, .admin-table tr, .admin-table td { display: block; width: auto; }
  .admin-table thead tr { display: flex; flex-wrap: wrap; gap: 0 var(--spacing-12); padding: var(--spacing-4) var(--spacing-12); border-bottom: 1px solid var(--colors-border-neutral); }
  .admin-table thead th { width: auto !important; padding: 0; border: 0; }
  .admin-table tbody tr { padding: var(--spacing-8) 0; border-bottom: 1px solid var(--colors-bg-neutral-hover); }
  .admin-table td { padding: var(--spacing-2) var(--spacing-12); border: 0; }
  .admin-table td[data-label]:not(:first-child)::before { content: attr(data-label); display: block; font-size: 0.75rem; color: var(--colors-fg-neutral-placeholder); }
  .admin-table tr.admin-detail > td { padding: var(--spacing-8) var(--spacing-12) var(--spacing-12); }
}
`

export function AdminError({ error }: { error: unknown }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
      <Text>{error instanceof Error ? error.message : '응답을 불러오지 못했어요.'}</Text>
      <a href="/admin">다시 불러오기</a>
    </div>
  )
}

const seoulDate = (t: Date) => t.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })
const shortDate = (d: string) => `${Number(d.slice(5, 7))}. ${Number(d.slice(8, 10))}.`

// 첫 응답일부터 마감일(없으면 오늘)까지 하루 한 칸. 지난날은 0건도 칸을 두고, 남은 날은 비워 둬서 기간 중 어디쯤인지 보인다.
export function AdminDaily({ daily, closesAt }: { daily: AdminSummary['daily']; closesAt?: string }) {
  const today = seoulDate(new Date())
  const last = closesAt ? seoulDate(new Date(closesAt)) : today
  const days: string[] = []
  if (daily.length > 0) {
    for (const t = new Date(`${daily[0].date}T00:00:00Z`); t.toISOString().slice(0, 10) <= last; t.setUTCDate(t.getUTCDate() + 1)) {
      days.push(t.toISOString().slice(0, 10))
    }
  }
  const counts = new Map(daily.map((d) => [d.date, d.count]))
  const rows = days.map((date) => ({ date, count: date <= today ? (counts.get(date) ?? 0) : null }))
  const peak = daily.reduce((a, b) => (b.count > a.count ? b : a), daily[0] ?? { date: today, count: 0 })
  const total = daily.reduce((sum, d) => sum + d.count, 0)
  // 건수라서 눈금은 정수만. 자동 눈금은 하루 최대가 작으면 0.5 같은 소수로 나눈다.
  const step = Math.max(1, Math.ceil(peak.count / 3))
  const yTicks = [0, step, step * 2, step * 3]

  const definition = useMemo(
    () =>
      defineChart({
        marks: [barY(rows, { x: 'date', y: 'count', fill: BRAND, inset: 1, radius: 2 })],
        scales: {
          x: { scale: () => scaleBand<string>().padding(0.15), axis: { ticks: { values: days.filter((_, i) => i % 7 === 0), format: shortDate } } },
          y: { scale: scaleLinear().domain([0, step * 3]), grid: true, axis: { ticks: { values: yTicks, format: (v: number) => v.toLocaleString() } } },
        },
        tooltip: {
          use: tooltip,
          items: [
            { channel: 'x', label: '날짜', text: (p) => koDate(p.datum.date) },
            { channel: 'y', label: '응답', text: (p) => `${(p.datum.count ?? 0).toLocaleString()}건` },
          ],
        },
      }),
    [daily, closesAt, today],
  )

  return (
    <section aria-labelledby="daily-title" className="admin-panel" style={{ padding: 'var(--spacing-20) var(--spacing-24)', gap: 'var(--spacing-12)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-8)', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Heading level={2} size={5} id="daily-title">
          날짜별 응답
        </Heading>
        <Text size="sm" muted>
          한국 시간 기준{closesAt ? ` · ${koDate(last)} 마감` : ''}
        </Text>
      </div>
      {days.length === 0 ? (
        <Text muted>아직 응답이 없어요.</Text>
      ) : (
        <Chart
          definition={definition}
          height={140}
          ariaLabel="날짜별 응답 수"
          ariaDescription={`${koDate(days[0])}부터 오늘까지 ${total.toLocaleString()}건. 가장 많은 날은 ${koDate(peak.date)} ${peak.count.toLocaleString()}건.`}
        />
      )}
    </section>
  )
}
