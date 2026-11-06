import { barX, colorLegend, colorLegendItems, defineChart, group, stack, text } from '@tanstack/charts'
import { Chart, type ChartDefinition } from '@tanstack/charts/react'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { scaleOrdinal } from '@tanstack/charts/scales/ordinal'
import { tooltip } from '@tanstack/charts/tooltip'
import { Text } from 'daleui'
import { useMemo } from 'react'
import type { Breakdown, QuestionStat } from '@/results/aggregate'
import { displayOptions } from '@/results/order'

// 색은 dataviz 검증 스크립트로 확인한 값이다. 밝은 테마 기준.
const BRAND = '#5333e1'
// 경력처럼 순서가 있는 집단: 보라 한 색의 밝기 단계
const ORDINAL = ['#9d8cf0', '#5333e1', '#2a1a80']
// 순서가 없는 집단: 보라와 주황
const CATEGORICAL = ['#5333e1', '#eb6834']
// 1~5점 척도: 주황(낮음) → 회색(보통) → 보라(높음)
const LIKERT = ['#d9531e', '#f3a07c', '#dde3e6', '#9d8cf0', '#5333e1']

const percent = (share: number) => `${Math.round(share * 100)}%`

type Row = { label: string; share: number; series: string }

// 집단별 보기에서 % 라벨만 놓는 y축 이름
const LABEL_Y = 'labelY'

// 가장 긴 막대 끝의 % 라벨이 잘리지 않게 x축 끝에 여유를 둔다. 휴대폰 너비에서 "100%" 한 개가 들어갈 만큼.
function withHeadroom(rows: Row[]) {
  return scaleLinear().domain([0, Math.max(0.01, ...rows.map((r) => r.share)) * 1.18])
}

function likertRows(label: string, shares: Record<string, number>, scale?: { min: string; max: string }): Row[] {
  return ['1', '2', '3', '4', '5'].map((code) => ({
    label,
    share: shares[code] ?? 0,
    series: code === '1' && scale ? `1 ${scale.min}` : code === '5' && scale ? `5 ${scale.max}` : code,
  }))
}

