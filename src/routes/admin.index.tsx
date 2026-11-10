import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { Heading, Text } from 'daleui'
import type { QuestionStat } from '@/results/aggregate'
import { displayOptions } from '@/results/order'

const admin = getRouteApi('/admin')

// 문항마다 선택지별 건수와 비율. 응답이 수백 건이 되어도 한 화면에서 전체 그림을 본다. 데이터는 부모(/admin)가 받는다.
export const Route = createFileRoute('/admin/')({
  component: Overview,
})

function Overview() {
  const { summary } = admin.useLoaderData()
  if (summary.total === 0) return <Text muted>아직 응답이 없어요.</Text>
  const sections = [...new Map(summary.stats.map((q) => [q.sectionId, q.section]))]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-32)' }}>
      {sections.map(([id, title]) => (
        <section key={id} aria-labelledby={`section-${id}`} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
          <Heading level={2} size={5} id={`section-${id}`} style={{ fontSize: '0.9375rem' }}>
            {title}{' '}
            <span style={{ fontWeight: 500, color: 'var(--colors-fg-neutral-placeholder)' }}>· {summary.stats.filter((q) => q.sectionId === id).length}문항</span>
          </Heading>
          {/* min(100%, …) 가 없으면 360px 휴대폰에서 카드가 화면 밖으로 넘친다 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 'var(--spacing-12)' }}>
            {summary.stats
              .filter((q) => q.sectionId === id)
              .map((q) => (
                <Distribution key={q.id} q={q} />
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function Distribution({ q }: { q: QuestionStat }) {
  const options = displayOptions(q)
  const max = Math.max(1, ...options.map((o) => o.count))
  const scaleLabel = (code: string) => (code === '1' ? `1 ${q.scale?.min ?? ''}` : code === '5' ? `5 ${q.scale?.max ?? ''}` : code)
  return (
    <article className="admin-panel" style={{ padding: '18px var(--spacing-20)', gap: 'var(--spacing-12)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
        <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5 }}>{q.label}</h3>
        <Text size="xs" muted>
          {q.answered.toLocaleString()}명 답함
          {q.shown > q.answered && ` · ${(q.shown - q.answered).toLocaleString()}명 건너뜀`}
          {q.type === 'multi' && ' · 복수 선택'}
          {q.mean !== undefined && ` · 평균 ${q.mean.toFixed(1)}`}
        </Text>
      </div>
      {q.type === 'long' ? (
        <Text size="sm" muted>
          서술형이라 원본 응답에서 읽어요.
        </Text>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          {options.map((o) => {
            const label = q.type === 'scale' ? scaleLabel(o.code) : o.label
            return (
              <li key={o.code} style={barRow}>
                <span style={{ overflowWrap: 'anywhere', color: o.count ? undefined : 'var(--colors-fg-neutral-placeholder)' }}>{label}</span>
                <span aria-hidden="true" style={{ height: 8, borderRadius: 'var(--radii-full)', background: 'var(--colors-bg-neutral-hover)', overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: `${(o.count / max) * 100}%`, background: 'var(--colors-bg-solid-brand)' }} />
                </span>
                <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--colors-fg-neutral-active)' }}>{o.count.toLocaleString()}</span>
                <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--colors-fg-neutral-placeholder)' }}>{Math.round(o.share * 100)}%</span>
              </li>
            )
          })}
        </ul>
      )}
    </article>
  )
}

const barRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 12em) minmax(48px, 1fr) 3.5em 3em',
  gap: 'var(--spacing-8)',
  alignItems: 'center',
  fontSize: '0.8125rem',
  lineHeight: 1.5,
}
