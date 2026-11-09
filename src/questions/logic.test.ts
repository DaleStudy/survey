import { describe, expect, test } from 'bun:test'
import { cleanAnswers, visibleQuestions } from './logic'
import { questionsFor } from './survey'

const QUESTIONS = questionsFor('2026')!

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
  job_good: ['culture'],
  job_pain: ['pay'],
  job_search: 'browsed',
  first_job_route: 'open_recruit',
  company_criteria: ['pay', 'growth'],
  next_workplace: 'stay',
  career_concern: ['ai'],
  study_hours: '1_2',
  growth_activities: ['reading', 'writing'],
  learning_sources: ['official_docs', 'ai'],
  main_language: 'typescript',
  want_language: ['rust'],
  backend_framework: 'spring',
  ai_frequency: 'daily',
  ai_code_share: '25_50',
  ai_model: 'claude',
  ai_harness: ['claude_code'],
  ai_policy: 'provided',
  ai_productivity: '4',
  ai_upsides: ['speed'],
  ai_downsides: ['review'],
  ai_outlook: 'major',
}

describe('문항 원본', () => {
  test('45문항, 고정 32개', () => {
    expect(QUESTIONS.length).toBe(45)
    expect(QUESTIONS.filter((q) => q.fixed).length).toBe(32)
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
    expect(visible).not.toContain('ai_policy')
    expect(visible).toContain('job_search')
  })

  test('구직 문항은 일자리를 찾는 사람에게만 묻는다', () => {
    expect(ids({ status: 'job_seeking' })).toContain('applications')
    expect(ids({ status: 'employed' })).not.toContain('applications')
  })

  test('회사 직원 수는 회사에 속한 경우에만 묻는다', () => {
    expect(ids({ status: 'employed', company_type: 'startup' })).toContain('company_size')
    expect(ids({ status: 'employed', company_type: 'none' })).not.toContain('company_size')
  })

  test('총보상은 근로소득을 받는 사람에게만 묻는다', () => {
    expect(ids({ status: 'employed', employment_type: 'permanent' })).toContain('total_comp')
    expect(ids({ status: 'employed', employment_type: 'freelance' })).not.toContain('total_comp')
  })

  test('프레임워크는 고른 직무에 맞는 것만 묻는다', () => {
    expect(ids({ role: ['backend'] })).toContain('backend_framework')
    expect(ids({ role: ['backend'] })).not.toContain('frontend_framework')
    expect(ids({ role: ['fullstack'] })).toEqual(expect.arrayContaining(['backend_framework', 'frontend_framework']))
    expect(ids({ role: ['ai_ml'] })).toContain('ai_work')
    expect(ids({ role: ['ai_ml'] })).not.toContain('mobile_framework')
  })

  test('코딩 테스트는 지난 1년 동안 지원해 본 사람에게만 묻는다', () => {
    expect(ids({ job_search: 'browsed' })).not.toContain('coding_test')
    expect(ids({ job_search: 'applied' })).toContain('coding_test')
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

  test('기타를 고른 경우에만 직접 적은 내용을 남긴다', () => {
    const picked = cleanAnswers(QUESTIONS, { ...employed, role: ['other'], role_other: '  게임 클라이언트 ' })
    expect(picked.ok && picked.answers.role_other).toBe('게임 클라이언트')
    const notPicked = cleanAnswers(QUESTIONS, { ...employed, role_other: '게임 클라이언트' })
    expect(notPicked.ok && notPicked.answers.role_other).toBeUndefined()
    const blank = cleanAnswers(QUESTIONS, { ...employed, role: ['other'], role_other: '  ' })
    expect(blank.ok && 'role_other' in blank.answers).toBe(false)
  })

  test('기타 내용이 너무 길거나 글자가 아니면 거절한다', () => {
    expect(cleanAnswers(QUESTIONS, { ...employed, role: ['other'], role_other: 'a'.repeat(101) }).ok).toBe(false)
    expect(cleanAnswers(QUESTIONS, { ...employed, role: ['other'], role_other: ['x'] }).ok).toBe(false)
  })
})
