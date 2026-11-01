import { describe, expect, test } from 'bun:test'
import { QUESTIONS } from '@/questions/survey'
import { csvCell, toCsv } from './csv'
import { isClosed } from './schedule'

describe('isClosed', () => {
  test('마감 시각이 없으면 열려 있다', () => {
    expect(isClosed(new Date('2030-01-01T00:00:00Z'), null)).toBe(false)
  })

  test('마감 시각부터 닫힌다', () => {
    const closesAt = '2026-12-06T23:59:59+09:00'
    expect(isClosed(new Date('2026-12-06T14:59:58Z'), closesAt)).toBe(false)
    expect(isClosed(new Date('2026-12-06T14:59:59Z'), closesAt)).toBe(true)
  })
})

describe('CSV', () => {
  test('특수 문자가 있는 칸만 따옴표로 감싼다', () => {
    expect(csvCell('plain')).toBe('plain')
    expect(csvCell('a,b')).toBe('"a,b"')
    expect(csvCell('say "hi"')).toBe('"say ""hi"""')
    expect(csvCell('two\nlines')).toBe('"two\nlines"')
  })

  test('문항 id 순서로 열을 만들고 복수 선택은 ; 로 잇는다', () => {
    const csv = toCsv(QUESTIONS, [
      { createdAt: '2026-11-16T00:00:00.000Z', ref: 'geeknews', answers: { status: 'student', role: ['backend', 'frontend'], comment: '좋아요, "또" 해요' } },
    ])
    const [header, row] = csv.trimEnd().split('\r\n')
    expect(header.split(',').slice(0, 4)).toEqual(['created_at', 'ref', 'status', 'experience'])
    expect(header.split(',').length).toBe(2 + QUESTIONS.length)
    expect(row).toContain('geeknews,student,,backend;frontend')
    expect(row.endsWith('"좋아요, ""또"" 해요"')).toBe(true)
  })
})
