import { Link } from '@tanstack/react-router'
import { Tag, Text } from 'daleui'
import { EDITIONS, isClosed } from '@/editions'
import { koDate as day } from '@/lib/date'
import { RESULTS } from '@/results'

const action: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 44,
  padding: '0 var(--spacing-16)',
  borderRadius: 'var(--radii-md)',
  border: '1px solid var(--colors-border-neutral-active)',
  color: 'var(--colors-fg-neutral)',
  fontWeight: 600,
  textDecoration: 'none',
}
const primary: React.CSSProperties = { ...action, border: 0, background: 'var(--colors-bg-solid-brand)', color: 'var(--colors-fg-solid-brand)' }

// 모든 회차를 최근 것부터. 회차마다 지금 할 수 있는 일(참여, 결과 보기)로 간다. 설문은 회차 페이지에서 연다.
export function EditionList() {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
      {EDITIONS.map((e) => {
        const result = RESULTS[e.id]
        const open = e.survey && !isClosed(e)
        const note = result
          ? `${result.total.toLocaleString()}명이 답했어요`
          : open
            ? e.opensAt && e.closesAt
              ? `${day(e.opensAt)} – ${day(e.closesAt)}`
              : '응답을 받고 있어요'
            : e.resultsAt
              ? `${day(e.resultsAt)}에 결과를 공개해요`
              : '결과를 준비하고 있어요'
        return (
          <li
            key={e.id}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--spacing-16) var(--spacing-24)',
              alignItems: 'center',
              padding: 'var(--spacing-24) 28px',
              borderRadius: 'var(--radii-lg)',
              border: `1px solid ${open ? 'var(--colors-border-brand)' : 'var(--colors-bg-neutral-hover)'}`,
            }}
          >
            <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-8)', alignItems: 'center' }}>
                {open && <Tag tone="success">응답 받는 중</Tag>}
                {e.sample && <Tag tone="warning">예시</Tag>}
                <Text size="sm" muted>
                  {note}
                </Text>
              </div>
              <Link
                to="/$edition"
                params={{ edition: e.id }}
                style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--colors-fg-neutral-active)', textDecoration: 'none' }}
              >
                {e.title}
              </Link>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-8)' }}>
              {(result || (e.survey && e.resultsAt)) && (
                <Link to="/$edition/results" params={{ edition: e.id }} style={action}>
                  {result ? '결과 보기' : '결과 안내'}
                </Link>
              )}
              {open && (
                <Link to="/$edition" params={{ edition: e.id }} style={primary}>
                  참여하기
                </Link>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
