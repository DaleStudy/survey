import { Link } from '@tanstack/react-router'
import { Icon, Text } from 'daleui'
import { openEditions } from '@/editions'

// 어느 화면에서든 처음(/)과 결과 아카이브(/results)로 갈 수 있게 한다. 설문 진행 화면에는 두지 않는다.
export function SiteHeader() {
  const open = openEditions().length > 0
  return (
    <header style={{ borderBottom: '1px solid var(--colors-bg-neutral-hover)', background: 'var(--colors-app-bg)' }}>
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: 'var(--spacing-16) 24px',
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
        <nav aria-label="주요 메뉴" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-24)', alignItems: 'center' }}>
          <Link to="/results">결과</Link>
          {open && <Link to="/survey">참여하기</Link>}
        </nav>
      </div>
    </header>
  )
}
