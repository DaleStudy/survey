import { OTHER_MAX, answerError, isEmpty, otherKey, picksOther, visibleQuestions } from './logic'
import type { Answers, Question } from './survey'

// 새로고침해도 이어서 답할 수 있게 진행 중인 답을 그 탭의 sessionStorage 에만 둔다.
// 탭을 닫으면 브라우저가 지우고, 서버로는 보내지 않는다(#9).
export interface Progress {
  answers: Answers
  qid: string
}

// 저장해 둔 값을 지금 문항에 맞춰 되살린다. 문항이 바뀌었으면 맞지 않는 답은 버리고,
// 머물던 문항 앞에 빈 필수 문항이 생겼거나 머물던 문항이 보이지 않으면 거기서 다시 잇는다. 되살릴 답이 없으면 null.
export function restoreProgress(questions: Question[], saved: unknown): Progress | null {
  if (!saved || typeof saved !== 'object') return null
  const { answers: raw, qid } = saved as { answers?: unknown; qid?: unknown }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const input = raw as Record<string, unknown>

  const answers: Answers = {}
  for (const q of questions) {
    const a = input[q.id]
    const valid = typeof a === 'string' || (Array.isArray(a) && a.every((v) => typeof v === 'string'))
    if (!valid || isEmpty(a) || answerError(q, a)) continue
    answers[q.id] = a
    const other = input[otherKey(q.id)]
    if (picksOther(a) && typeof other === 'string' && other.length <= OTHER_MAX) answers[otherKey(q.id)] = other
  }
  if (Object.keys(answers).length === 0) return null

  const visible = visibleQuestions(questions, answers)
  const stay = visible.findIndex((q) => q.id === qid)
  // 빈 필수 문항을 건너뛰고 이으면 끝에서 제출이 거절되므로, 그 문항부터 다시 답하게 한다
  const missing = visible.findIndex((q) => q.required && isEmpty(answers[q.id]))
  const at = missing >= 0 && (stay < 0 || missing < stay) ? missing : stay >= 0 ? stay : visible.findIndex((q) => isEmpty(answers[q.id]))
  return { answers, qid: visible[at >= 0 ? at : visible.length - 1].id }
}

// 저장소를 쓸 수 없는 브라우저도 있어서, 실패하면 처음부터 답하게 둔다.
export function loadProgress(key: string, questions: Question[]): Progress | null {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? restoreProgress(questions, JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function saveProgress(key: string, progress: Progress) {
  try {
    sessionStorage.setItem(key, JSON.stringify(progress))
  } catch {
    // 저장하지 못해도 설문은 계속한다
  }
}

export function clearProgress(key: string) {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // 지울 게 없거나 저장소를 쓸 수 없다
  }
}
