import { Link } from '@tanstack/react-router'
import { Heading, Tag, Text } from 'daleui'
import { EDITIONS, isClosed } from '@/editions'
import { RESULTS } from '@/results'

const day = (iso: string) => new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' }).format(new Date(iso))

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
                  {e.title}
                </Heading>
                {e.sample && <Tag tone="warning">예시</Tag>}
              </div>
              <Text size="sm" muted>
                {result
                  ? `${result.total.toLocaleString()}명 응답`
                  : open
                    ? `응답 받는 중${e.closesAt ? ` · ${day(e.closesAt)} 마감` : ''}`
                    : `결과 준비 중${e.resultsAt ? ` · ${day(e.resultsAt)} 공개 예정` : ''}`}
              </Text>
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-24)' }}>
              {open && (
                <Link to="/$edition/survey" params={{ edition: e.id }}>
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
