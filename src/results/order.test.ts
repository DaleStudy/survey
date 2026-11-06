import { describe, expect, test } from 'bun:test'
import type { QuestionStat } from './aggregate'
import { displayOptions } from './order'

const stat = (order: QuestionStat['order'], shares: [string, number][]): QuestionStat => ({
  id: 'q',
  section: 's',
  label: 'q',
  type: 'single',
  order,
  shown: 100,
  answered: 100,
  hidden: false,
  options: shares.map(([code, share]) => ({ code, label: code, count: share * 100, share })),
})

const codes = (q: QuestionStat) => displayOptions(q).map((o) => o.code)

describe('결과 선택지 순서', () => {
  test('nominal 은 비율이 높은 순이다', () => {
    expect(codes(stat('nominal', [['java', 0.2], ['python', 0.5], ['go', 0.3]]))).toEqual(['python', 'go', 'java'])
  })

  test('nominal 이어도 기타·모르겠음·무응답은 맨 아래에 원래 순서대로 둔다', () => {
    const q = stat('nominal', [['unknown', 0.4], ['aws', 0.3], ['other', 0.5], ['gcp', 0.1]])
    expect(codes(q)).toEqual(['aws', 'gcp', 'unknown', 'other'])
  })

  test('비율이 같으면 원래 순서를 지킨다', () => {
    expect(codes(stat('nominal', [['a', 0.3], ['b', 0.4], ['c', 0.3]]))).toEqual(['b', 'a', 'c'])
  })

  test('ordinal 과 order 가 없는 예전 집계는 원래 순서 그대로다', () => {
    const shares: [string, number][] = [['lt_20', 0.1], ['20_30', 0.5], ['30_40', 0.4]]
    expect(codes(stat('ordinal', shares))).toEqual(['lt_20', '20_30', '30_40'])
    expect(codes(stat(undefined, shares))).toEqual(['lt_20', '20_30', '30_40'])
  })

  test('원본 배열을 바꾸지 않는다', () => {
    const q = stat('nominal', [['a', 0.1], ['b', 0.9]])
    displayOptions(q)
    expect(q.options.map((o) => o.code)).toEqual(['a', 'b'])
  })
})
