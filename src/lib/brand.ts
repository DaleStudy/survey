// dalestudy.com 에서 가져온 teal→violet 브랜드 그라데이션(dalestudy.com src/styles/site.css).
// 로고, 큰 제목의 강조 글자, 마지막 참여 띠에만 쓴다. 여러 곳에 쓰면 강조로 읽히지 않는다.

// 제목 안의 강조 글자. 큰 제목에만 쓴다(시작색 대비가 약 3.3:1).
export const gradientText: React.CSSProperties = {
  background: 'linear-gradient(90deg, #0e9e85, #6d51d6)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
}

export const gradientBanner = 'linear-gradient(135deg, #0e8e7b 0%, #6d51d6 100%)'

// 홈과 회차 페이지 첫 화면의 제목. 휴대폰에서는 줄어든다.
export const heroTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 'clamp(2.25rem, 4vw + 1rem, 3.75rem)',
  lineHeight: 1.18,
  fontWeight: 800,
  letterSpacing: '-0.03em',
  color: 'var(--colors-fg-neutral-active)',
}

// 섹션 제목과 그 위의 머리말("왜 하나요" 같은 짧은 말)
export const sectionTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 'clamp(1.75rem, 2vw + 1rem, 2.5rem)',
  lineHeight: 1.3,
  fontWeight: 800,
  letterSpacing: '-0.025em',
  color: 'var(--colors-fg-neutral-active)',
}
export const eyebrow: React.CSSProperties = { margin: 0, fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--colors-fg-brand)' }

// 첫 화면 일러스트를 옅은 브랜드 면 위의 액자로 감싼다
export const heroFrame: React.CSSProperties = {
  flex: '1 1 420px',
  minWidth: 0,
  margin: 0,
  padding: 'var(--spacing-12)',
  borderRadius: 24,
  background: 'var(--colors-bg-brand)',
  border: '1px solid var(--colors-bg-brand-active)',
}
export const heroImage: React.CSSProperties = { display: 'block', width: '100%', height: 'auto', borderRadius: 'var(--radii-lg)' }

// 주 행동 링크. 버튼처럼 보이지만 페이지를 옮기므로 <a> 다.
export const ctaLink: React.CSSProperties = {
  display: 'inline-flex',
  gap: 'var(--spacing-8)',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 56,
  padding: '0 28px',
  borderRadius: 'var(--radii-md)',
  background: 'var(--colors-bg-solid-brand)',
  color: 'var(--colors-fg-solid-brand)',
  fontSize: '1.125rem',
  fontWeight: 600,
  textDecoration: 'none',
}
