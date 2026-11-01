import { Heading, Tag, Text } from 'daleui'
import type { DevType } from '@/lib/devType'

export function DevTypeCard({ type, label }: { type: DevType; label: string }) {
  return (
    <section
      aria-label="개발자 유형"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-12)',
        alignItems: 'flex-start',
        padding: 'var(--spacing-32)',
        borderRadius: 'var(--radii-lg)',
        background: 'var(--colors-app-bg)',
        border: '1px solid var(--colors-border-brand)',
        maxWidth: 560,
        boxSizing: 'border-box',
      }}
    >
      <img
        src={`/types/${type.slug}.jpg`}
        alt=""
        width={1200}
        height={630}
        style={{ width: '100%', height: 'auto', borderRadius: 'var(--radii-md)' }}
      />
      <Text size="sm" weight="semibold" tone="brand">
        {label}
      </Text>
      <Heading level={2} size={2}>
        {type.name}
      </Heading>
      <Text size="lg" style={{ lineHeight: 1.6 }}>
        {type.description}
      </Text>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', paddingTop: 'var(--spacing-8)' }}>
        <Tag tone="brand">2027년 커리어 한 줄</Tag>
        <Text style={{ lineHeight: 1.6 }}>{type.fortune}</Text>
      </div>
    </section>
  )
}
