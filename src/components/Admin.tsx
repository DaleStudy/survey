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

// 원본 목록과 상세가 위아래로 쌓이는 너비. 화면(CSS)과 응답을 고를 때 스크롤(JS)이 같은 값을 본다.
export const STACKED = '(max-width: 900px)'

// 인라인 스타일로는 못 하는 것(:focus-visible, 화면 너비별 규칙, 탭의 활성 표시)만 둔다.
// 탭의 활성 표시를 인라인으로 덧씌우면 React 가 지울 때 축약 속성의 색까지 지워 비활성 탭에 밑줄이 남는다.
export const ADMIN_CSS = `
.admin-panel { display: flex; flex-direction: column; border: 1px solid var(--colors-border-neutral); border-radius: var(--radii-lg); }
.admin-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--spacing-16); }
.admin-stat { padding: var(--spacing-20); gap: var(--spacing-8); }
.admin-stat-label { font-size: 0.875rem; font-weight: 500; color: var(--colors-fg-neutral-placeholder); }
.admin-stat-value { font-size: 2.25rem; font-weight: 700; line-height: 1.2; font-variant-numeric: tabular-nums; }
.admin-tab { display: inline-flex; align-items: center; min-height: 48px; padding: 0 var(--spacing-12); margin-bottom: -1px; border-bottom: 2px solid transparent; color: var(--colors-fg-neutral-placeholder); font-weight: 500; text-decoration: none; }
.admin-tab[aria-current='page'] { color: var(--colors-fg-brand); border-bottom-color: var(--colors-bg-solid-brand); font-weight: 600; }
.admin-tab:focus-visible, .admin-row:focus-visible { outline: 2px solid var(--colors-border-brand-focus); outline-offset: -2px; }
.admin-raw { display: grid; grid-template-columns: minmax(0, 420px) minmax(0, 1fr); gap: var(--spacing-16); align-items: start; }
.admin-back { display: none; }
@media (max-width: 640px) {
  .admin-stats { gap: var(--spacing-8); }
  .admin-stat { padding: var(--spacing-12); gap: var(--spacing-4); }
  .admin-stat-label { font-size: 0.75rem; }
  .admin-stat-value { font-size: 1.5rem; }
}
@media ${STACKED} {
  .admin-raw { grid-template-columns: minmax(0, 1fr); }
  .admin-back { display: inline-flex; }
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
