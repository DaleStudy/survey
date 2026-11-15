import { visibleQuestions } from '@/questions/logic'
import { type Answers, type OptionOrder, type Question, type QuestionType, SCALE_POINTS } from '@/questions/survey'

// 응답자가 이보다 적은 문항은 결과에서 숨긴다 (개인정보 조사의 k 출발점)
export const MIN_GROUP = 30

export interface OptionStat {
  code: string
  label: string
  count: number
  // 이 문항에 답한 사람 가운데 비율 (복수 선택은 합이 1을 넘을 수 있다)
  share: number
}

export interface QuestionStat {
  id: string
  sectionId: string
  section: string
  label: string
  type: QuestionType
  // 결과 화면의 선택지 순서. 없으면(예전 집계) 원래 순서 그대로 보여 준다.
  order?: OptionOrder
  // 이 문항이 보였던 사람 수와 실제로 답한 사람 수
  shown: number
  answered: number
  hidden: boolean
  options: OptionStat[]
  mean?: number
  scale?: { min: string; max: string }
}

// 집단별 보기. 한 번에 한 기준으로만 나눈다(칸이 작아질수록 누군지 짐작하기 쉬워진다).
export interface GroupStat {
  group: string
  answered: number
  hidden: boolean
  // 선택지 code → 그 집단에서 고른 비율
  shares: Record<string, number>
}

export interface Breakdown {
  id: string
  label: string
  // 집단에 순서가 있는지(경력, 빈도처럼). 차트가 한 색의 밝기 단계로 그린다.
  ordinal?: boolean
  // 나누는 방식에서 알아야 할 것. 복수 선택 문항으로 나누면 한 응답이 여러 집단에 들어간다.
  note?: string
  // 집단을 나누는 문항. 이 문항 자체는 집단별로 보여 주지 않는다.
  by: string
  groups: { code: string; label: string; count: number }[]
  // 문항 id → 집단별 결과
  questions: Record<string, GroupStat[]>
}

export interface ResultSet {
  edition: string
  // true 면 실제 설문이 아니라 화면을 시험하려고 만든 예시 데이터
  sample: boolean
  total: number
  questions: QuestionStat[]
  breakdowns: Breakdown[]
}

// 집단 기준. 문항의 선택지 여러 개를 하나의 집단으로 묶는다.
// 집단 수는 차트 색 수를 넘지 않는다: 순서가 있으면 3개, 없으면 6개(src/components/ResultChart.tsx).
export const BREAKDOWNS: {
  id: string
  label: string
  by: string
  ordinal?: boolean
  note?: string
  groups: { code: string; label: string; codes: string[] }[]
}[] = [
  {
    id: 'experience',
    label: '경력별',
    by: 'experience',
    ordinal: true,
    groups: [
      { code: 'junior', label: '2년 이하', codes: ['none', 'lt_1', '1_2'] },
      { code: 'mid', label: '3~9년', codes: ['3_5', '6_9'] },
      { code: 'senior', label: '10년 이상', codes: ['10_14', '15_plus'] },
    ],
  },
  {
    id: 'status',
    label: '현업 여부별',
    by: 'status',
    groups: [
      { code: 'employed', label: '현업', codes: ['employed'] },
      { code: 'others', label: '그 외', codes: ['job_seeking', 'student', 'other_job', 'not_working'] },
    ],
  },
  {
    id: 'role',
    label: '직무별',
    by: 'role',
    note: '직무를 두 개 고른 사람은 두 집단에 모두 들어가요.',
    groups: [
      { code: 'backend', label: '백엔드', codes: ['backend'] },
      { code: 'frontend', label: '프론트엔드', codes: ['frontend'] },
      { code: 'fullstack', label: '풀스택', codes: ['fullstack'] },
      { code: 'mobile', label: '모바일', codes: ['mobile'] },
      { code: 'data_ai', label: '데이터·AI', codes: ['data_eng', 'data_analysis', 'ai_ml'] },
      { code: 'devops', label: 'DevOps·인프라', codes: ['devops'] },
    ],
  },
  {
    id: 'company_type',
    label: '회사 유형별',
    by: 'company_type',
    groups: [
      { code: 'large', label: '대기업·외국계', codes: ['large', 'foreign'] },
      { code: 'mid_small', label: '중견·중소', codes: ['midsize', 'small'] },
      { code: 'startup', label: '스타트업', codes: ['startup'] },
      { code: 'public', label: '공공', codes: ['public'] },
    ],
  },
  {
    id: 'work_type',
    label: '일의 형태별',
    by: 'work_type',
    groups: [
      { code: 'own_service', label: '자사 서비스', codes: ['own_service'] },
      { code: 'client', label: 'SI·SM·솔루션·외주', codes: ['si', 'sm', 'solution', 'agency'] },
      { code: 'inhouse_it', label: '사내 IT', codes: ['inhouse_it'] },
    ],
  },
  {
    id: 'ai_frequency',
    label: 'AI 사용 빈도별',
    by: 'ai_frequency',
    ordinal: true,
    groups: [
      { code: 'daily', label: '매일', codes: ['daily'] },
      { code: 'sometimes', label: '주·월 몇 번', codes: ['weekly', 'monthly'] },
      { code: 'none', label: '안 써요', codes: ['stopped', 'never'] },
    ],
  },
  {
    id: 'study_hours',
    label: '공부 시간별',
    by: 'study_hours',
    ordinal: true,
    groups: [
      { code: 'none', label: '안 해요', codes: ['0'] },
      { code: 'some', label: '주 1~5시간', codes: ['1_2', '3_5'] },
      { code: 'more', label: '주 6시간 이상', codes: ['6_10', 'gt_10'] },
    ],
  },
]

