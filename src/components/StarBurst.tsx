import { Icon } from 'daleui'
import { useState } from 'react'

// 유형 결과가 처음 나올 때 한 번 터지는 별. 모션 줄이기 설정에서는 숨긴다.
const COUNT = 28
const TONES = ['brand', 'warning', 'info'] as const

export function StarBurst() {
  // 제출한 뒤 브라우저에서만 그려지므로 Math.random 이 하이드레이션과 어긋나지 않는다
  const [stars] = useState(() =>
    Array.from({ length: COUNT }, (_, i) => {
      const angle = (i / COUNT) * Math.PI * 2 + Math.random() * 0.4
      const dist = 140 + Math.random() * 220
      return {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist * 0.7 - 60,
        r: (Math.random() - 0.5) * 540,
        delay: Math.random() * 150,
        tone: TONES[i % TONES.length],
        size: Math.random() < 0.3 ? ('md' as const) : ('sm' as const),
      }
    }),
  )
  return (
    <div
      aria-hidden
      className="star-burst"
      style={{ position: 'fixed', left: '50%', top: '40%', width: 0, height: 0, pointerEvents: 'none', zIndex: 10 }}
    >
      <style>{`
        @keyframes star-burst {
          0% { transform: translate(-50%, -50%) scale(0.3) rotate(0deg); opacity: 1; }
          55% { transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(1) rotate(var(--r)); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y) + 160px)) scale(0.8) rotate(calc(var(--r) * 1.4)); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) { .star-burst { display: none; } }
      `}</style>
      {stars.map((s, i) => (
        <span
          key={i}
          style={
            {
              position: 'absolute',
              left: 0,
              top: 0,
              display: 'inline-flex',
              opacity: 0,
              '--x': `${s.x}px`,
              '--y': `${s.y}px`,
              '--r': `${s.r}deg`,
              animation: `star-burst 1400ms cubic-bezier(0.2, 0.7, 0.3, 1) ${s.delay}ms forwards`,
            } as React.CSSProperties
          }
        >
          <Icon name="star" size={s.size} tone={s.tone} fill="currentColor" />
        </span>
      ))}
    </div>
  )
}
