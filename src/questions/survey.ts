import raw from './generated/2026.json'

export type QuestionType = 'single' | 'multi' | 'scale' | 'long'
export type Option = { code: string; label: string }
export type ScaleEnd = { value: number; label: string }
export type ShowIf = Record<string, string[]>
export type Answer = string | string[]
export type Answers = Record<string, Answer>

export interface Question {
  id: string
  section: string
  fixed: boolean
  type: QuestionType
  label: string
  help?: string
  required: boolean
  // 복수 선택에서 고를 수 있는 최대 개수. 없으면 제한 없음.
  limit?: number
  options: Option[]
  // 섹션의 show_if 와 문항의 show_if 를 합친 것. 키마다 AND, 값 목록은 OR.
  showIf: ShowIf
  scale?: { min: ScaleEnd; max: ScaleEnd }
}

type RawQuestion = {
  id: string
  fixed: boolean
  type: QuestionType
  label: string
  help?: string
  required?: boolean
  limit?: number
  options?: Option[]
  options_from?: string
  show_if?: ShowIf
  min?: ScaleEnd
  max?: ScaleEnd
}
type RawSection = { id: string; title: string; show_if?: ShowIf; questions: RawQuestion[] }
type RawSurvey = { survey: number; sections: RawSection[] }

export function normalize(survey: RawSurvey): Question[] {
  const flat = survey.sections.flatMap((s) => s.questions.map((q) => ({ q, s })))
  const byId = new Map(flat.map(({ q }) => [q.id, q]))
  return flat.map(({ q, s }) => {
    const options = q.options ?? (q.options_from ? byId.get(q.options_from)?.options : undefined) ?? []
    return {
      id: q.id,
      section: s.title,
      fixed: q.fixed,
      type: q.type,
      label: q.label,
      help: q.help,
      required: q.required ?? true,
      limit: q.limit,
      options,
      showIf: { ...s.show_if, ...q.show_if },
      scale: q.type === 'scale' && q.min && q.max ? { min: q.min, max: q.max } : undefined,
    }
  })
}

export const YEAR = (raw as RawSurvey).survey
export const QUESTIONS = normalize(raw as RawSurvey)
