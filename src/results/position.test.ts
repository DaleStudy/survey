import { describe, expect, test } from 'bun:test'
import r2025 from './2025.json'
import type { ResultSet } from './aggregate'
import { POSITION, distribution, position, positionChoices } from './position'

const result = r2025 as unknown as ResultSet
const codes = ['lt_20', '20_30', '30_40', 'no_answer']

describe('나와 비교하기', () => {
  test('내 구간보다 낮은, 같은, 높은 구간의 비율을 센다', () => {
    const p = position(codes, { lt_20: 0.2, '20_30': 0.3, '30_40': 0.5 }, '20_30')
    expect(p?.below).toBeCloseTo(0.2)
    expect(p?.same).toBeCloseTo(0.3)
    expect(p?.above).toBeCloseTo(0.5)
  })

  test('답하지 않은 사람은 빼고 다시 100%로 맞춘다', () => {
    const p = position(codes, { lt_20: 0.2, '20_30': 0.2, '30_40': 0.4, no_answer: 0.2 }, 'lt_20')
    expect(p?.below).toBe(0)
    expect(p?.same).toBeCloseTo(0.25)
    expect(p?.above).toBeCloseTo(0.75)
  })

  test('구간에 없는 값이나 답이 없는 집단은 위치를 내지 않는다', () => {
    expect(position(codes, { lt_20: 1 }, 'no_answer')).toBeUndefined()
    expect(position(codes, {}, 'lt_20')).toBeUndefined()
  })

  test('비교할 집단 기준은 모두 집단별 보기에 있고, 연봉 구간에는 답하지 않음이 없다', () => {
    for (const by of POSITION.by) expect(result.breakdowns.map((b) => b.id)).toContain(by)
    expect(positionChoices(result).map((o) => o.code)).not.toContain('no_answer')
  })

  test('숨긴 집단 칸은 분포를 내지 않는다', () => {
    const company = result.breakdowns.find((b) => b.id === 'company_type')!
    for (const g of company.questions[POSITION.question]) {
      expect(distribution(result, 'company_type', g.group) === undefined).toBe(g.hidden)
    }
    // 인원은 구간을 고른 사람만 센다
    const salary = result.questions.find((q) => q.id === POSITION.question)!
    const skipped = salary.options.find((o) => o.code === 'no_answer')!.count
    expect(distribution(result)?.ranked).toBe(salary.answered - skipped)
  })
})
