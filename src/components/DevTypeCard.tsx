import { Heading, Icon, Text } from 'daleui'
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
        {/* 운세 쪽지: 양옆에 홈이 파인 티켓 모양 */}
        <div
          style={{
            marginTop: 'var(--spacing-16)',
            padding: 'var(--spacing-20) var(--spacing-24)',
            borderRadius: 'var(--radii-md)',
            background: 'var(--colors-bg-brand)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
              <Icon name="star" size="sm" tone="brand" fill="currentColor" />
              <Text size="sm" weight="semibold" tone="brand">
                2027 개발 운세
              </Text>
            </div>
            <Text size="xs" tone="brand" style={{ letterSpacing: '0.08em', opacity: 0.6 }}>
              No.2027
            </Text>
          </div>
          <Text size="lg" weight="semibold" style={{ lineHeight: 1.5 }}>
            {type.fortune}
          </Text>
          <div
            aria-hidden
            style={{ position: 'relative', height: 16, margin: '0 calc(var(--spacing-24) * -1)' }}
          >
            {/* 절취선은 양옆 홈 사이에만 */}
            <span style={{ position: 'absolute', top: 7, left: 14, right: 14, borderTop: '2px dashed var(--colors-border-brand)' }} />
            {(['left', 'right'] as const).map((side) => (
              <span
                key={side}
                style={{
                  position: 'absolute',
                  top: 0,
                  [side]: -8,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: 'var(--colors-app-bg)',
                }}
              />
            ))}
          </div>
          <dl
            style={{
              margin: 0,
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              columnGap: 'var(--spacing-16)',
              rowGap: 'var(--spacing-8)',
            }}
          >
            {[
              ['귀인', type.ally],
              ['조심', type.caution],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'contents' }}>
                <dt>
                  <Text size="sm" weight="semibold" tone="brand">
                    {k}
                  </Text>
                </dt>
                <dd style={{ margin: 0 }}>
                  <Text size="sm">{v}</Text>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
