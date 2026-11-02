import { Link } from '@tanstack/react-router'
import { Heading, Tag, Text } from 'daleui'
import { EDITIONS, isBeta, isClosed } from '@/editions'
import { koDate as day } from '@/lib/date'
import { RESULTS } from '@/results'

// 모든 회차를 최근 것부터. 회차마다 지금 할 수 있는 일(참여, 결과 보기)로 바로 간다.
export function EditionList() {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
      {EDITIONS.map((e) => {
        const result = RESULTS[e.id]
        const open = e.survey && !isClosed(e)
        return (
          <li
            key={e.id}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--spacing-16)',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--spacing-24) 0',
              borderTop: '1px solid var(--colors-bg-neutral-hover)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-8)', alignItems: 'center' }}>
                <Heading level={3} size={5}>
                  <Link to="/$edition" params={{ edition: e.id }} style={{ color: 'inherit' }}>
                    {e.title}
                  </Link>
                </Heading>
                {e.sample && <Tag tone="warning">예시</Tag>}
              </div>
              <Text size="sm" muted>
                {result
                  ? `${result.total.toLocaleString()}명이 답했어요`
                  : open
                    ? e.closesAt ? `${day(e.closesAt)}까지 응답을 받아요` : '응답을 받고 있어요'
                    : e.resultsAt ? `${day(e.resultsAt)}에 결과를 공개해요` : '결과를 준비하고 있어요'}
              </Text>
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-24)' }}>
              {open && (
                <Link to="/$edition/survey" params={{ edition: e.id }} reloadDocument={isBeta(e)}>
                  참여하기
                </Link>
              )}
              {result && (
                <Link to="/$edition/results" params={{ edition: e.id }}>
                  결과 보기
                </Link>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
