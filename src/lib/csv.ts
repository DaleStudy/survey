import { OTHER, otherKey } from '@/questions/logic'
import type { Answers, Question } from '@/questions/survey'

export interface ResponseRow {
  createdAt: string
  ref: string | null
  answers: Answers
}

// RFC 4180: 쉼표, 따옴표, 줄바꿈이 있으면 따옴표로 감싸고 안쪽 따옴표는 두 번 쓴다
export function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}

// 원본 응답 내보내기. 열은 created_at, ref, 그다음 문항 id 순서. 값은 선택지 code 이고, 복수 선택은 ; 로 잇는다.
// 기타 선택지가 있는 문항은 바로 뒤에 <id>_other 열(직접 적은 내용)을 둔다.
export function toCsv(questions: Question[], rows: ResponseRow[]): string {
  const columns = questions.flatMap((q) => (q.options.some((o) => o.code === OTHER) ? [q.id, otherKey(q.id)] : [q.id]))
  const header = ['created_at', 'ref', ...columns]
  const lines = rows.map((row) => [
    row.createdAt,
    row.ref ?? '',
    ...columns.map((key) => {
      const a = row.answers[key]
      return a === undefined ? '' : Array.isArray(a) ? a.join(';') : a
    }),
  ])
  return [header, ...lines].map((cells) => cells.map(csvCell).join(',')).join('\r\n') + '\r\n'
}
