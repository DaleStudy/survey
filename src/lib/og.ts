export const SITE_URL = 'https://survey.dalestudy.com'

// 공유 미리보기 이미지. 파일은 scripts/type-images.ts 가 public/types/ 에 만든다.
export function ogImage(slug: string, alt: string) {
  return [
    { property: 'og:image', content: `${SITE_URL}/types/${slug}.jpg` },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: alt },
    { name: 'twitter:card', content: 'summary_large_image' },
  ]
}
