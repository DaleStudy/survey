// 차트 공유 페이지(/<회차>/results/<id>)의 미리보기 이미지. 결과를 공개할 때 집계로 만든다.
// bun scripts/results-og.ts <회차> <임시 폴더>  → public/og/<회차>/results/<id>.jpg
// 전체 응답 기준으로 선택지를 몇 줄만 막대로 그린다. 나머지는 링크를 눌러 페이지에서 본다.
// 폰트는 임시 폴더에 받는다. JPEG 변환은 sips(macOS)로 한다.
import { mkdir } from 'node:fs/promises'
import { Resvg } from '@resvg/resvg-js'
import { $ } from 'bun'
import { findEdition } from '@/editions'
import { BRAND, CATEGORICAL } from '@/lib/chartColors'
import { SCALE_POINTS } from '@/questions/survey'
import type { ResultSet } from '@/results/aggregate'
import { groupedLines } from '@/results/comparisons'
import { displayOptions } from '@/results/order'
import { type SharedChart, sharedCharts } from '@/results/share'
import { escapeXml, pretendard } from './fonts'

const [edition, out] = process.argv.slice(2)
if (!edition || !out) throw new Error('usage: bun scripts/results-og.ts <회차> <임시 폴더>')
const file = Bun.file(`src/results/${edition}.json`)
if (!(await file.exists())) throw new Error(`src/results/${edition}.json 이 없어요. bun run results ${edition} 로 먼저 만들어요.`)
const result = (await file.json()) as ResultSet
// 예시 회차는 운영에서 빠지므로(src/editions.ts) 제목을 찾지 못하면 회차 id 를 쓴다
const editionTitle = findEdition(edition)?.title ?? `${edition} 달레 스터디 개발자 설문조사`

await mkdir(out, { recursive: true })
await mkdir(`public/og/${edition}/results`, { recursive: true })
const fontFiles = await pretendard(out)

type Bar = { share?: number; color: string }
type Line = { label: string; bars: Bar[] }
type Picture = { subtitle?: string; legend: { name: string; color: string }[]; lines: Line[]; more: number }

const percent = (share: number) => `${Math.round(share * 100)}%`

// fit: 그림에 들어가는 줄 수. 남는 선택지는 "더 보기"로 센다.
function picture(chart: SharedChart, fit: number): Picture {
  if (chart.kind === 'question') {
    const { q } = chart
    const all: Line[] =
      q.type === 'scale'
        ? SCALE_POINTS.map((code) => ({
            label: code === '1' && q.scale ? `1 ${q.scale.min}` : code === '5' && q.scale ? `5 ${q.scale.max}` : code,
            bars: [{ share: q.options.find((o) => o.code === code)?.share ?? 0, color: BRAND }],
          }))
        : displayOptions(q).map((o) => ({ label: o.label, bars: [{ share: o.share, color: BRAND }] }))
    const mean = q.mean !== undefined ? ` · 평균 ${q.mean.toFixed(1)}점` : ''
    const multi = q.type === 'multi' ? ' · 여러 개 고를 수 있어요' : ''
    return { subtitle: `${q.answered.toLocaleString()}명이 답했어요${mean}${multi}`, legend: [], lines: all.slice(0, fit), more: Math.max(0, all.length - fit) }
  }
  const { view } = chart
  // 숨긴 문항이 있어도 색은 묶음의 모든 문항 순서로 정한다(화면의 CompareChart 와 같다). 범례에 응답자 수를 함께 적는다.
  const color = (name: string) => CATEGORICAL[view.comparison.questions.findIndex((x) => x.name === name)]
  const legendName = (s: (typeof view.series)[number]) => `${s.name} ${s.q.answered.toLocaleString()}명`
  if (view.comparison.layout === 'diverging') {
    // 화면처럼 첫 문항은 주황, 둘째 문항은 보라. 문항마다 위에서 몇 줄씩만 보인다.
    const sides = view.series.map((s, i) => ({ ...s, color: i === 0 ? CATEGORICAL[1] : CATEGORICAL[0], options: displayOptions(s.q) }))
    const per = Math.floor(fit / 2)
    return {
      legend: sides.map((s) => ({ name: legendName(s), color: s.color })),
      lines: sides.flatMap((s) => s.options.slice(0, per).map((o) => ({ label: o.label, bars: [{ share: o.share, color: s.color }] }))),
      more: sides.reduce((n, s) => n + Math.max(0, s.options.length - per), 0),
    }
  }
  const all = groupedLines(view).map((l) => ({ label: l.label, bars: l.shares.map((share, i) => ({ share, color: color(view.series[i].name) })) }))
  return { legend: view.series.map((s) => ({ name: legendName(s), color: color(s.name) })), lines: all.slice(0, fit), more: Math.max(0, all.length - fit) }
}

// 한글은 한 글자, 영문·숫자·기호는 반 글자 남짓으로 셈해 줄을 나누고 넘치면 말줄임표로 끝낸다
const width = (s: string) => [...s].reduce((w, c) => w + (/[ᄀ-ᇿ㄰-㆏가-힣]/.test(c) ? 1 : 0.56), 0)
function wrap(text: string, perLine: number, maxLines: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (width(next) <= perLine || !line) line = next
    else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  if (lines.length <= maxLines) return lines
  const kept = lines.slice(0, maxLines)
  kept[maxLines - 1] = clip(`${kept[maxLines - 1]} ${lines[maxLines]}`, perLine)
  return kept
}
function clip(text: string, max: number): string {
  if (width(text) <= max) return text
  let s = ''
  for (const c of text) {
    if (width(`${s}${c}…`) > max) break
    s += c
  }
  return `${s.trimEnd()}…`
}

