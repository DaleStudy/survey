import type { Answers } from '@/questions/survey'

// 완료 화면과 공유 페이지의 개발자 유형. 근거: docs/decisions/0004-developer-type-result.md
// 응답 데이터가 아니라서 문구는 회차마다 바꿔도 된다. 서버에는 저장하지 않는다.
export interface DevType {
  slug: string
  name: string
  description: string
  // 에반의 "내년 개발 커리어 운세"
  fortune: string
}

export const DEV_TYPES: DevType[] = [
  {
    slug: 'ai-explorer',
    name: 'AI 네이티브 탐험가',
    description: 'AI를 매일 쓰면서, 새로운 걸 배우는 데 가장 큰 가치를 둬요.',
    fortune: '내년엔 에이전트에게 일을 맡기는 법을 가르치고 있을지도 몰라요.',
  },
  {
    slug: 'ai-pragmatist',
    name: 'AI 실속파',
    description: 'AI를 매일 쓰지만, 결국 중요한 건 일이 잘 굴러가는 거라고 믿어요.',
    fortune: '내년엔 아낀 시간만큼 퇴근이 조금 빨라질 거예요.',
  },
  {
    slug: 'careful-experimenter',
    name: '신중한 실험가',
    description: 'AI를 가끔 꺼내 써 보며, 어디까지 믿어도 될지 직접 확인하는 중이에요.',
    fortune: '내년엔 나만의 AI 활용법 하나가 손에 붙을 거예요.',
  },
  {
    slug: 'balanced-realist',
    name: '균형 잡힌 실용주의자',
    description: '새 도구는 필요할 때만 써요. 일과 삶의 균형을 지키며 꾸준히 가요.',
    fortune: '내년엔 무리하지 않고도 한 단계 올라서 있을 거예요.',
  },
  {
    slug: 'handcraft-artisan',
    name: '손코딩 장인',
    description: 'AI 없이 직접 부딪히며 실력을 쌓는 걸 즐겨요.',
    fortune: '내년엔 그 기본기가 남들과 다른 무기가 될 거예요.',
  },
  {
    slug: 'steady-veteran',
    name: '묵묵한 베테랑',
    description: '유행보다 검증된 방법을 믿고, 맡은 일을 끝까지 해내요.',
    fortune: '내년엔 그 꾸준함을 알아보는 사람이 늘어날 거예요.',
  },
]

export function findDevType(slug: string): DevType | undefined {
  return DEV_TYPES.find((t) => t.slug === slug)
}

// ai_frequency 와 company_criteria 는 모든 응답자가 답하는 필수 고정 문항이다
export function devTypeOf(answers: Answers): DevType {
  const ai = answers.ai_frequency
  const growth = Array.isArray(answers.company_criteria) && answers.company_criteria.includes('growth')
  const slug =
    ai === 'daily'
      ? growth ? 'ai-explorer' : 'ai-pragmatist'
      : ai === 'never'
        ? growth ? 'handcraft-artisan' : 'steady-veteran'
        : growth ? 'careful-experimenter' : 'balanced-realist'
  return findDevType(slug) as DevType
}