function isAnswered(a: Answers[string] | undefined): boolean {
  return a !== undefined && a !== '' && !(Array.isArray(a) && a.length === 0)
}

function optionCodes(q: Question): string[] {
  return q.type === 'scale' ? SCALE_POINTS : q.options.map((o) => o.code)
}

function breakdown(questions: Question[], responses: Answers[], spec: (typeof BREAKDOWNS)[number]): Breakdown {
  // 복수 선택 문항이면 고른 것 가운데 하나라도 집단에 속하면 그 집단에 넣는다
  const inGroup = (a: Answers[string] | undefined, codes: string[]) => (Array.isArray(a) ? a.some((c) => codes.includes(c)) : a !== undefined && codes.includes(a))
  const members = spec.groups.map((g) => responses.filter((r) => inGroup(r[spec.by], g.codes)))
  const byQuestion: Record<string, GroupStat[]> = {}
  for (const q of questions) {
    if (q.id === spec.by || q.type === 'long') continue
    byQuestion[q.id] = spec.groups.map((g, i) => {
      const answers = members[i].map((r) => r[q.id]).filter(isAnswered)
      const answered = answers.length
      const shares: Record<string, number> = {}
      for (const code of optionCodes(q)) {
        const count = answers.filter((a) => (Array.isArray(a) ? a.includes(code) : a === code)).length
        shares[code] = answered ? count / answered : 0
      }
      const hidden = answered < MIN_GROUP
      return { group: g.code, answered, hidden, shares: hidden ? {} : shares }
    })
  }
  return {
    id: spec.id,
    label: spec.label,
    ordinal: spec.ordinal,
    note: spec.note,
    by: spec.by,
    groups: spec.groups.map((g, i) => ({ code: g.code, label: g.label, count: members[i].length })),
    questions: byQuestion,
  }
}

// 화면은 이 집계만 읽는다. 원본 응답은 공개 페이지로 넘어가지 않는다.
export function aggregate(questions: Question[], responses: Answers[], edition: string, sample: boolean): ResultSet {
  const visible = responses.map((r) => new Set(visibleQuestions(questions, r).map((v) => v.id)))
  const stats = questions.map((q): QuestionStat => {
    const shownTo = responses.filter((_, i) => visible[i].has(q.id))
    const answers = shownTo.map((r) => r[q.id]).filter(isAnswered)
    const answered = answers.length
    const optionList =
      q.type === 'scale' && q.scale
        ? SCALE_POINTS.map((code) => ({ code, label: code }))
        : q.type === 'long'
          ? []
          : q.options
    const options = optionList.map((o) => {
      const count = answers.filter((a) => (Array.isArray(a) ? a.includes(o.code) : a === o.code)).length
      return { code: o.code, label: o.label, count, share: answered ? count / answered : 0 }
    })
    const mean = q.type === 'scale' && answered ? answers.reduce((sum, a) => sum + Number(a), 0) / answered : undefined
    return {
      id: q.id,
      sectionId: q.sectionId,
      section: q.section,
      label: q.label,
      type: q.type,
      order: q.order,
      shown: shownTo.length,
      answered,
      hidden: answered < MIN_GROUP,
      options,
      mean,
      scale: q.scale ? { min: q.scale.min.label, max: q.scale.max.label } : undefined,
    }
  })
  return {
    edition,
    sample,
    total: responses.length,
    questions: stats,
    breakdowns: BREAKDOWNS.map((spec) => breakdown(questions, responses, spec)),
  }
}
