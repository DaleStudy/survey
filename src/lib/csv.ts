import { OTHER, otherKey } from '@/questions/logic'
import type { Answers, Question } from '@/questions/survey'

export interface ResponseRow {
  createdAt: string
  answers: Answers
}

// RFC 4180: 쉼표, 따옴표, 줄바꿈이 있으면 따옴표로 감싸고 안쪽 따옴표는 두 번 쓴다
export function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}

// 원본 응답의 답 열. 문항 id 순서이고, 기타 선택지가 있는 문항은 바로 뒤에 <id>_other 열(직접 적은 내용)을 둔다.
// CSV 내보내기와 관리자 화면(/admin)이 같은 열을 쓴다.
export function answerColumns(questions: Question[]): string[] {
  return questions.flatMap((q) => (q.options.some((o) => o.code === OTHER) ? [q.id, otherKey(q.id)] : [q.id]))
}

// 값은 선택지 code 이고, 복수 선택은 ; 로 잇는다
export function answerText(answers: Answers, key: string): string {
  const a = answers[key]
  return a === undefined ? '' : Array.isArray(a) ? a.join(';') : a
}

// 원본 응답 내보내기. 열은 created_at, 그다음 답 열.
export function toCsv(questions: Question[], rows: ResponseRow[]): string {
  const columns = answerColumns(questions)
  const header = ['created_at', ...columns]
  const lines = rows.map((row) => [row.createdAt, ...columns.map((key) => answerText(row.answers, key))])
  return [header, ...lines].map((cells) => cells.map(csvCell).join(',')).join('\r\n') + '\r\n'
}