const BOTTOM = 572
// 한 줄에 막대가 여럿이면 막대 하나가 이 높이는 되도록 줄 수를 줄인다. 그보다 얇으면 비율 글자가 겹친다.
const MIN_BAR = 22

function svg(chart: SharedChart): string {
  const title = wrap(chart.title, 23, 2)
  // 막대 영역이 시작하는 높이를 먼저 셈해서 들어갈 줄 수를 정한다(제목 줄 수, 문항이면 부제, 비교면 범례)
  const top = 78 + title.length * 58 + 44 + 26
  const series = chart.kind === 'comparison' && chart.view.comparison.layout === 'grouped' ? chart.view.series.length : 1
  const fit = Math.max(2, Math.min(7, Math.floor(((BOTTOM - top) * 0.75) / (series * MIN_BAR))))
  const p = picture(chart, fit)
  let y = 78
  const parts: string[] = [
    `<rect width="1200" height="630" fill="#ffffff"/>`,
    `<rect width="1200" height="8" fill="${BRAND}"/>`,
    `<text x="60" y="${y}" font-family="Pretendard" font-weight="600" font-size="26" fill="${BRAND}">${escapeXml(`${editionTitle} 결과`)}</text>`,
  ]
  for (const line of title) {
    y += 58
    parts.push(`<text x="60" y="${y}" font-family="Pretendard" font-weight="700" font-size="46" fill="#1A1530">${escapeXml(line)}</text>`)
  }
  y += 44
  if (p.subtitle) parts.push(`<text x="60" y="${y}" font-family="Pretendard" font-weight="600" font-size="22" fill="#5c6670">${escapeXml(clip(p.subtitle, 48))}</text>`)
  if (p.legend.length) {
    let x = 60
    for (const item of p.legend) {
      parts.push(`<circle cx="${x + 8}" cy="${y - 7}" r="8" fill="${item.color}"/>`)
      parts.push(`<text x="${x + 24}" y="${y}" font-family="Pretendard" font-weight="600" font-size="22" fill="#363c43">${escapeXml(item.name)}</text>`)
      x += 24 + width(item.name) * 22 + 36
    }
  }

  // 막대 영역. 왼쪽에 선택지 이름, 오른쪽에 막대와 비율
  const bottom = BOTTOM
  const rowHeight = (bottom - top) / p.lines.length
  const barHeight = Math.min(26, (rowHeight * 0.75) / series)
  const labelRight = 400
  const barLeft = 420
  const barRight = 1060
  const max = Math.max(0.01, ...p.lines.flatMap((l) => l.bars.map((b) => b.share ?? 0)))
  const scale = (share: number) => ((barRight - barLeft) * share) / (max * 1.12)
  p.lines.forEach((line, i) => {
    const middle = top + rowHeight * i + rowHeight / 2
    parts.push(
      `<text x="${labelRight}" y="${middle + 8}" text-anchor="end" font-family="Pretendard" font-weight="600" font-size="22" fill="#363c43">${escapeXml(clip(line.label, 15))}</text>`,
    )
    const groupTop = middle - (barHeight * line.bars.length) / 2
    line.bars.forEach((bar, j) => {
      const by = groupTop + barHeight * j
      if (bar.share === undefined) {
        parts.push(`<text x="${barLeft + 6}" y="${by + barHeight - 6}" font-family="Pretendard" font-weight="600" font-size="18" fill="#5c6670">–</text>`)
        return
      }
      const w = Math.max(2, scale(bar.share))
      parts.push(`<rect x="${barLeft}" y="${by + 1}" width="${w}" height="${barHeight - 2}" rx="4" fill="${bar.color}"/>`)
      parts.push(
        `<text x="${barLeft + w + 8}" y="${by + barHeight / 2 + 7}" font-family="Pretendard" font-weight="600" font-size="${series > 1 ? 18 : 22}" fill="#363c43">${percent(bar.share)}</text>`,
      )
    })
  })

  parts.push(`<rect x="${barLeft - 1}" y="${top - 6}" width="2" height="${bottom - top + 12}" fill="#c9d0d5"/>`)
  if (p.more > 0) parts.push(`<text x="60" y="608" font-family="Pretendard" font-weight="600" font-size="20" fill="#5c6670">선택지 ${p.more}개 더 보기 →</text>`)
  parts.push(`<text x="1140" y="608" text-anchor="end" font-family="Pretendard" font-weight="600" font-size="20" fill="#5c6670">survey.dalestudy.com</text>`)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">${parts.join('')}</svg>`
}

for (const chart of sharedCharts(result)) {
  const png = new Resvg(svg(chart), { font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Pretendard' } }).render().asPng()
  const raw = `${out}/${edition}-${chart.id}.png`
  await Bun.write(raw, png)
  await $`sips -s format jpeg -s formatOptions 82 ${raw} --out public/og/${edition}/results/${chart.id}.jpg`.quiet()
  console.log(`${edition}/results/${chart.id}: ok`)
}
