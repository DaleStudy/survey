export const SITE_URL = 'https://survey.dalestudy.com'

// 공유 미리보기 이미지. path 는 public/ 아래 경로다.
// 유형 공유 페이지는 scripts/og-images.ts 가 만든 public/og/, 나머지는 scripts/type-images.ts 가 만든 public/types/ 를 쓴다.
export function ogImage(path: string, alt: string) {
  return [
    { property: 'og:image', content: `${SITE_URL}${path}` },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: alt },
    { name: 'twitter:card', content: 'summary_large_image' },
  ]
}
