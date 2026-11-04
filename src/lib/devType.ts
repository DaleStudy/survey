import type { Answers } from '@/questions/survey'

// 완료 화면과 공유 페이지의 개발자 유형. 근거: docs/decisions/0004-developer-type-result.md
// 응답 데이터가 아니라서 문구는 회차마다 바꿔도 된다. 서버에는 저장하지 않는다.
export interface DevType {
  slug: string
  name: string
  description: string
  // 에반의 "내년 개발 커리어 운세". 신년운세처럼 총운(fortune)에 귀인(ally)과 조심할 것(caution)을 붙인다.
  fortune: string
  ally: string
  caution: string
}

export const DEV_TYPES: DevType[] = [
  {
    slug: 'ai-explorer',
    name: 'AI 네이티브 탐험가',
    description: 'AI를 매일 쓰면서, 새로운 걸 배우는 데 가장 큰 가치를 둬요.',
    fortune: '에이전트에게 일을 맡기는 법을 가르치게 될 운이에요.',
    ally: '프롬프트를 같이 다듬어 주는 동료',
    caution: '안 읽고 머지한 AI 코드',
  },
  {
    slug: 'ai-pragmatist',
    name: 'AI 실속파',
    description: 'AI를 매일 쓰지만, 결국 중요한 건 일이 잘 굴러가는 거라고 믿어요.',
    fortune: '아낀 시간만큼 퇴근이 빨라질 운이에요.',
    ally: '자동화할 거리를 물어 오는 동료',
    caution: '월말에 날아오는 AI 구독료',
  },
  {
    slug: 'careful-experimenter',
    name: '신중한 실험가',
    description: 'AI를 가끔 꺼내 써 보며, 어디까지 믿어도 될지 직접 확인하는 중이에요.',
    fortune: '나만의 AI 활용법 하나가 손에 붙을 운이에요.',
    ally: '써 본 도구 후기를 솔직하게 들려주는 동료',
    caution: '써 보기도 전에 쌓이는 북마크',
  },
  {
    slug: 'balanced-realist',
    name: '균형 잡힌 실용주의자',
    description: '새 도구는 필요할 때만 써요. 일과 삶의 균형을 지키며 꾸준히 가요.',
    fortune: '무리하지 않고도 한 단계 올라설 운이에요.',
    ally: '칼퇴를 응원해 주는 팀장님',
    caution: '"이것만 하고 퇴근"이라는 생각',
  },
  {
    slug: 'handcraft-artisan',
    name: '손코딩 장인',
    description: 'AI 없이 직접 부딪히며 실력을 쌓는 걸 즐겨요.',
    fortune: '다져 온 기본기가 남다른 무기가 될 운이에요.',
    ally: '리뷰를 꼼꼼히 해 주는 사수',
    caution: '바퀴를 직접 다시 만들고 싶은 마음',
  },
  {
    slug: 'steady-veteran',
    name: '묵묵한 베테랑',
    description: '유행보다 검증된 방법을 믿고, 맡은 일을 끝까지 해내요.',
    fortune: '그 꾸준함을 알아보는 사람이 늘어날 운이에요.',
    ally: '회고 때 내 이름을 꺼내 주는 동료',
    caution: '금요일 오후 배포',
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
