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

// 선택지가 많고 이름처럼 짧으면(언어, 도구) 여러 열로 놓는다. 문장형 선택지는 좁은 칸에서
// 서너 줄로 꺾이므로 한 줄에 하나씩 둔다. 길이는 문구 표시 폭의 중앙값으로 본다(한글은 2, 나머지는 1).
const GRID_MIN_OPTIONS = 9
const GRID_MAX_MEDIAN_WIDTH = 20

const displayWidth = (s: string) => [...s].reduce((w, c) => w + ((c.codePointAt(0) ?? 0) >= 0x1100 ? 2 : 1), 0)

export function usesGrid(q: Question): boolean {
  if (q.options.length < GRID_MIN_OPTIONS) return false
  const widths = q.options.map((o) => displayWidth(o.label)).sort((a, b) => a - b)
  return widths[Math.floor(widths.length / 2)] <= GRID_MAX_MEDIAN_WIDTH
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

// 응답자가 받게 되는 문항 수의 범위. 분기를 거는 문항의 선택지를 모두 겪어 보고 보이는 문항을 센다.
// 분기에서 같은 결과를 내는 선택지는 하나만 겪는다. 복수 선택 문항은 하나만 고른 것으로 본다.
export function questionCountRange(questions: Question[]): { min: number; max: number } {
  const keys = [...new Set(questions.flatMap((q) => Object.keys(q.showIf)))]
  const choices = keys.map((key) => {
    const options = questions.find((q) => q.id === key)?.options ?? []
    const byEffect = new Map(options.map((o) => [questions.map((q) => q.showIf[key]?.includes(o.code) ?? false).join(), o.code]))
    return [...byEffect.values()]
  })
  let min = Infinity
  let max = 0
  const walk = (i: number, answers: Answers) => {
    if (i < keys.length) {
      for (const code of choices[i]) walk(i + 1, { ...answers, [keys[i]]: code })
      return
    }
    // 보이지 않는 문항의 답은 그 문항에 기대는 분기를 열지 않는다. 분기를 거는 문항이 늘 앞에 있어서 한 번 훑으면 된다.
    const shown: Answers = {}
    let count = 0
    for (const q of questions) {
      if (!isVisible(q, shown)) continue
      count++
      if (q.id in answers) shown[q.id] = answers[q.id]
    }
    min = Math.min(min, count)
    max = Math.max(max, count)
  }
  walk(0, {})
  return { min, max }
}

const isExclusive = (q: Question, code: string) => q.options.some((o) => o.code === code && o.exclusive)

// 복수 선택에서 하나를 누른 결과. exclusive 선택지를 고르면 나머지가 풀리고, 다른 걸 고르면 exclusive 가 풀린다.
// 개수 제한을 넘으면 null.
export function toggleOption(q: Question, picked: string[], code: string): string[] | null {
  if (picked.includes(code)) return picked.filter((c) => c !== code)
  const next = isExclusive(q, code) ? [code] : [...picked.filter((c) => !isExclusive(q, c)), code]
  return q.limit && next.length > q.limit ? null : next
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
      if (a.length > 1 && a.some((v) => isExclusive(q, v))) return '다른 선택지와 함께 고를 수 없는 선택지가 있어요.'
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
