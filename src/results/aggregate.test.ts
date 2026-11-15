import { describe, expect, test } from 'bun:test'
import { questionsFor } from '@/questions/survey'
import { BREAKDOWNS, MIN_GROUP, aggregate } from './aggregate'

const QUESTIONS = questionsFor('2026')!

const student = { status: 'student', ai_frequency: 'daily', company_criteria: ['growth', 'pay'], job_satisfaction: '4' }
const employed = { status: 'employed', ai_frequency: 'never', company_criteria: ['pay'], job_satisfaction: '2' }
const many = (r: object, n: number) => Array.from({ length: n }, () => ({ ...r }))

describe('aggregate', () => {
  const result = aggregate(QUESTIONS, [...many(student, 40), ...many(employed, 20)], '2025', true)
  const stat = (id: string) => result.questions.find((q) => q.id === id)!

  test('문항마다 보인 사람과 답한 사람을 따로 센다', () => {
    expect(result.total).toBe(60)
    expect(stat('status').answered).toBe(60)
    // 현업에게만 보이는 문항
    expect(stat('job_satisfaction').shown).toBe(20)
  })

  test('선택지 비율은 답한 사람 기준이고, 복수 선택은 합이 1을 넘을 수 있다', () => {
    const ai = stat('ai_frequency').options
    expect(ai.find((o) => o.code === 'daily')?.share).toBeCloseTo(40 / 60)
    const criteria = stat('company_criteria').options
    expect(criteria.reduce((s, o) => s + o.share, 0)).toBeGreaterThan(1)
  })

  test(`답한 사람이 ${MIN_GROUP}명보다 적은 문항은 숨긴다`, () => {
    expect(stat('status').hidden).toBe(false)
    expect(stat('job_satisfaction').hidden).toBe(true)
  })

  test('척도 문항은 평균을 낸다', () => {
    expect(stat('job_satisfaction').mean).toBe(2)
  })

  test(`집단별 결과도 ${MIN_GROUP}명보다 적은 칸은 숨기고 비율을 내보내지 않는다`, () => {
    const status = result.breakdowns.find((b) => b.id === 'status')!
    expect(status.groups.map((g) => g.count)).toEqual([20, 40])
    const ai = status.questions.ai_frequency
    expect(ai.find((g) => g.group === 'employed')).toMatchObject({ answered: 20, hidden: true, shares: {} })
    expect(ai.find((g) => g.group === 'others')?.shares.daily).toBeCloseTo(1)
  })

  test('집단을 나누는 문항 자체는 집단별로 보여 주지 않는다', () => {
    const status = result.breakdowns.find((b) => b.id === 'status')!
    expect(status.questions.status).toBeUndefined()
  })

  test('복수 선택 문항으로 나누면 고른 집단에 모두 들어간다', () => {
    const backend = { status: 'employed', role: ['backend'], ai_frequency: 'daily' }
    const both = { status: 'employed', role: ['backend', 'frontend'], ai_frequency: 'weekly' }
    const data = { status: 'employed', role: ['data_eng', 'ai_ml'], ai_frequency: 'never' }
    const r = aggregate(QUESTIONS, [...many(backend, 30), ...many(both, 10), ...many(data, 30)], '2025', true)
    const role = r.breakdowns.find((b) => b.id === 'role')!
    const count = (code: string) => role.groups.find((g) => g.code === code)?.count
    expect(count('backend')).toBe(40)
    expect(count('frontend')).toBe(10)
    // 한 집단에 묶인 두 직무를 함께 골라도 한 번만 센다
    expect(count('data_ai')).toBe(30)
    expect(role.questions.ai_frequency.find((g) => g.group === 'backend')?.shares.daily).toBeCloseTo(30 / 40)
  })
})

describe('집단 기준', () => {
  for (const spec of BREAKDOWNS) {
    const q = QUESTIONS.find((x) => x.id === spec.by)

    test(`${spec.id}: 집단의 선택지는 문항에 있고 집단끼리 겹치지 않는다`, () => {
      const codes = spec.groups.flatMap((g) => g.codes)
      expect(q?.options.map((o) => o.code)).toEqual(expect.arrayContaining(codes))
      expect(new Set(codes).size).toBe(codes.length)
    })

    // 차트 색 수: 순서가 있는 집단은 밝기 3단계, 없는 집단은 6색 (src/components/ResultChart.tsx)
    test(`${spec.id}: 집단 수가 차트 색 수를 넘지 않는다`, () => {
      expect(spec.groups.length).toBeLessThanOrEqual(spec.ordinal ? 3 : 6)
    })

    if (q?.type === 'multi') {
      test(`${spec.id}: 복수 선택 기준은 한 응답이 여러 집단에 들어간다는 것을 알린다`, () => {
        expect(spec.note).toBeDefined()
      })
    }
  }
})
