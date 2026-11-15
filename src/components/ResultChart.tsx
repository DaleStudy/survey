import { barX, colorLegend, colorLegendItems, defineChart, group, stack, text } from '@tanstack/charts'
import { Chart, type ChartDefinition } from '@tanstack/charts/react'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { scaleOrdinal } from '@tanstack/charts/scales/ordinal'
import { tooltip } from '@tanstack/charts/tooltip'
import { Text } from 'daleui'
import { useMemo } from 'react'
import type { Breakdown, QuestionStat } from '@/results/aggregate'
import { type ComparisonView, groupedLines } from '@/results/comparisons'
import { SCALE_POINTS } from '@/questions/survey'
import { displayOptions } from '@/results/order'

// 색은 dataviz 검증 스크립트로 확인한 값이다. 밝은 테마 기준.
export const BRAND = '#5333e1'
// 경력처럼 순서가 있는 집단: 보라 한 색의 밝기 단계
const ORDINAL = ['#9d8cf0', '#5333e1', '#2a1a80']
// 강조하지 않는 막대(관리자 화면의 지난날). ORDINAL 의 가장 밝은 단계다.
export const BRAND_SOFT = ORDINAL[0]
// 순서가 없는 집단과 문항 비교의 계열: 보라, 주황, 청록, 파랑, 올리브, 진홍. 이 순서로 쓴다.
// 여섯 색 모두 서로 구별되는 것을 확인했다(색각 이상에서 올리브↔주황은 경계 수준). 청록 등 일부는 바탕 대비가 3:1 에 못 미쳐서
// 막대마다 비율 글자와 범례, 표 보기를 함께 둔다.
const CATEGORICAL = ['#5333e1', '#eb6834', '#1baf7a', '#1f88d9', '#8a6d00', '#c2185b']
// 1~5점 척도: 주황(낮음) → 회색(보통) → 보라(높음)
const LIKERT = ['#d9531e', '#f3a07c', '#dde3e6', '#9d8cf0', '#5333e1']
// 척도 막대 칸 안의 비율 글자. 칸 색마다 4.5:1 을 넘는 색이다(흰 글자는 진한 주황 위에서 4.0:1 이라 쓰지 않는다).
const LIKERT_TEXT = ['#000000', '#3a1a0c', '#363c43', '#1d1147', '#fdfdff']
// 이보다 좁은 칸에는 비율을 적지 않는다. 글자가 칸 밖으로 넘친다.
const LIKERT_LABEL_MIN = 0.08

const percent = (share: number) => `${Math.round(share * 100)}%`

type Row = { label: string; share: number; series: string }

// 집단별 보기에서 % 라벨만 놓는 y축 이름
const LABEL_Y = 'labelY'

// 집단별 보기의 막대 배치. % 라벨 위치도 이 값으로 계산하므로 막대와 라벨이 함께 움직인다.
// 선택지 줄 사이 틈 (y 밴드의 paddingInner, paddingOuter 는 0)
const BAND_PADDING = 0.2
// 한 줄 안 집단 막대 사이와 양 끝의 틈 (group() 하위 밴드의 padding)
const GROUP_PADDING = 0.1

// 가장 긴 막대 끝의 % 라벨이 잘리지 않게 x축 끝에 여유를 둔다. 휴대폰 너비에서 "100%" 한 개가 들어갈 만큼.
function withHeadroom(rows: Row[]) {
  return scaleLinear().domain([0, Math.max(0.01, ...rows.map((r) => r.share)) * 1.18])
}

// 쌓은 막대 칸의 가운데. 막대는 3점 칸의 가운데를 0에 두고 양쪽으로 쌓는다(stack 의 anchor 와 같은 기준).
function likertLabels(rows: Row[]) {
  const byLabel = new Map<string, Row[]>()
  for (const r of rows) byLabel.set(r.label, [...(byLabel.get(r.label) ?? []), r])
  return [...byLabel.values()].flatMap((segments) => {
    const shares = segments.map((r) => r.share)
    let start = -(shares[0] + shares[1] + shares[2] / 2)
    return segments.flatMap((r, i) => {
      const at = start + r.share / 2
      start += r.share
      return r.share >= LIKERT_LABEL_MIN ? [{ ...r, at, fill: LIKERT_TEXT[i] }] : []
    })
  })
}

function likertRows(label: string, shares: Record<string, number>, scale?: { min: string; max: string }): Row[] {
  return SCALE_POINTS.map((code) => ({
    label,
    share: shares[code] ?? 0,
    series: code === '1' && scale ? `1 ${scale.min}` : code === '5' && scale ? `5 ${scale.max}` : code,
  }))
}

