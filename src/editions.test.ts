import { describe, expect, test } from 'bun:test'
import { EDITIONS, type Edition, isBeta, isClosed, openEditions } from './editions'
import { QUESTION_EDITIONS, questionsFor } from './questions/survey'

const edition = (closesAt?: string): Edition => ({ id: 'x', title: 'x', survey: true, devTypes: false, closesAt })

describe('회차', () => {
  test('마감 시각이 없으면 열려 있고, 마감 시각부터 닫힌다', () => {
    expect(isClosed(edition(), new Date('2030-01-01T00:00:00Z'))).toBe(false)
    const e = edition('2026-12-06T23:59:59+09:00')
    expect(isClosed(e, new Date('2026-12-06T14:59:58Z'))).toBe(false)
    expect(isClosed(e, new Date('2026-12-06T14:59:59Z'))).toBe(true)
  })

  test('응답을 받는 회차는 문항 파일이 있다', () => {
    for (const e of EDITIONS.filter((e) => e.survey)) expect(questionsFor(e.id)).toBeDefined()
  })

  test('회차 ID 는 주소에 쓸 수 있는 모양이다', () => {
    for (const e of EDITIONS) expect(e.id).toMatch(/^\d{4}(-[a-z0-9]+)?$/)
    expect(new Set(EDITIONS.map((e) => e.id)).size).toBe(EDITIONS.length)
  })

  test('시작일 전까지만 베타다', () => {
    const e = { ...edition(), opensAt: '2026-11-16' }
    expect(isBeta(e, new Date('2026-11-15T23:59:59+09:00'))).toBe(true)
    expect(isBeta(e, new Date('2026-11-16T00:00:00+09:00'))).toBe(false)
    expect(isBeta(edition(), new Date('2026-11-01T00:00:00+09:00'))).toBe(false)
  })

  test('마감이 지나면 열린 회차에서 빠진다', () => {
    expect(openEditions(new Date('2026-11-20T00:00:00+09:00')).map((e) => e.id)).toContain('2026')
    expect(openEditions(new Date('2026-12-07T00:00:00+09:00')).map((e) => e.id)).not.toContain('2026')
  })
})

// 회차끼리 결과를 비교할 수 있게 한다 (ADR 0005)
describe('회차 간 문항 일관성', () => {
  const all = QUESTION_EDITIONS.flatMap((id) => questionsFor(id)!.map((q) => ({ edition: id, q })))

  test('같은 문항 id 는 모든 회차에서 유형이 같다', () => {
    for (const { q } of all) {
      for (const other of all.filter((o) => o.q.id === q.id)) expect(other.q.type).toBe(q.type)
    }
  })

  test('한 문항 안에서 선택지 code 는 겹치지 않는다', () => {
    // code 의 뜻이 바뀌었는지는 자동으로 알 수 없다. 뜻을 바꾸려면 새 code 를 쓴다 (questions/*.yaml 머리말).
    for (const { q } of all) {
      const codes = q.options.map((o) => o.code)
      expect(new Set(codes).size).toBe(codes.length)
    }
  })
})
