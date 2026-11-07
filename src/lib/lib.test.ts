import { describe, expect, test } from 'bun:test'
import { questionsFor } from '@/questions/survey'
import { csvCell, toCsv } from './csv'
import { koDate } from './date'

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
        answers: { status: 'student', role: ['backend', 'other'], role_other: '게임 서버', comment: '좋아요, "또" 해요' },
      },
    ])
    const [header, row] = csv.trimEnd().split('\r\n')
    const columns = header.split(',')
    expect(columns.slice(0, 3)).toEqual(['created_at', 'status', 'experience'])
    expect(columns[columns.indexOf('role') + 1]).toBe('role_other')
    expect(columns.length).toBe(1 + QUESTIONS.length + QUESTIONS.filter((q) => q.options.some((o) => o.code === 'other')).length)
    expect(row).toContain('Z,student,,backend;other,게임 서버')
    expect(row.endsWith('"좋아요, ""또"" 해요"')).toBe(true)
  })
})

describe('날짜', () => {
  test('날짜만 적은 값은 한국 날짜로 읽는다', () => {
    expect(koDate('2026-12-21')).toBe('12월 21일')
    expect(koDate('2027-12-31', true)).toBe('2027년 12월 31일')
  })

  test('시각이 있으면 한국 시간으로 바꿔 날짜를 고른다', () => {
    expect(koDate('2026-12-06T23:59:59+09:00')).toBe('12월 6일')
    expect(koDate('2026-12-06T15:00:00Z')).toBe('12월 7일')
  })
})
