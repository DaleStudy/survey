import { Tag, Text } from 'daleui'
import { DEV_TYPES } from '@/lib/devType'

// 여섯 유형을 나란히 보여 준다. 다른 유형과 견줘 볼 수 있어야 "너는 어떤 유형?" 하고 물을 거리가 생긴다.
// current 를 주면 그 유형에 currentLabel 을 붙여 강조한다. 여섯이 고르게 나뉘도록 세 열을 넘기지 않는다.
// 유형 공유 페이지로 잇지 않는다 — 그 페이지는 들어온 사람에게 "친구의 유형"으로 보여 준다.
export function DevTypeGrid({ current, currentLabel }: { current?: string; currentLabel?: string }) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(max(140px, calc((100% - 2 * var(--spacing-16)) / 3)), 1fr))', gap: 'var(--spacing-16)' }}>
      {DEV_TYPES.map((t) => {
        const mine = t.slug === current
        return (
          <li
            key={t.slug}
            style={{
              overflow: 'hidden',
              borderRadius: 'var(--radii-md)',
              background: 'var(--colors-app-bg)',
              border: mine ? '2px solid var(--colors-border-brand)' : '1px solid var(--colors-bg-neutral-hover)',
            }}
          >
            <img src={`/types/${t.slug}.jpg`} alt="" width={1200} height={630} loading="lazy" style={{ display: 'block', width: '100%', height: 'auto' }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-8)', alignItems: 'center', padding: 'var(--spacing-12) var(--spacing-16)' }}>
              <Text weight="semibold">{t.name}</Text>
              {mine && currentLabel && <Tag tone="brand">{currentLabel}</Tag>}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
