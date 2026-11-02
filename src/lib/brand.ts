// dalestudy.com 에서 가져온 teal→violet 브랜드 그라데이션(dalestudy.com src/styles/site.css).
// 홈과 회차 페이지의 첫 화면, 강조 글자, 띠에 쓴다.

// 첫 화면 배경. 아래로 갈수록 배경색에 녹아든다. 절대 위치로 깔고 내용은 그 위에 둔다.
export const heroWash: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  background:
    'linear-gradient(180deg, transparent -20%, var(--colors-app-bg) 62%), linear-gradient(90deg, rgba(36, 234, 202, 0.28) 0%, rgba(132, 109, 233, 0.28) 100%)',
}

// 제목 안의 강조 글자. 큰 제목에만 쓴다(시작색 대비가 약 3.3:1).
export const gradientText: React.CSSProperties = {
  background: 'linear-gradient(90deg, #0e9e85, #6d51d6)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
}

export const gradientBanner = 'linear-gradient(135deg, #0e8e7b 0%, #6d51d6 100%)'

// 테두리만 그라데이션. 안쪽은 바탕색으로 채운다.
export const gradientBorder: React.CSSProperties = {
  border: '1px solid transparent',
  background: `linear-gradient(var(--colors-app-bg), var(--colors-app-bg)) padding-box, ${gradientBanner} border-box`,
}

export const heroImage: React.CSSProperties = {
  flex: '1 1 420px',
  minWidth: 0,
  width: '100%',
  height: 'auto',
  borderRadius: 'var(--radii-lg)',
  boxShadow: '0 12px 40px rgba(83, 51, 225, 0.12)',
}
