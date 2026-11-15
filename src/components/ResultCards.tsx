import { Heading, Icon, Text } from 'daleui'
import { CompareChart, ResultChart } from '@/components/ResultChart'
import { SITE_URL } from '@/lib/og'
import { useShare } from '@/lib/useShare'
import { type Breakdown, MIN_GROUP, type QuestionStat } from '@/results/aggregate'
import { type ComparisonView, groupedLines } from '@/results/comparisons'
import { displayOptions } from '@/results/order'

// 결과 화면과 차트 공유 페이지가 함께 쓰는 카드. 집계(ResultSet)만 읽는다.

const percent = (share: number) => `${Math.round(share * 100)}%`

export function QuestionResult({ q, breakdown, edition }: { q: QuestionStat; breakdown?: Breakdown; edition: string }) {
  const groups = breakdown?.questions[q.id]
  if (q.hidden) {
    return (
      <article style={{ ...card, flexDirection: 'row', gap: 14, alignItems: 'flex-start', padding: '20px 24px', border: 0, background: 'var(--colors-bg-neutral-hover)' }}>
        <Icon name="eyeOff" size="sm" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <Heading level={3} size={5} wordBreak="cjk" style={{ fontSize: '1.0625rem', lineHeight: 1.5 }}>
            {q.label}
          </Heading>
          <Text>응답자가 {MIN_GROUP}명보다 적어서 숨겼어요. 누가 답했는지 알아볼 수 없게 하려고요.</Text>
        </div>
      </article>
    )
  }
  return (
    <article id={q.id} style={card}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-12) var(--spacing-24)', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Heading level={3} size={5} wordBreak="cjk" style={{ lineHeight: 1.4 }}>
            {q.label}
          </Heading>
          <Text size="sm" muted>
            {q.answered.toLocaleString()}명이 답했어요.{q.type === 'multi' ? ' 여러 개 고를 수 있어서 합이 100%를 넘어요.' : ''}
          </Text>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-16)', alignItems: 'flex-start', marginLeft: 'auto' }}>
          {q.mean !== undefined && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Text size="sm" weight="semibold" muted>
                평균
              </Text>
              <span style={{ fontSize: '1.875rem', fontWeight: 800, lineHeight: 1.1, color: 'var(--colors-fg-brand)', fontVariantNumeric: 'tabular-nums' }}>
                {q.mean.toFixed(1)}
                <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--colors-fg-neutral-placeholder)' }}> / 5</span>
              </span>
            </div>
          )}
          <ChartShareButton edition={edition} id={q.id} title={q.label} />
        </div>
      </div>
      {q.type === 'long' ? (
        <Text>자유 의견은 이름이나 회사명처럼 특정인을 알아볼 수 있는 정보를 지운 뒤 따로 정리해요.</Text>
      ) : (
        <>
          <ResultChart q={q} breakdown={breakdown} />
          <details style={{ paddingTop: 14, borderTop: '1px solid var(--colors-bg-neutral-hover)' }}>
            <summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>표로 보기</summary>
            <table style={{ marginTop: 'var(--spacing-8)', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  <th scope="col" style={cell}>
                    선택지
                  </th>
                  {groups ? (
                    groups.map((g) => (
                      <th key={g.group} scope="col" style={cell}>
                        {breakdown?.groups.find((x) => x.code === g.group)?.label}
                      </th>
                    ))
                  ) : (
                    <th scope="col" style={cell}>
                      비율
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {/* 차트와 같은 순서 */}
                {displayOptions(q).map((o) => (
                  <tr key={o.code}>
                    <th scope="row" style={{ ...cell, fontWeight: 400 }}>
                      {o.label}
                    </th>
                    {groups ? (
                      groups.map((g) => (
                        <td key={g.group} style={cell}>
                          {g.hidden ? '숨김' : percent(g.shares[o.code] ?? 0)}
                        </td>
                      ))
                    ) : (
                      <td style={cell}>
                        {percent(o.share)} ({o.count.toLocaleString()}명)
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </article>
  )
}

// 여러 문항을 한 차트로. 집단별 보기를 골라도 전체 응답으로 그린다.
export function ComparisonResult({ view, breakdown, edition }: { view: ComparisonView; breakdown?: Breakdown; edition: string }) {
  const { comparison, series } = view
  // 표는 차트와 같은 줄. diverging 은 문항마다 선택지가 달라서 문항별로 이어 붙인다.
  const rows =
    comparison.layout === 'grouped'
      ? groupedLines(view).map((l) => ({ key: l.code, label: l.label, cells: l.shares.map((s) => (s === undefined ? '–' : percent(s))) }))
      : series.flatMap(({ q }, i) =>
          displayOptions(q).map((o) => ({ key: `${q.id}:${o.code}`, label: o.label, cells: series.map((_, j) => (i === j ? percent(o.share) : '')) })),
        )
  return (
    <article id={`compare-${comparison.id}`} style={card}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-12)', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Heading level={3} size={5} wordBreak="cjk" style={{ lineHeight: 1.4 }}>
            {comparison.title}
          </Heading>
          <ChartShareButton edition={edition} id={`compare-${comparison.id}`} title={comparison.title} />
        </div>
        <Text size="sm" muted>
          {series.map((s) => `${s.name} ${s.q.answered.toLocaleString()}명`).join(' · ')}이 답했어요.
          {comparison.note && ` ${comparison.note}`}
          {breakdown && ' 집단별로 나누지 않은 전체 응답이에요.'}
        </Text>
      </div>
      <CompareChart view={view} />
      <details style={{ paddingTop: 14, borderTop: '1px solid var(--colors-bg-neutral-hover)' }}>
        <summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>표로 보기</summary>
        <table style={{ marginTop: 'var(--spacing-8)', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              <th scope="col" style={cell}>
                선택지
              </th>
              {series.map((s) => (
                <th key={s.q.id} scope="col" style={cell}>
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <th scope="row" style={{ ...cell, fontWeight: 400 }}>
                  {r.label}
                </th>
                {r.cells.map((c, i) => (
                  <td key={series[i].q.id} style={cell}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </article>
  )
}

const card: React.CSSProperties = {
  // 공유 페이지에서 #<id> 로 들어올 때 위에 붙는 나눠 보기 막대에 가리지 않게
  scrollMarginTop: 88,
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-20)',
  padding: 'clamp(16px, 4vw, 28px)',
  borderRadius: 'var(--radii-lg)',
  border: '1px solid var(--colors-bg-neutral-hover)',
}

const cell: React.CSSProperties = {
  padding: 'var(--spacing-4) var(--spacing-12)',
  borderBottom: '1px solid var(--colors-bg-neutral-hover)',
  textAlign: 'left',
}

// 차트 한 장의 공유 주소(/<회차>/results/<id>)를 복사하거나 OS 공유 창으로 보낸다. 집단별 보기는 담지 않는다.
// 휴대폰에서 버튼이 제목 옆 한 줄에 들어가도록 아이콘만 둔다. 무엇을 하는지는 aria-label 과 title 로 알린다.
function ChartShareButton({ edition, id, title }: { edition: string; id: string; title: string }) {
  const { nativeShare, copied, copy, share } = useShare(`${SITE_URL}/${edition}/results/${id}`, title)
  const label = nativeShare ? '이 차트 공유하기' : copied ? '링크를 복사했어요' : '이 차트 링크 복사하기'
  return (
    <button
      type="button"
      onClick={nativeShare ? share : copy}
      aria-label={`${title}: ${label}`}
      title={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: 36,
        height: 36,
        padding: 0,
        border: '1px solid var(--colors-border-neutral)',
        borderRadius: 'var(--radii-md)',
        background: 'var(--colors-app-bg)',
        color: copied ? 'var(--colors-fg-brand)' : 'var(--colors-fg-neutral)',
        cursor: 'pointer',
      }}
    >
      <Icon name={nativeShare ? 'share2' : copied ? 'check' : 'link'} size="sm" />
    </button>
  )
}
