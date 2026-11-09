import { Heading, Icon, Text } from 'daleui'
import type { DevType } from '@/lib/devType'

export function DevTypeCard({ type, label }: { type: DevType; label: string }) {
  return (
    <section
      aria-label="개발자 유형"
      style={{
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        borderRadius: 24,
        border: '1px solid var(--colors-border-brand)',
        background: 'var(--colors-app-bg)',
        boxShadow: '0 24px 48px -24px rgb(83 51 225 / 0.28)',
      }}
    >
      <img
        src={`/types/${type.slug}.jpg`}
        alt=""
        width={1200}
        height={630}
        style={{ display: 'block', width: '100%', height: 'auto' }}
      />
      <div style={{ padding: '28px 32px 32px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
        <Text size="sm" weight="semibold" tone="brand">
          {label}
        </Text>
        <Heading level={2} wordBreak="cjk" style={{ fontSize: 'clamp(2rem, 1.5vw + 1.5rem, 2.5rem)', fontWeight: 800, letterSpacing: '-0.03em' }}>
          {type.name}
        </Heading>
        <Text size="lg" style={{ lineHeight: 1.6 }}>
          {type.description}
        </Text>
        <div
          style={{
            marginTop: 'var(--spacing-12)',
            padding: '20px 22px',
            borderRadius: 14,
            background: 'var(--colors-bg-brand-hover)',
            display: 'flex',
            gap: 14,
            alignItems: 'flex-start',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              display: 'inline-flex',
              flex: 'none',
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              background: 'var(--colors-app-bg)',
            }}
          >
            <Icon name="star" size="sm" tone="brand" />
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <Text size="sm" weight="bold" tone="brand">
              2027년 커리어 한 줄
            </Text>
            <Text size="lg" style={{ lineHeight: 1.6 }}>
              {type.fortune}
            </Text>
          </div>
        </div>
      </div>
    </section>
  )
}
