import { describe, expect, test } from 'bun:test'
import { questionsFor } from '@/questions/survey'
import { csvCell, toCsv } from './csv'

const QUESTIONS = questionsFor('2026')!

describe('CSV', () => {
  test('특수 문자가 있는 칸만 따옴표로 감싼다', () => {
    expect(csvCell('plain')).toBe('plain')
    expect(csvCell('a,b')).toBe('"a,b"')
    expect(csvCell('say "hi"')).toBe('"say ""hi"""')
    expect(csvCell('two\nlines')).toBe('"two\nlines"')
  })

  test('문항 id 순서로 열을 만들고 복수 선택은 ; 로 잇는다', () => {
    const csv = toCsv(QUESTIONS, [
      {
        createdAt: '2026-11-16T00:00:00.000Z',
        ref: 'geeknews',
        answers: { status: 'student', role: ['backend', 'other'], role_other: '게임 서버', comment: '좋아요, "또" 해요' },
      },
    ])
    const [header, row] = csv.trimEnd().split('\r\n')
    const columns = header.split(',')
    expect(columns.slice(0, 4)).toEqual(['created_at', 'ref', 'status', 'experience'])
    expect(columns[columns.indexOf('role') + 1]).toBe('role_other')
    expect(columns.length).toBe(2 + QUESTIONS.length + QUESTIONS.filter((q) => q.options.some((o) => o.code === 'other')).length)
    expect(row).toContain('geeknews,student,,backend;other,게임 서버')
    expect(row.endsWith('"좋아요, ""또"" 해요"')).toBe(true)
  })
})