// 선택지 줄마다 계열(집단별 보기의 집단, 문항 비교의 문항)의 막대를 나란히 그린다.
// share 가 없는 칸(그 문항에 없는 선택지)은 막대 없이 "–"만 적는다.
function groupedBars(
  lines: { label: string; shares: (number | undefined)[] }[],
  series: string[],
  colors: { domain: string[]; range: string[] },
): { definition: ChartDefinition<any, any, any>; height: number } {
  const n = series.length
  const rows = lines.flatMap((l) => series.map((s, i) => ({ label: l.label, share: l.shares[i] ?? 0, missing: l.shares[i] === undefined, series: s })))
  // text 마크에는 group() 배치가 없어서, 라벨은 막대 중심을 따로 계산해 별도 y축(LABEL_Y)에 놓는다.
  // 단위는 바깥 밴드 한 칸. 줄 k 는 k 에서 시작해 막대 영역(1 - BAND_PADDING)을 차지하고,
  // 그 안을 group() 이 D3 band 처럼(양 끝 틈 포함, 가운데 정렬) n + GROUP_PADDING 칸으로 나눈다.
  const subStep = (1 - BAND_PADDING) / (n + GROUP_PADDING)
  const subCenter = (i: number) => i + GROUP_PADDING + (1 - GROUP_PADDING) / 2
  const labels = lines.flatMap((_, k) => series.map((_, i) => ({ ...rows[k * n + i], at: k + subStep * subCenter(i) })))
  return {
    height: lines.length * (n * 14 + 18) + 80,
    definition: defineChart({
      marks: [
        barX(rows, { x: 'share', y: 'label', color: 'series', z: 'series', inset: 1, radius: 4, layout: group({ padding: GROUP_PADDING }) }),
        text(labels, {
          x: 'share',
          y: 'at',
          yScale: LABEL_Y,
          key: (d) => `${d.label}:${d.series}`,
          text: (d) => (d.missing ? '–' : percent(d.share)),
          anchor: 'start',
          dx: 4,
          fontSize: 11,
        }),
      ],
      scales: {
        x: { scale: withHeadroom(rows), grid: true, axis: { ticks: { format: percent } } },
        y: { scale: () => scaleBand<string>().paddingInner(BAND_PADDING) },
        [LABEL_Y]: { scale: scaleLinear().domain([0, lines.length - BAND_PADDING]), channel: 'y', reverse: true, axis: false },
      },
      color: {
        scale: scaleOrdinal<string, string>().domain(colors.domain).range(colors.range),
        legend: colorLegend({ placement: 'top', items: colorLegendItems({ justify: 'start', gap: 20 }) }),
      },
      tooltip: { use: tooltip, items: [{ channel: 'x', label: '비율', text: (p) => (p.datum.missing ? '선택지 없음' : percent(p.datum.share)) }, 'group'] },
    }),
  }
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
            text(likertLabels(rows), {
              x: 'at',
              y: 'label',
              key: (d) => `${d.label}:${d.series}`,
              text: (d) => percent(d.share),
              anchor: 'middle',
              fill: (d) => d.fill,
              fontSize: 12,
              fontWeight: 700,
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
      return groupedBars(
        options.map((o) => ({ label: o.label, shares: visibleGroups.map((g) => g.shares[o.code] ?? 0) })),
        visibleGroups.map((g) => groupLabel(g.group)),
        // 숨긴 집단이 있어도 남은 집단의 색이 바뀌지 않게 전체 집단으로 색을 정한다
        { domain: breakdown?.groups.map((g) => g.label) ?? [], range: breakdown?.ordinal ? ORDINAL : CATEGORICAL },
      )
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
          x: { scale: withHeadroom(rows), grid: true, axis: { ticks: { format: percent } } },
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

// code 가 다른 두 문항을 가운데 0 에서 첫 문항은 왼쪽(주황), 둘째 문항은 오른쪽(보라)으로 뻗게 그린다.
// 줄은 첫 문항, 둘째 문항 순서로 쌓고 각 문항 안에서는 결과 화면 순서를 따른다.
// 한 줄에는 한쪽 막대만 있으므로 % 라벨은 모두 0 오른쪽에 둔다. 왼쪽 막대 끝에 두면 휴대폰에서 선택지 이름과 겹친다.
function divergingBars(view: ComparisonView): { definition: ChartDefinition<any, any, any>; height: number } {
  const [left, right] = view.series
  const rows = [left, right].flatMap(({ name, q }, side) =>
    displayOptions(q).map((o) => ({ key: `${q.id}:${o.code}`, label: o.label, share: o.share, x: side === 0 ? -o.share : o.share, series: name })),
  )
  const labelOf = new Map(rows.map((r) => [r.key, r.label]))
  // 오른쪽 막대 끝의 % 라벨 자리. 그림을 반으로 나눠 쓰므로 한쪽으로만 뻗는 차트(withHeadroom)보다 여유를 더 둔다.
  const edge = Math.max(0.01, ...rows.map((r) => r.share)) * 1.4
  return {
    height: rows.length * 32 + 90,
    definition: defineChart({
      marks: [
        barX(rows, { x: 'x', y: 'key', color: 'series', inset: 2, radius: 4 }),
        text(rows, {
          x: (d) => Math.max(0, d.x),
          y: 'key',
          text: (d) => percent(d.share),
          anchor: 'start',
          dx: 6,
          fontSize: 12,
        }),
      ],
      scales: {
        x: { scale: scaleLinear().domain([-edge, edge]), grid: true, axis: { ticks: { format: (v: number) => percent(Math.abs(v)) } } },
        y: { scale: () => scaleBand<string>().padding(0.2), axis: { ticks: { format: (k: string) => labelOf.get(k) ?? k } } },
      },
      color: {
        scale: scaleOrdinal<string, string>().domain([left.name, right.name]).range([CATEGORICAL[1], CATEGORICAL[0]]),
        legend: colorLegend({ placement: 'top', items: colorLegendItems({ justify: 'start', gap: 20 }) }),
      },
      tooltip: { use: tooltip, items: [{ channel: 'x', label: '비율', text: (p) => percent(p.datum.share) }, 'group'] },
    }),
  }
}

export function CompareChart({ view }: { view: ComparisonView }) {
  const { definition, height } = useMemo(() => {
    if (view.comparison.layout === 'diverging') return divergingBars(view)
    // 숨긴 문항이 있어도 남은 문항의 색이 바뀌지 않게 묶음의 모든 문항으로 색을 정한다
    const domain = view.comparison.questions.map((q) => q.name)
    return groupedBars(
      groupedLines(view),
      view.series.map((s) => s.name),
      { domain, range: CATEGORICAL },
    )
  }, [view])
  return <Chart definition={definition} height={height} ariaLabel={view.comparison.title} />
}
