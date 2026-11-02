import { Heading, Text } from 'daleui'
import type { DevType } from '@/lib/devType'

export function DevTypeCard({ type, label }: { type: DevType; label: string }) {
  return (
    <section
      aria-label="개발자 유형"
      style={{
        width: '100%',
        maxWidth: 560,
        boxSizing: 'border-box',
        overflow: 'hidden',
        borderRadius: 'var(--radii-lg)',
        border: '1px solid var(--colors-border-brand)',
        background: 'var(--colors-app-bg)',
      }}
    >
      <img
        src={`/types/${type.slug}.jpg`}
        alt=""
        width={1200}
        height={630}
        style={{ display: 'block', width: '100%', height: 'auto' }}
      />
      <div style={{ padding: 'var(--spacing-24) var(--spacing-24) var(--spacing-32)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
        <Text size="sm" weight="semibold" tone="brand">
          {label}
        </Text>
        <Heading level={2} size={2}>
          {type.name}
        </Heading>
        <Text size="lg" style={{ lineHeight: 1.6 }}>
          {type.description}
        </Text>
        <div
          style={{
            marginTop: 'var(--spacing-16)',
            padding: 'var(--spacing-16) var(--spacing-20)',
            borderRadius: 'var(--radii-md)',
            background: 'var(--colors-bg-brand)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-4)',
          }}
        >
          <Text size="sm" weight="semibold" tone="brand">
            2027년 커리어 한 줄
          </Text>
          <Text style={{ lineHeight: 1.5 }}>{type.fortune}</Text>
        </div>
      </div>
    </section>
  )
}