export function ResultChart({ q, breakdown }: { q: QuestionStat; breakdown?: Breakdown }) {
  const groups = breakdown?.questions[q.id]
  const visibleGroups = groups?.filter((g) => !g.hidden) ?? []
  const groupLabel = (code: string) => breakdown?.groups.find((g) => g.code === code)?.label ?? code
  const hiddenGroups = groups?.filter((g) => g.hidden).map((g) => groupLabel(g.group)) ?? []

  // 분기마다 데이터와 y축 모양이 달라서(라벨용 숫자 y축 등) 정의 타입을 여기서 한 번 넓힌다
  const { definition, height } = useMemo((): { definition: ChartDefinition<any, any, any>; height: number } => {
    const likert = q.type === 'scale'
    const likertSeries = likert ? likertRows('', {}, q.scale).map((r) => r.series) : []

    if (likert) {
      const rows: Row[] = groups
        ? visibleGroups.flatMap((g) => likertRows(groupLabel(g.group), g.shares, q.scale))
        : likertRows('전체', Object.fromEntries(q.options.map((o) => [o.code, o.share])), q.scale)
      const rowCount = groups ? visibleGroups.length : 1
      return {
        height: rowCount * 44 + 90,
        definition: defineChart({
          marks: [
            barX(rows, {
              x: 'share',
              y: 'label',
              z: 'series',
              color: 'series',
              inset: 1,
              layout: stack({ order: likertSeries, anchor: { series: likertSeries[2], fraction: 0.5 } }),
            }),
          ],
          scales: {
            x: { scale: scaleLinear, nice: true, axis: { ticks: { format: (v: number) => percent(Math.abs(v)) } }, grid: true },
            y: { scale: () => scaleBand<string>().padding(0.25) },
          },
          color: {
            scale: scaleOrdinal<string, string>().domain(likertSeries).range(LIKERT),
            legend: colorLegend({ placement: 'bottom', items: colorLegendItems({ justify: 'start', gap: 20 }) }),
          },
          tooltip: { use: tooltip, items: [{ channel: 'x', label: '비율', text: (p) => percent(Math.abs(p.datum.share)) }, 'group'] },
        }),
      }
    }

    // 차트와 "표로 보기"가 같은 순서를 쓴다 (src/results/order.ts)
    const options = displayOptions(q)

    if (groups) {
      const range = breakdown?.id === 'experience' ? ORDINAL : CATEGORICAL
      const domain = breakdown?.groups.map((g) => g.label) ?? []
      const rows: Row[] = options.flatMap((o) =>
        visibleGroups.map((g) => ({ label: o.label, share: g.shares[o.code] ?? 0, series: groupLabel(g.group) })),
      )
      // text 마크에는 group() 배치가 없어서, 라벨은 막대 중심을 따로 계산해 별도 y축(LABEL_Y)에 놓는다.
      // 단위는 바깥 밴드 한 칸. y 밴드(paddingInner 0.2, paddingOuter 0)와 group() 기본 하위 밴드(padding 0.1)를 그대로 따른 식이다.
      const n = visibleGroups.length
      const labels = options.flatMap((_, k) =>
        visibleGroups.map((g, i) => ({ ...rows[k * n + i], at: k + (0.8 * (i + 0.55)) / (n + 0.1), group: g.group })),
      )
      return {
        height: options.length * (n * 14 + 18) + 80,
        definition: defineChart({
          marks: [
            barX(rows, { x: 'share', y: 'label', color: 'series', z: 'series', inset: 1, radius: 4, layout: group() }),
            text(labels, {
              x: 'share',
              y: 'at',
              yScale: LABEL_Y,
              key: (d) => `${d.label}:${d.group}`,
              text: (d) => percent(d.share),
              anchor: 'start',
              dx: 4,
              fontSize: 11,
            }),
          ],
          scales: {
            x: { scale: withHeadroom(rows), nice: true, grid: true, axis: { ticks: { format: percent } } },
            y: { scale: () => scaleBand<string>().paddingInner(0.2) },
            [LABEL_Y]: { scale: scaleLinear().domain([0, options.length - 0.2]), channel: 'y', reverse: true, axis: false },
          },
          color: {
            scale: scaleOrdinal<string, string>().domain(domain).range(range),
            legend: colorLegend({ placement: 'top', items: colorLegendItems({ justify: 'start', gap: 20 }) }),
          },
          tooltip: { use: tooltip, items: [{ channel: 'x', label: '비율', text: (p) => percent(p.datum.share) }, 'group'] },
        }),
      }
    }

    const rows: Row[] = options.map((o) => ({ label: o.label, share: o.share, series: '전체' }))
    return {
      height: options.length * 32 + 50,
      definition: defineChart({
        marks: [
          barX(rows, { x: 'share', y: 'label', fill: BRAND, inset: 2, radius: 4 }),
          text(rows, { x: 'share', y: 'label', text: (d) => percent(d.share), anchor: 'start', dx: 6, fontSize: 12 }),
        ],
        scales: {
          x: { scale: withHeadroom(rows), nice: true, grid: true, axis: { ticks: { format: percent } } },
          y: { scale: () => scaleBand<string>().padding(0.2) },
        },
        tooltip: {
          use: tooltip,
          items: [{ channel: 'x', label: '비율', text: (p) => `${percent(p.datum.share)} (${q.options.find((o) => o.label === p.datum.label)?.count ?? 0}명)` }],
        },
      }),
    }
  }, [q, breakdown])

  if (groups && visibleGroups.length === 0) {
    return <Text size="sm">모든 집단의 응답자가 적어서 집단별로는 보여 주지 않아요.</Text>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
      <Chart definition={definition} height={height} ariaLabel={q.label} />
      {hiddenGroups.length > 0 && (
        <Text size="sm" muted>
          {hiddenGroups.join(', ')} 집단은 응답자가 적어서 숨겼어요.
        </Text>
      )}
    </div>
  )
}
