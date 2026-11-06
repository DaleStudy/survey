import type { Icon } from 'daleui'

type IconName = React.ComponentProps<typeof Icon>['name']

// 회차 문항 파일의 섹션 id → 아이콘. 랜딩 주제, 설문 섹션 태그, 결과 섹션 제목이 함께 쓴다.
const SECTION_ICONS: Record<string, IconName> = {
  about: 'user',
  workplace: 'building2',
  compensation: 'wallet',
  career: 'trendingUp',
  tech: 'codeXml',
  ai: 'sparkles',
  closing: 'messageCircle',
}

export function sectionIcon(sectionId: string): IconName {
  return SECTION_ICONS[sectionId] ?? 'puzzle'
}
