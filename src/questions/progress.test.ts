import { describe, expect, test } from 'bun:test'
import { restoreProgress } from './progress'
import { questionsFor } from './survey'

const QUESTIONS = questionsFor('2026')!

describe('restoreProgress', () => {
  test('저장한 답과 머물던 문항을 그대로 되살린다', () => {
    const saved = { answers: { status: 'employed', experience: '3_5' }, qid: 'role' }
    expect(restoreProgress(QUESTIONS, saved)).toEqual(saved)
  })

  test('지금 문항에 없거나 형식에 맞지 않는 답은 버린다', () => {
    const restored = restoreProgress(QUESTIONS, {
      answers: { status: 'employed', removed_question: 'x', experience: 'nope', role: ['backend', 'backend'] },
      qid: 'experience',
    })
    expect(restored).toEqual({ answers: { status: 'employed' }, qid: 'experience' })
  })

  test('기타 내용은 기타를 골랐을 때만 남긴다', () => {
    const picked = restoreProgress(QUESTIONS, { answers: { status: 'employed', role: ['other'], role_other: '게임 서버' }, qid: 'role' })
    expect(picked?.answers.role_other).toBe('게임 서버')
    const notPicked = restoreProgress(QUESTIONS, { answers: { status: 'employed', role: ['backend'], role_other: '게임 서버' }, qid: 'role' })
    expect(notPicked?.answers).not.toHaveProperty('role_other')
  })

  test('머물던 문항이 보이지 않으면 답하지 않은 첫 문항으로 보낸다', () => {
    // employment_type 은 현업일 때만 보인다
    const restored = restoreProgress(QUESTIONS, { answers: { status: 'student' }, qid: 'employment_type' })
    expect(restored?.qid).toBe('experience')
  })

  test('되살릴 답이 없거나 값이 깨졌으면 null', () => {
    for (const saved of [null, 'x', [], { answers: [] }, { answers: {} }, { answers: { status: 42 } }]) {
      expect(restoreProgress(QUESTIONS, saved)).toBeNull()
    }
  })
})
