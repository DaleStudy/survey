import { Link, useLocation } from '@tanstack/react-router'
import { Icon, Text } from 'daleui'
import { EDITIONS, openEditions } from '@/editions'
import { RESULTS } from '@/results'
import { Logo } from '@/components/Logo'

// 어느 화면에서든 처음(/)으로 가고, 결과가 생기면 결과 아카이브(/results)로 갈 수 있게 한다. 설문 진행 화면에는 두지 않는다.
export function SiteHeader() {
  // 예시가 아닌 결과가 생기기 전에는 결과 메뉴가 가리킬 곳이 없다
  const hasResults = EDITIONS.some((e) => !e.sample && RESULTS[e.id])
  // 응답을 받는 회차가 있으면 참여 버튼을 둔다. 설문은 회차 페이지에서 열므로 그리로 보내고, 회차 페이지에서는 숨긴다.
  const open = openEditions()[0]
  const { pathname } = useLocation()
  const showJoin = open && pathname !== `/${open.id}`
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
        <Link to="/" style={{ display: 'flex', gap: 'var(--spacing-12)', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
          <Logo />
          {/* 좁은 화면에서는 로고 마크가 달레 스터디를 대신한다 */}
          {/* 참여 버튼이 있으면 소셜 아이콘도 숨긴다. 같은 링크가 하단(SiteFooter)에 있다 */}
          <style>{'@media (max-width: 480px) { .site-name-brand { display: none } .site-social:has(~ .site-join) { display: none !important } }'}</style>
          <Text size="lg" weight="bold">
            <span className="site-name-brand">달레 스터디 </span>개발자 설문조사
          </Text>
        </Link>
        <nav aria-label="주요 메뉴" style={{ display: 'flex', gap: 'var(--spacing-16)', alignItems: 'center' }}>
          {hasResults && <Link to="/results">결과</Link>}
          <a
            href="https://linkedin.com/company/dalestudy"
            target="_blank"
            rel="noopener noreferrer"
            className="site-social"
            aria-label="달레 스터디 링크드인"
            style={{ display: 'inline-flex', padding: 'var(--spacing-8)', margin: 'calc(var(--spacing-8) * -1)', color: 'inherit' }}
          >
            <Icon name="LinkedIn" size="md" />
          </a>
          <a
            href="https://dales.link/discord"
            target="_blank"
            rel="noopener noreferrer"
            className="site-social"
            aria-label="달레 스터디 디스코드"
            style={{ display: 'inline-flex', padding: 'var(--spacing-8)', margin: 'calc(var(--spacing-8) * -1)', color: 'inherit' }}
          >
            <Icon name="Discord" size="md" />
          </a>
          <a
            href="https://github.com/DaleStudy/survey"
            target="_blank"
            rel="noopener noreferrer"
            className="site-social"
            aria-label="GitHub 저장소"
            style={{ display: 'inline-flex', padding: 'var(--spacing-8)', margin: 'calc(var(--spacing-8) * -1)', color: 'inherit' }}
          >
            <Icon name="GitHub" size="md" />
          </a>
          {showJoin && (
            <Link
              to="/$edition"
              params={{ edition: open.id }}
              className="site-join"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: 40,
                marginLeft: 'var(--spacing-8)',
                padding: '0 var(--spacing-16)',
                borderRadius: 'var(--radii-md)',
                background: 'var(--colors-bg-solid-brand)',
                color: 'var(--colors-fg-solid-brand)',
                fontSize: 15,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              참여하기
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
