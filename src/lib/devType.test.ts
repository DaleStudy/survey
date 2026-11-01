import { describe, expect, test } from 'bun:test'
import { QUESTIONS } from '@/questions/survey'
import { DEV_TYPES, devTypeOf, findDevType } from './devType'

describe('devTypeOf', () => {
  test('AI 사용 빈도와 성장 추구로 여섯 유형이 모두 나온다', () => {
    const slugs = new Set(
      ['daily', 'weekly', 'monthly', 'stopped', 'never'].flatMap((ai) =>
        [['growth'], ['pay']].map((criteria) => devTypeOf({ ai_frequency: ai, company_criteria: criteria }).slug),
      ),
    )
    expect(slugs).toEqual(new Set(DEV_TYPES.map((t) => t.slug)))
  })

  test('가끔 쓰거나 써 봤지만 안 쓰면 같은 줄로 본다', () => {
    expect(devTypeOf({ ai_frequency: 'weekly', company_criteria: ['growth'] }).slug).toBe('careful-experimenter')
    expect(devTypeOf({ ai_frequency: 'stopped', company_criteria: ['stability'] }).slug).toBe('balanced-realist')
  })

  test('판정에 쓰는 문항과 선택지 code 가 문항 원본에 있다', () => {
    const ai = QUESTIONS.find((q) => q.id === 'ai_frequency')
    const criteria = QUESTIONS.find((q) => q.id === 'company_criteria')
    expect(ai?.options.map((o) => o.code)).toEqual(['daily', 'weekly', 'monthly', 'stopped', 'never'])
    expect(criteria?.options.some((o) => o.code === 'growth')).toBe(true)
    expect(ai?.required && criteria?.required).toBe(true)
  })

  test('slug 로 다시 찾을 수 있다', () => {
    for (const t of DEV_TYPES) expect(findDevType(t.slug)).toBe(t)
    expect(findDevType('nope')).toBeUndefined()
  })
})
