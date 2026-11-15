import { describe, expect, test } from 'bun:test'
import r2025 from './2025.json'
import type { ResultSet } from './aggregate'
import { sharedCharts } from './share'

const result = r2025 as unknown as ResultSet

describe('공유할 수 있는 차트', () => {
  const charts = sharedCharts(result)
  const ids = charts.map((c) => c.id)

  test('주소로 쓰는 id 가 겹치지 않는다', () => {
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('숨긴 문항과 자유 의견은 공유하지 않는다', () => {
    for (const q of result.questions.filter((q) => q.hidden || q.type === 'long')) expect(ids).not.toContain(q.id)
  })

  test('문항 비교도 공유할 수 있다', () => {
    expect(ids).toContain('compare-ai')
  })
})
