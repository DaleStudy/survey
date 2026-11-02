import { Link } from '@tanstack/react-router'
import { Link as DaleLink, Text } from 'daleui'

// 주소는 dalestudy.com 하단과 같다(dalestudy.com src/links.ts).
const COLUMNS = [
  {
    title: '채널',
    links: [
      { label: 'Discord', href: 'https://dales.link/discord' },
      { label: 'GitHub', href: 'https://github.com/DaleStudy' },
      { label: 'LinkedIn', href: 'https://linkedin.com/company/dalestudy' },
    ],
  },
  {
    title: '후원',
    links: [
      { label: 'GitHub Sponsors', href: 'https://github.com/sponsors/DaleStudy' },
      { label: 'OpenCollective', href: 'https://opencollective.com/dalestudy' },
    ],
  },
]

const wrap: React.CSSProperties = { maxWidth: 1120, margin: '0 auto', boxSizing: 'border-box' }
const plain: React.CSSProperties = { color: 'inherit', textDecoration: 'none' }

export function SiteFooter() {
  return (
    <footer style={{ borderTop: '1px solid var(--colors-bg-neutral-hover)' }}>
      <div
        style={{
          ...wrap,
          padding: 'var(--spacing-48) 24px var(--spacing-24)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--spacing-32)',
        }}
      >
        <div style={{ gridColumn: 'span 2', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
          <Text weight="bold">한국 개발자 설문조사</Text>
          <Text size="sm" muted style={{ lineHeight: 1.6 }}>
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
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
            <Text size="sm" weight="semibold">
              {col.title}
            </Text>
            {col.links.map((l) => (
              <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" style={{ ...plain, fontSize: 14 }}>
                {l.label}
              </a>
            ))}
          </nav>
        ))}
      </div>
      <div style={{ ...wrap, padding: '0 24px' }}>
        <div
          style={{
            padding: 'var(--spacing-16) 0 var(--spacing-32)',
            borderTop: '1px solid var(--colors-bg-neutral-hover)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--spacing-16)',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text size="xs" muted>
            © 2025-2026 DaleStudy. All rights reserved.
          </Text>
          <Link to="/privacy" style={{ ...plain, fontSize: 13 }}>
            개인정보 처리방침
          </Link>
        </div>
      </div>
    </footer>
  )
}
