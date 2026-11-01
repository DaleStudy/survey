import { describe, expect, test } from 'bun:test'
import { cleanAnswers, visibleQuestions } from './logic'
import { QUESTIONS } from './survey'

const ids = (answers: Record<string, string | string[]>) => visibleQuestions(QUESTIONS, answers).map((q) => q.id)

// 현업 개발자가 필수 문항에 모두 답한 경우
const employed = {
  status: 'employed',
  experience: '3_5',
  role: ['backend'],
  region: 'seoul',
  employment_type: 'permanent',
  company_type: 'startup',
  company_size: '10_49',
  work_mode: 'hybrid',
  weekly_hours: '41_45',
  job_satisfaction: '4',
  job_search: 'browsed',
  coding_test: '0',
  company_criteria: ['pay', 'growth'],
  next_workplace: 'stay',
  career_concern: ['ai'],
  main_language: 'typescript',
  want_language: ['rust'],
  cloud: ['aws'],
  ai_frequency: 'daily',
  ai_tools: ['claude_code'],
  ai_policy: 'provided',
  ai_productivity: '4',
  ai_outlook: 'major',
}

describe('문항 원본', () => {
  test('29문항, 고정 19개', () => {
    expect(QUESTIONS.length).toBe(29)
    expect(QUESTIONS.filter((q) => q.fixed).length).toBe(19)
  })

  test('선택형 문항은 모두 선택지가 있고, options_from 도 풀린다', () => {
    for (const q of QUESTIONS.filter((q) => q.type === 'single' || q.type === 'multi')) {
      expect(q.options.length).toBeGreaterThan(0)
    }
    expect(QUESTIONS.find((q) => q.id === 'want_language')?.options.length).toBe(13)
  })

  test('show_if 가 가리키는 문항과 선택지 code 가 모두 있다', () => {
    for (const q of QUESTIONS) {
      for (const [key, codes] of Object.entries(q.showIf)) {
        const target = QUESTIONS.find((t) => t.id === key)
        expect(target).toBeDefined()
        for (const code of codes) expect(target?.options.some((o) => o.code === code)).toBe(true)
      }
    }
  })
})

describe('분기', () => {
  test('학생에게는 일하는 곳과 보상 문항이 나오지 않는다', () => {
    const visible = ids({ status: 'student' })
    expect(visible).not.toContain('employment_type')
    expect(visible).not.toContain('salary')
    expect(visible).not.toContain('cloud')
    expect(visible).toContain('job_search')
  })

  test('회사 직원 수는 회사에 속한 경우에만 묻는다', () => {
    expect(ids({ status: 'employed', company_type: 'startup' })).toContain('company_size')
    expect(ids({ status: 'employed', company_type: 'none' })).not.toContain('company_size')
  })

  test('코딩 테스트 부담은 본 사람에게만 묻는다', () => {
    expect(ids({ coding_test: '0' })).not.toContain('coding_test_burden')
    expect(ids({ coding_test: '1_2' })).toContain('coding_test_burden')
  })
})

describe('응답 검증', () => {
  test('현업 개발자의 응답을 받는다', () => {
    expect(cleanAnswers(QUESTIONS, employed).ok).toBe(true)
  })

  test('숨겨진 문항의 답은 버린다', () => {
    const result = cleanAnswers(QUESTIONS, { ...employed, company_type: 'none', company_size: '10_49', contract_position: 'prime' })
    expect(result.ok && result.answers.company_size).toBeUndefined()
    expect(result.ok && result.answers.contract_position).toBe('prime')
  })

  test('필수 문항이 빠지면 거절한다', () => {
    const { experience: _, ...rest } = employed
    expect(cleanAnswers(QUESTIONS, rest)).toEqual({ ok: false, error: 'experience: 필수 문항이에요.' })
  })

  test('없는 선택지와 개수 초과를 거절한다', () => {
    expect(cleanAnswers(QUESTIONS, { ...employed, region: 'mars' }).ok).toBe(false)
    expect(cleanAnswers(QUESTIONS, { ...employed, role: ['backend', 'frontend', 'devops'] }).ok).toBe(false)
    expect(cleanAnswers(QUESTIONS, { ...employed, job_satisfaction: '6' }).ok).toBe(false)
  })
})
