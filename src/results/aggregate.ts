import { visibleQuestions } from '@/questions/logic'
import type { Answers, OptionOrder, Question, QuestionType } from '@/questions/survey'

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
export const BREAKDOWNS: { id: string; label: string; by: string; groups: { code: string; label: string; codes: string[] }[] }[] = [
  {
    id: 'experience',
    label: '경력별',
    by: 'experience',
    groups: [
      { code: 'junior', label: '2년 이하', codes: ['none', '0_2'] },
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
]

function isAnswered(a: Answers[string] | undefined): boolean {
  return a !== undefined && a !== '' && !(Array.isArray(a) && a.length === 0)
}

function optionCodes(q: Question): string[] {
  return q.type === 'scale' ? ['1', '2', '3', '4', '5'] : q.options.map((o) => o.code)
}

function breakdown(questions: Question[], responses: Answers[], spec: (typeof BREAKDOWNS)[number]): Breakdown {
  const members = spec.groups.map((g) => responses.filter((r) => g.codes.includes(r[spec.by] as string)))
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
    by: spec.by,
    groups: spec.groups.map((g, i) => ({ code: g.code, label: g.label, count: members[i].length })),
    questions: byQuestion,
  }
}

// 화면은 이 집계만 읽는다. 원본 응답은 공개 페이지로 넘어가지 않는다.
export function aggregate(questions: Question[], responses: Answers[], edition: string, sample: boolean): ResultSet {
  const stats = questions.map((q): QuestionStat => {
    const shownTo = responses.filter((r) => visibleQuestions(questions, r).some((v) => v.id === q.id))
    const answers = shownTo.map((r) => r[q.id]).filter(isAnswered)
    const answered = answers.length
    const optionList =
      q.type === 'scale' && q.scale
        ? ['1', '2', '3', '4', '5'].map((code) => ({ code, label: code }))
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
