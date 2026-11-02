import { Link } from '@tanstack/react-router'
import { Link as DaleLink, Text } from 'daleui'

export function SiteFooter() {
  return (
    <footer style={{ borderTop: '1px solid var(--colors-bg-neutral-hover)' }}>
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: 'var(--spacing-32) 24px',
          boxSizing: 'border-box',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
        <Text size="sm" muted>
          개발자 커뮤니티{' '}
          <DaleLink href="https://dalestudy.com/?ref=survey" external size="sm" tone="brand" underline>
            달레 스터디
          </DaleLink>
          가 주관하는 설문조사예요. 한국어 환경에 맞는 디자인 시스템{' '}
          <DaleLink href="https://www.daleui.com/?ref=survey" external size="sm" tone="brand" underline>
            달레 UI
          </DaleLink>
          로 만들었어요.
        </Text>
        <Text size="xs" muted>
          © 2025-2026 DaleStudy. All rights reserved.
        </Text>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-24)' }}>
          <Link to="/privacy">개인정보 처리방침</Link>
        </div>
      </div>
    </footer>
  )
}
