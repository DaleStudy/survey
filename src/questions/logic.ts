import type { Answer, Answers, Question } from './survey'

export const LONG_MAX = 2000

// "기타"를 고르면 직접 적을 수 있다(선택). 답은 <문항 id>_other 키에 따로 둔다.
// 선택지에 없는 새 도구와 언어를 찾아 다음 회차 선택지로 올리려는 것이다.
export const OTHER = 'other'
export const OTHER_MAX = 100
export const otherKey = (id: string) => `${id}_other`

export function picksOther(a: Answer | undefined): boolean {
  return a === OTHER || (Array.isArray(a) && a.includes(OTHER))
}

export function isEmpty(a: Answer | undefined): boolean {
  return a == null || a === '' || (Array.isArray(a) && a.length === 0)
}

export function isVisible(q: Question, answers: Answers): boolean {
  return Object.entries(q.showIf).every(([key, allowed]) => {
    const a = answers[key]
    if (a == null) return false
    return Array.isArray(a) ? a.some((v) => allowed.includes(v)) : allowed.includes(a)
  })
}

export function visibleQuestions(questions: Question[], answers: Answers): Question[] {
  return questions.filter((q) => isVisible(q, answers))
}

// 한 문항의 답이 형식에 맞는지. 비어 있는지는 따로 본다.
export function answerError(q: Question, a: Answer): string | null {
  switch (q.type) {
    case 'single':
      return typeof a === 'string' && q.options.some((o) => o.code === a) ? null : '없는 선택지예요.'
    case 'scale': {
      const n = Number(a)
      return typeof a === 'string' && q.scale && Number.isInteger(n) && n >= q.scale.min.value && n <= q.scale.max.value
        ? null
        : '범위를 벗어난 값이에요.'
    }
    case 'multi': {
      if (!Array.isArray(a) || new Set(a).size !== a.length) return '선택이 올바르지 않아요.'
      if (!a.every((v) => q.options.some((o) => o.code === v))) return '없는 선택지예요.'
      if (q.limit && a.length > q.limit) return `최대 ${q.limit}개까지 고를 수 있어요.`
      return null
    }
    case 'long':
      return typeof a === 'string' && a.length <= LONG_MAX ? null : `${LONG_MAX}자까지 쓸 수 있어요.`
  }
}

// 서버에서 저장하기 전에 부른다. 지금 보이는 문항의 답만 남기고, 빠지거나 잘못된 답이 있으면 거절한다.
export function cleanAnswers(
  questions: Question[],
  answers: Answers,
): { ok: true; answers: Answers } | { ok: false; error: string } {
  const clean: Answers = {}
  for (const q of visibleQuestions(questions, answers)) {
    const a = answers[q.id]
    if (a === undefined || isEmpty(a)) {
      if (q.required) return { ok: false, error: `${q.id}: 필수 문항이에요.` }
      continue
    }
    const error = answerError(q, a)
    if (error) return { ok: false, error: `${q.id}: ${error}` }
    clean[q.id] = typeof a === 'string' && q.type === 'long' ? a.trim() : a
    const other = answers[otherKey(q.id)]
    if (other === undefined || !picksOther(a)) continue
    if (typeof other !== 'string' || other.trim().length > OTHER_MAX)
      return { ok: false, error: `${q.id}: 기타 내용은 ${OTHER_MAX}자까지 쓸 수 있어요.` }
    if (other.trim()) clean[otherKey(q.id)] = other.trim()
  }
  return { ok: true, answers: clean }
}
