import { describe, expect, test } from 'bun:test'
import { questionsFor } from '@/questions/survey'
import type { QuestionStat, ResultSet } from './aggregate'
import { COMPARISONS, comparisonViews, groupedLines } from './comparisons'

const stat = (id: string, shares: [string, number][], hidden = false): QuestionStat => ({
  id,
  sectionId: 's',
  section: 's',
  label: id,
  type: 'multi',
  order: 'nominal',
  shown: 100,
  answered: 100,
  hidden,
  options: shares.map(([code, share]) => ({ code, label: code, count: share * 100, share })),
})

const result = (questions: QuestionStat[]): ResultSet => ({ edition: '2026', sample: false, total: 100, questions, breakdowns: [] })

describe('문항 비교 설정', () => {
  for (const [edition, comparisons] of Object.entries(COMPARISONS)) {
    // 예시 회차는 문항 파일 없이 2026 문항을 빌려 쓴다
    const questions = questionsFor(edition) ?? questionsFor('2026')!
    const codes = (id: string) => questions.find((q) => q.id === id)?.options.map((o) => o.code)

    for (const c of comparisons) {
      test(`${edition} ${c.id}: 문항이 회차에 있다`, () => {
        for (const { id } of c.questions) expect(codes(id)).toBeDefined()
      })

      if (c.layout === 'grouped') {
        test(`${edition} ${c.id}: 뒤 문항의 선택지는 모두 첫 문항에 있다`, () => {
          const first = codes(c.questions[0].id)
          for (const { id } of c.questions.slice(1)) expect(first).toEqual(expect.arrayContaining(codes(id)!))
        })
      } else {
        test(`${edition} ${c.id}: 좌우로 그리는 비교는 문항이 둘이다`, () => {
          expect(c.questions).toHaveLength(2)
        })
      }
    }
  }
})

describe('문항 비교 데이터', () => {
  test('숨긴 문항은 빼고, 남은 문항이 둘보다 적으면 비교를 보여 주지 않는다', () => {
    const views = comparisonViews(
      result([
        stat('job_good', [['pay', 0.5]]),
        stat('job_pain', [['pay', 0.3]], true),
        stat('company_criteria', [['pay', 0.7]]),
        stat('salary', [['lt_20', 0.2]]),
        stat('total_comp', [['lt_20', 0.1]], true),
      ]),
    )
    expect(views.map((v) => v.comparison.id)).toEqual(['workplace'])
    expect(views[0].series.map((s) => s.q.id)).toEqual(['job_good', 'company_criteria'])
  })

  test('줄은 첫 문항의 결과 화면 순서를 따르고, 다른 문항에 없는 선택지는 비워 둔다', () => {
    const [view] = comparisonViews(
      result([
        stat('job_good', [['pay', 0.2], ['tech', 0.6], ['other', 0.9]]),
        stat('job_pain', [['pay', 0.4], ['tech', 0.1], ['other', 0.1]]),
        stat('company_criteria', [['pay', 0.8], ['other', 0.1]]),
      ]),
    )
    expect(groupedLines(view)).toEqual([
      { code: 'tech', label: 'tech', shares: [0.6, 0.1, undefined] },
      { code: 'pay', label: 'pay', shares: [0.2, 0.4, 0.8] },
      { code: 'other', label: 'other', shares: [0.9, 0.1, 0.1] },
    ])
  })
})
