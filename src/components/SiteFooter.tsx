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
        <Text size="sm" muted style={{ wordBreak: 'keep-all' }}>
          개발자 커뮤니티{' '}
          <DaleLink href="https://dalestudy.com/?ref=survey" external size="sm" tone="brand" underline>
            달레 스터디
          </DaleLink>
          가 운영하는 설문이에요 · 한국어 환경에 맞는 디자인 시스템{' '}
          <DaleLink href="https://www.daleui.com/?ref=survey" external size="sm" tone="brand" underline>
            달레 UI
          </DaleLink>
          로 만들었어요
        </Text>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-24)' }}>
          <Link to="/privacy">개인정보 처리방침</Link>
          <a href="https://github.com/DaleStudy/survey" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}
