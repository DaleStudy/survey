import { visibleQuestions } from '@/questions/logic'
import type { Answers, Question, QuestionType } from '@/questions/survey'

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
  // 이 문항이 보였던 사람 수와 실제로 답한 사람 수
  shown: number
  answered: number
  hidden: boolean
  options: OptionStat[]
  mean?: number
  scale?: { min: string; max: string }
}

export interface ResultSet {
  edition: string
  // true 면 실제 설문이 아니라 화면을 시험하려고 만든 예시 데이터
  sample: boolean
  total: number
  questions: QuestionStat[]
}

// 화면은 이 집계만 읽는다. 원본 응답은 공개 페이지로 넘어가지 않는다.
export function aggregate(questions: Question[], responses: Answers[], edition: string, sample: boolean): ResultSet {
  const stats = questions.map((q): QuestionStat => {
    const shownTo = responses.filter((r) => visibleQuestions(questions, r).some((v) => v.id === q.id))
    const answers = shownTo.map((r) => r[q.id]).filter((a) => a !== undefined && a !== '' && !(Array.isArray(a) && a.length === 0))
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
      shown: shownTo.length,
      answered,
      hidden: answered < MIN_GROUP,
      options,
      mean,
      scale: q.scale ? { min: q.scale.min.label, max: q.scale.max.label } : undefined,
    }
  })
  return { edition, sample, total: responses.length, questions: stats }
}
