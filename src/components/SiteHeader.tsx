import { Link } from '@tanstack/react-router'
import { Icon, Text } from 'daleui'
import { EDITIONS, openEditions } from '@/editions'
import { RESULTS } from '@/results'

// 어느 화면에서든 처음(/)과 결과 아카이브(/results)로 갈 수 있게 한다. 설문 진행 화면에는 두지 않는다.
export function SiteHeader() {
  // 참여하기는 회차 페이지로 보낸다. 설문을 바로 여는 버튼은 회차 페이지에만 둔다.
  const open = openEditions()[0]
  // 예시가 아닌 결과가 생기기 전에는 결과 메뉴가 가리킬 곳이 없다
  const hasResults = EDITIONS.some((e) => !e.sample && RESULTS[e.id])
  return (
    <header style={{ borderBottom: '1px solid var(--colors-bg-neutral-hover)', background: 'var(--colors-app-bg)' }}>
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: 'var(--spacing-16) var(--spacing-20)',
          boxSizing: 'border-box',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link to="/" style={{ display: 'flex', gap: 'var(--spacing-8)', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
          <Icon name="codeXml" tone="brand" />
          <Text size="lg" weight="bold">
            한국 개발자 설문조사
          </Text>
        </Link>
        <nav aria-label="주요 메뉴" style={{ display: 'flex', gap: 'var(--spacing-16)', alignItems: 'center' }}>
          {hasResults && <Link to="/results">결과</Link>}
          {open && (
            <Link to="/$edition" params={{ edition: open.id }}>
              참여하기
            </Link>
          )}
          <a
            href="https://github.com/DaleStudy/survey"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub 저장소"
            style={{ display: 'inline-flex', padding: 'var(--spacing-8)', margin: 'calc(var(--spacing-8) * -1)', color: 'inherit' }}
          >
            <Icon name="GitHub" size="md" />
          </a>
        </nav>
      </div>
    </header>
  )
}
